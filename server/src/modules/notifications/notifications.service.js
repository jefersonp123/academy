import webpush from 'web-push';
import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../core/errors/AppError.js';

function initVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails(
      process.env.VAPID_MAILTO || 'mailto:admin@example.com',
      pub,
      priv,
    );
    return true;
  } catch {
    return false;
  }
}

const vapidEnabled = initVapid();

export async function listForProfile(profileId, filters) {
  let query = supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filters.unread === 'true') query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch notifications', 500, 'FETCH_FAILED');
  return data;
}

export async function markRead(profileId, notificationId) {
  await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('profile_id', profileId);
}

export async function markAllRead(profileId) {
  await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', profileId)
    .eq('is_read', false);
}

export async function subscribePush(profileId, { endpoint, p256dh, auth, user_agent, academy_id }) {
  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert(
      { profile_id: profileId, academy_id: academy_id || null, endpoint, p256dh, auth, user_agent: user_agent || null, is_active: true, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id,endpoint' }
    )
    .select()
    .single();

  if (error) throw new AppError('Failed to save push subscription', 500, 'CREATE_FAILED');
  return data;
}

export async function unsubscribePush(profileId, id) {
  await supabaseAdmin
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('id', id)
    .eq('profile_id', profileId);
}

export async function createNotification(profileId, academyId, { type, title, body, payload_json }) {
  const { data } = await supabaseAdmin
    .from('notifications')
    .insert({
      profile_id: profileId,
      academy_id: academyId || null,
      type,
      title,
      body,
      payload_json: payload_json || null,
      is_read: false,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  // Attempt push delivery
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('profile_id', profileId)
    .eq('is_active', true);

  if (subs && subs.length > 0 && vapidEnabled) {
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, data: payload_json }),
        );
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabaseAdmin.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
        }
      }
    }
  }

  return data;
}

export async function sendToAcademy(academyId, { profile_ids, role_codes, type, title, body, payload_json }, sentBy) {
  let targetProfileIds = profile_ids || [];

  if (role_codes && role_codes.length > 0) {
    const { data: members } = await supabaseAdmin
      .from('academy_memberships')
      .select('profile_id')
      .eq('academy_id', academyId)
      .eq('status', 'active')
      .in('role_code', role_codes);
    targetProfileIds = [...new Set([...targetProfileIds, ...(members || []).map((m) => m.profile_id)])];
  }

  let sent = 0;
  for (const profileId of targetProfileIds) {
    await createNotification(profileId, academyId, { type, title, body, payload_json });
    sent++;
  }

  return { sent, target_count: targetProfileIds.length };
}

export async function sendPaymentReminders(academyId, { period_year, period_month, status_filter }) {
  const statuses = status_filter || ['pending', 'overdue'];

  const { data: periods } = await supabaseAdmin
    .from('payment_periods')
    .select(`
      id, total_due, due_date,
      athlete_academy_enrollments(
        athlete_user_links(profile_id),
        guardian_links(guardian_profile_id)
      )
    `)
    .eq('academy_id', academyId)
    .eq('period_year', period_year)
    .eq('period_month', period_month)
    .in('status', statuses);

  let sent = 0;
  for (const period of periods || []) {
    const enrollment = period.athlete_academy_enrollments;
    const profileIds = new Set();

    for (const link of enrollment?.athlete_user_links || []) {
      if (link.profile_id) profileIds.add(link.profile_id);
    }
    for (const gl of enrollment?.guardian_links || []) {
      if (gl.guardian_profile_id) profileIds.add(gl.guardian_profile_id);
    }

    for (const profileId of profileIds) {
      await createNotification(profileId, academyId, {
        type: 'payment_reminder',
        title: 'Recordatorio de pago',
        body: `Tienes un pago pendiente de ${period.total_due} con vencimiento ${period.due_date}.`,
        payload_json: { payment_period_id: period.id },
      });
      sent++;
    }
  }

  return { sent, periods_processed: (periods || []).length };
}
