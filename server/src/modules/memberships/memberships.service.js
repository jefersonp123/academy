import { randomBytes, createHash } from 'crypto';
import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function list(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('academy_memberships')
    .select('*, profiles(id, first_name, last_name, email, avatar_url)', { count: 'exact' })
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.role_code) query = query.eq('role_code', filters.role_code);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch memberships', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function create(academyId, { profile_id, role_code }, createdBy) {
  const { data: existing } = await supabaseAdmin
    .from('academy_memberships')
    .select('id, status')
    .eq('academy_id', academyId)
    .eq('profile_id', profile_id)
    .maybeSingle();

  if (existing && existing.status === 'active') {
    throw new AppError('Profile already has an active membership', 409, 'ALREADY_MEMBER');
  }

  const { data, error } = await supabaseAdmin
    .from('academy_memberships')
    .insert({ academy_id: academyId, profile_id, role_code, status: 'active', joined_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw new AppError('Failed to create membership', 500, 'CREATE_FAILED');
  return data;
}

export async function getOne(academyId, id) {
  const { data, error } = await supabaseAdmin
    .from('academy_memberships')
    .select('*, profiles(id, first_name, last_name, email, avatar_url)')
    .eq('academy_id', academyId)
    .eq('id', id)
    .single();

  if (error) throw new AppError('Membership not found', 404, 'NOT_FOUND');
  return data;
}

export async function update(academyId, id, payload) {
  const { data, error } = await supabaseAdmin
    .from('academy_memberships')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update membership', 500, 'UPDATE_FAILED');
  return data;
}

export async function updateRole(academyId, id, role_code) {
  return update(academyId, id, { role_code });
}

export async function updateStatus(academyId, id, status) {
  return update(academyId, id, { status });
}

export async function createInvitation(academyId, { email, role_code }, createdBy) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Cancel any existing pending invitation for same email+academy
  await supabaseAdmin
    .from('academy_invitations')
    .update({ status: 'cancelled' })
    .eq('academy_id', academyId)
    .eq('email', email)
    .eq('status', 'pending');

  const { data, error } = await supabaseAdmin
    .from('academy_invitations')
    .insert({ academy_id: academyId, email, role_code, token_hash: tokenHash, status: 'pending', expires_at: expiresAt, created_by: createdBy })
    .select()
    .single();

  if (error) throw new AppError('Failed to create invitation', 500, 'CREATE_FAILED');
  return { ...data, token }; // Return plain token once so frontend can send via email
}

export async function resendInvitation(academyId, invitationId) {
  const { data, error } = await supabaseAdmin
    .from('academy_invitations')
    .select('id, status')
    .eq('academy_id', academyId)
    .eq('id', invitationId)
    .single();

  if (error || !data) throw new AppError('Invitation not found', 404, 'NOT_FOUND');
  if (data.status !== 'pending') throw new AppError('Invitation is not pending', 400, 'INVALID_STATE');

  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from('academy_invitations')
    .update({ expires_at: newExpiry })
    .eq('id', invitationId);
}

export async function cancelInvitation(academyId, invitationId) {
  const { error } = await supabaseAdmin
    .from('academy_invitations')
    .update({ status: 'cancelled' })
    .eq('academy_id', academyId)
    .eq('id', invitationId)
    .eq('status', 'pending');

  if (error) throw new AppError('Failed to cancel invitation', 500, 'UPDATE_FAILED');
}

export async function acceptInvitation(profileId, token) {
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const { data: invitation, error } = await supabaseAdmin
    .from('academy_invitations')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('status', 'pending')
    .single();

  if (error || !invitation) throw new AppError('Invalid or expired invitation', 400, 'INVALID_INVITATION');
  if (new Date(invitation.expires_at) < new Date()) throw new AppError('Invitation has expired', 400, 'INVITATION_EXPIRED');

  await supabaseAdmin.from('academy_memberships').insert({
    academy_id: invitation.academy_id,
    profile_id: profileId,
    role_code: invitation.role_code,
    status: 'active',
    joined_at: new Date().toISOString(),
  });

  await supabaseAdmin.from('academy_invitations').update({ status: 'accepted' }).eq('id', invitation.id);

  return { academy_id: invitation.academy_id, role_code: invitation.role_code };
}
