alter table public.currency_transactions
  alter column source_id type text using source_id::text;

alter table public.currency_transactions
  drop constraint if exists currency_transactions_user_source_unique;

alter table public.currency_transactions
  add constraint currency_transactions_user_source_unique
  unique (user_id, source_type, source_id);
