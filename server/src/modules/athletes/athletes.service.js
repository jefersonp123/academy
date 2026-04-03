import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function list(academyId, filters, { from, to }) {
  let query = supabaseAdmin
    .from('athlete_academy_enrollments')
    .select(`
      id, membership_status, joined_at, can_train, medical_clearance_status,
      athletes(id, first_name, last_name, birth_date, gender, document_number, phone, email),
      categories(id, name)
    `, { count: 'exact' })
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('membership_status', filters.status);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);

  const { data, error, count } = await query;
  if (error) throw new AppError('Failed to fetch athletes', 500, 'FETCH_FAILED');
  return { data, total: count };
}

export async function create(academyId, payload, createdBy) {
  const { category_id, medical_clearance_status, ...athleteData } = payload;

  const { data: athlete, error: athleteError } = await supabaseAdmin
    .from('athletes')
    .insert({ ...athleteData, created_by: createdBy })
    .select()
    .single();

  if (athleteError) throw new AppError('Failed to create athlete', 500, 'CREATE_FAILED');

  const { data: enrollment, error: enrollError } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .insert({
      academy_id: academyId,
      athlete_id: athlete.id,
      category_id: category_id || null,
      membership_status: 'active',
      joined_at: new Date().toISOString(),
      medical_clearance_status: medical_clearance_status || 'pending',
      can_train: false,
      created_by: createdBy,
    })
    .select()
    .single();

  if (enrollError) throw new AppError('Failed to enroll athlete', 500, 'ENROLLMENT_FAILED');

  return { athlete, enrollment };
}

export async function getOne(academyId, athleteId) {
  const { data, error } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .select(`
      id, membership_status, joined_at, left_at, can_train, medical_clearance_status,
      athletes(id, first_name, last_name, birth_date, gender, document_number, phone, email, notes),
      categories(id, name)
    `)
    .eq('academy_id', academyId)
    .eq('athlete_id', athleteId)
    .single();

  if (error) throw new AppError('Athlete not found in this academy', 404, 'NOT_FOUND');
  return data;
}

export async function update(academyId, athleteId, payload) {
  const { data: enrollment } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .select('athlete_id')
    .eq('academy_id', academyId)
    .eq('athlete_id', athleteId)
    .single();

  if (!enrollment) throw new AppError('Athlete not found in this academy', 404, 'NOT_FOUND');

  const { data, error } = await supabaseAdmin
    .from('athletes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', athleteId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update athlete', 500, 'UPDATE_FAILED');
  return data;
}

export async function updateEnrollmentStatus(academyId, athleteId, membership_status) {
  const updates = { membership_status, updated_at: new Date().toISOString() };
  if (membership_status === 'inactive' || membership_status === 'archived') {
    updates.left_at = new Date().toISOString();
    updates.can_train = false;
  }

  const { data, error } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .update(updates)
    .eq('academy_id', academyId)
    .eq('athlete_id', athleteId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update athlete status', 500, 'UPDATE_FAILED');
  return data;
}

export async function updateCategory(academyId, athleteId, category_id) {
  const { data, error } = await supabaseAdmin
    .from('athlete_academy_enrollments')
    .update({ category_id, updated_at: new Date().toISOString() })
    .eq('academy_id', academyId)
    .eq('athlete_id', athleteId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update athlete category', 500, 'UPDATE_FAILED');
  return data;
}

export async function listGuardians(athleteId) {
  const { data, error } = await supabaseAdmin
    .from('guardian_links')
    .select('id, relationship_type, is_primary, created_at, profiles(id, first_name, last_name, email, phone)')
    .eq('athlete_id', athleteId);

  if (error) throw new AppError('Failed to fetch guardians', 500, 'FETCH_FAILED');
  return data;
}

export async function addGuardian(athleteId, { guardian_profile_id, relationship_type, is_primary }) {
  const { data: existing } = await supabaseAdmin
    .from('guardian_links')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('guardian_profile_id', guardian_profile_id)
    .maybeSingle();

  if (existing) throw new AppError('Guardian already linked to this athlete', 409, 'ALREADY_LINKED');

  if (is_primary) {
    await supabaseAdmin
      .from('guardian_links')
      .update({ is_primary: false })
      .eq('athlete_id', athleteId);
  }

  const { data, error } = await supabaseAdmin
    .from('guardian_links')
    .insert({ athlete_id: athleteId, guardian_profile_id, relationship_type, is_primary: is_primary || false })
    .select()
    .single();

  if (error) throw new AppError('Failed to add guardian', 500, 'CREATE_FAILED');
  return data;
}

export async function removeGuardian(athleteId, guardianLinkId) {
  const { error } = await supabaseAdmin
    .from('guardian_links')
    .delete()
    .eq('id', guardianLinkId)
    .eq('athlete_id', athleteId);

  if (error) throw new AppError('Failed to remove guardian', 500, 'DELETE_FAILED');
}
