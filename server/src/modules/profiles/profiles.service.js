import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function getById(profileId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, email, phone, avatar_url, status, last_active_academy_id, created_at, updated_at')
    .eq('id', profileId)
    .single();

  if (error) throw new AppError('Profile not found', 404, 'NOT_FOUND');
  return data;
}

export async function update(profileId, payload) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update profile', 500, 'UPDATE_FAILED');
  return data;
}

export async function getAcademies(profileId) {
  const { data, error } = await supabaseAdmin
    .from('academy_memberships')
    .select('id, role_code, status, joined_at, academies(id, name, slug, sport_type, country, currency_code, status)')
    .eq('profile_id', profileId)
    .in('status', ['active', 'pending']);

  if (error) throw new AppError('Failed to fetch academies', 500, 'FETCH_FAILED');
  return data;
}
