begin;

-- EP-023 Billing Recovery
-- Source of truth: Supabase.
-- The legacy public.billing table was confirmed absent before this migration.

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stripe_customer_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_customers_user_id_fkey
    foreign key (user_id)
    references auth.users (id)
    on delete cascade,

  constraint billing_customers_user_id_key
    unique (user_id),

  constraint billing_customers_stripe_customer_id_key
    unique (stripe_customer_id),

  constraint billing_customers_id_user_id_key
    unique (id, user_id),

  constraint billing_customers_stripe_customer_id_not_blank
    check (length(btrim(stripe_customer_id)) > 0)
);

comment on table public.billing_customers is
  'Server-managed mapping between a SPEC76 user and one Stripe customer.';
comment on column public.billing_customers.stripe_customer_id is
  'Stripe customer identifier. It must only be written by trusted server code.';

create table public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null,
  user_id uuid not null,
  stripe_subscription_id text not null,
  stripe_price_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_subscriptions_customer_user_fkey
    foreign key (billing_customer_id, user_id)
    references public.billing_customers (id, user_id)
    on delete cascade,

  constraint billing_subscriptions_stripe_subscription_id_key
    unique (stripe_subscription_id),

  constraint billing_subscriptions_stripe_subscription_id_not_blank
    check (length(btrim(stripe_subscription_id)) > 0),

  constraint billing_subscriptions_stripe_price_id_not_blank
    check (length(btrim(stripe_price_id)) > 0),

  constraint billing_subscriptions_status_check
    check (
      status in (
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'incomplete',
        'incomplete_expired',
        'paused'
      )
    ),

  constraint billing_subscriptions_period_check
    check (
      current_period_start is null
      or current_period_end is null
      or current_period_end >= current_period_start
    )
);

comment on table public.billing_subscriptions is
  'Server-managed Stripe subscription state. Authenticated users may only read their own rows.';

create index billing_subscriptions_user_id_idx
  on public.billing_subscriptions (user_id);

create index billing_subscriptions_billing_customer_id_idx
  on public.billing_subscriptions (billing_customer_id);

create index billing_subscriptions_status_idx
  on public.billing_subscriptions (status);

create table public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null,
  event_type text not null,
  processing_status text not null default 'processing',
  processing_attempts integer not null default 1,
  event_payload jsonb not null default '{}'::jsonb,
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now(),

  constraint billing_webhook_events_stripe_event_id_key
    unique (stripe_event_id),

  constraint billing_webhook_events_stripe_event_id_not_blank
    check (length(btrim(stripe_event_id)) > 0),

  constraint billing_webhook_events_event_type_not_blank
    check (length(btrim(event_type)) > 0),

  constraint billing_webhook_events_processing_status_check
    check (processing_status in ('processing', 'processed', 'failed', 'ignored')),

  constraint billing_webhook_events_processing_attempts_check
    check (processing_attempts > 0),

  constraint billing_webhook_events_processed_at_check
    check (
      processing_status not in ('processed', 'ignored')
      or processed_at is not null
    )
);

comment on table public.billing_webhook_events is
  'Private idempotency and audit log for Stripe webhook processing.';
comment on column public.billing_webhook_events.event_payload is
  'Minimized Stripe event data required for support and audit; do not store unnecessary personal data.';

create index billing_webhook_events_event_type_idx
  on public.billing_webhook_events (event_type);

create index billing_webhook_events_processing_status_idx
  on public.billing_webhook_events (processing_status);

create index billing_webhook_events_received_at_idx
  on public.billing_webhook_events (received_at desc);

create function public.billing_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger billing_customers_set_updated_at
before update on public.billing_customers
for each row
execute function public.billing_set_updated_at();

create trigger billing_subscriptions_set_updated_at
before update on public.billing_subscriptions
for each row
execute function public.billing_set_updated_at();

create trigger billing_webhook_events_set_updated_at
before update on public.billing_webhook_events
for each row
execute function public.billing_set_updated_at();

alter table public.billing_customers enable row level security;
alter table public.billing_customers force row level security;

alter table public.billing_subscriptions enable row level security;
alter table public.billing_subscriptions force row level security;

alter table public.billing_webhook_events enable row level security;
alter table public.billing_webhook_events force row level security;

create policy billing_customers_select_own
on public.billing_customers
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy billing_subscriptions_select_own
on public.billing_subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);

-- No user-facing policies are created for INSERT, UPDATE, or DELETE.
-- No user-facing policies are created for billing_webhook_events.
-- Trusted billing writes must use the server-side service role.

revoke all on table public.billing_customers from anon, authenticated;
revoke all on table public.billing_subscriptions from anon, authenticated;
revoke all on table public.billing_webhook_events from anon, authenticated;

revoke all on function public.billing_set_updated_at() from public, anon, authenticated;

grant select on table public.billing_customers to authenticated;
grant select on table public.billing_subscriptions to authenticated;

grant all on table public.billing_customers to service_role;
grant all on table public.billing_subscriptions to service_role;
grant all on table public.billing_webhook_events to service_role;
grant execute on function public.billing_set_updated_at() to service_role;

commit;
