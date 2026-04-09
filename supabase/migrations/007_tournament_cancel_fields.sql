-- Add missing fields for tournament cancellation
alter table tournaments
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_by uuid references profiles(id);
