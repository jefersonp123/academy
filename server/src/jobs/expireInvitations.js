import { supabaseAdmin } from '../config/supabase.js';

export async function expireInvitations() {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('academy_invitations')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', now)
    .select('id');

  if (error) throw new Error(`expireInvitations: ${error.message}`);
  console.log(`[jobs] expired ${data?.length || 0} invitations`);
}
