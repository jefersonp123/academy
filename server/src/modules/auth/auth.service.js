import { supabaseAdmin, supabaseAnon } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function register({ email, password, first_name, last_name, phone }) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');
    }
    throw new AppError(authError.message, 400, 'REGISTRATION_FAILED');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      auth_user_id: authData.user.id,
      email,
      first_name,
      last_name,
      phone: phone || null,
      status: 'active',
    })
    .select()
    .single();

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new AppError('Failed to create profile', 500, 'PROFILE_CREATION_FAILED');
  }

  return { profile };
}

export async function login({ email, password }) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  if (error) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url, status, last_active_academy_id')
    .eq('auth_user_id', data.user.id)
    .single();

  if (profile?.status === 'blocked') {
    throw new AppError('Account is blocked', 403, 'ACCOUNT_BLOCKED');
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    profile,
  };
}

export async function logout(userId) {
  await supabaseAdmin.auth.admin.signOut(userId);
}

export async function refresh(refreshToken) {
  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });
  if (error) throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  };
}

export async function forgotPassword(email) {
  await supabaseAdmin.auth.resetPasswordForEmail(email);
}

export async function resetPassword({ token, password }) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(token, { password });
  if (error) throw new AppError('Failed to reset password', 400, 'RESET_FAILED');
}

export async function me(profileId) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id, first_name, last_name, email, phone, avatar_url, status, last_active_academy_id, created_at,
      profile_platform_roles(platform_roles(code, name)),
      academy_memberships(id, academy_id, role_code, status, academies(id, name, slug, sport_type))
    `)
    .eq('id', profileId)
    .single();

  if (error) throw new AppError('Profile not found', 404, 'NOT_FOUND');
  return profile;
}

export async function selectAcademy(profileId, academyId) {
  const { data: membership, error } = await supabaseAdmin
    .from('academy_memberships')
    .select('id, role_code, status')
    .eq('profile_id', profileId)
    .eq('academy_id', academyId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !membership) {
    throw new AppError('No active membership in this academy', 403, 'NO_ACADEMY_ACCESS');
  }

  await supabaseAdmin
    .from('profiles')
    .update({ last_active_academy_id: academyId })
    .eq('id', profileId);

  return { academy_id: academyId, role: membership.role_code };
}
