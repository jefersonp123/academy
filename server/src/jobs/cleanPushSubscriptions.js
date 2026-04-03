import { supabaseAdmin } from '../config/supabase.js';

export async function cleanPushSubscriptions() {
  // Remove subscriptions inactive for over 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .delete()
    .eq('is_active', false)
    .lt('updated_at', cutoff)
    .select('id');

  if (error) throw new Error(`cleanPushSubscriptions: ${error.message}`);
  console.log(`[jobs] cleaned ${data?.length || 0} stale push subscriptions`);
}
