import { supabaseAdmin } from '../config/supabase.js';

export async function markOverduePeriods() {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('payment_periods')
    .update({ status: 'overdue', updated_at: new Date().toISOString() })
    .eq('status', 'pending')
    .lt('due_date', today)
    .select('id');

  if (error) throw new Error(`markOverduePeriods: ${error.message}`);
  console.log(`[jobs] marked ${data?.length || 0} periods as overdue`);
}
