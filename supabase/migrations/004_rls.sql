-- =============================================
-- 004_rls.sql
-- Row Level Security — secondary layer
-- Primary enforcement is in the Express backend
-- =============================================

-- Profiles: users can read their own row
alter table profiles enable row level security;
create policy "profiles_own_read" on profiles
  for select using (auth.uid() = auth_user_id);
create policy "profiles_service_all" on profiles
  using (true) with check (true);

-- Notifications: users see only their own
alter table notifications enable row level security;
create policy "notifications_own" on notifications
  for select using (
    profile_id in (
      select id from profiles where auth_user_id = auth.uid()
    )
  );
create policy "notifications_service_all" on notifications
  using (true) with check (true);

-- Push subscriptions: users manage their own
alter table push_subscriptions enable row level security;
create policy "push_subscriptions_own" on push_subscriptions
  for all using (
    profile_id in (
      select id from profiles where auth_user_id = auth.uid()
    )
  );
create policy "push_subscriptions_service_all" on push_subscriptions
  using (true) with check (true);

-- All other tables use backend-enforced academy_id segregation.
-- Service role key bypasses RLS for all server operations.
