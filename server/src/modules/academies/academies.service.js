import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

export async function listForProfile(profileId) {
  const { data, error } = await supabaseAdmin
    .from('academy_memberships')
    .select('role_code, status, academies(id, name, slug, sport_type, country, currency_code, timezone, status)')
    .eq('profile_id', profileId)
    .eq('status', 'active');

  if (error) throw new AppError('Failed to fetch academies', 500, 'FETCH_FAILED');
  return data;
}

export async function getById(academyId) {
  const { data, error } = await supabaseAdmin
    .from('academies')
    .select('*')
    .eq('id', academyId)
    .single();

  if (error) throw new AppError('Academy not found', 404, 'NOT_FOUND');
  return data;
}

export async function update(academyId, payload) {
  const { data, error } = await supabaseAdmin
    .from('academies')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', academyId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update academy', 500, 'UPDATE_FAILED');
  return data;
}

export async function getSettings(academyId) {
  const { data, error } = await supabaseAdmin
    .from('academy_settings')
    .select('*')
    .eq('academy_id', academyId)
    .maybeSingle();

  if (error) throw new AppError('Failed to fetch settings', 500, 'FETCH_FAILED');
  return data || { academy_id: academyId };
}

export async function updateSettings(academyId, payload) {
  const { data, error } = await supabaseAdmin
    .from('academy_settings')
    .upsert({ academy_id: academyId, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'academy_id' })
    .select()
    .single();

  if (error) throw new AppError('Failed to update settings', 500, 'UPDATE_FAILED');
  return data;
}
