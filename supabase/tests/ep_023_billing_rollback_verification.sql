-- EP-023 Billing rollback verification
-- Run only in a separate Supabase test project.
-- This script is intentionally non-persistent: the final ROLLBACK restores all objects.

begin;

-- Preconditions: the forward migration must be present before rollback verification.
do $$
begin
  if to_regclass('public.billing_customers') is null then
    raise exception 'Precondition failed: public.billing_customers does not exist';
  end if;

  if to_regclass('public.billing_subscriptions') is null then
    raise exception 'Precondition failed: public.billing_subscriptions does not exist';
  end if;

  if to_regclass('public.billing_webhook_events') is null then
    raise exception 'Precondition failed: public.billing_webhook_events does not exist';
  end if;

  if to_regprocedure('public.billing_set_updated_at()') is null then
    raise exception 'Precondition failed: public.billing_set_updated_at() does not exist';
  end if;
end;
$$;

-- Roll back EP-023 objects in dependency-safe order.
drop table public.billing_subscriptions;
drop table public.billing_webhook_events;
drop table public.billing_customers;
drop function public.billing_set_updated_at();

-- Verify that rollback removed every EP-023 database object.
do $$
begin
  if to_regclass('public.billing_customers') is not null then
    raise exception 'Rollback failed: public.billing_customers still exists';
  end if;

  if to_regclass('public.billing_subscriptions') is not null then
    raise exception 'Rollback failed: public.billing_subscriptions still exists';
  end if;

  if to_regclass('public.billing_webhook_events') is not null then
    raise exception 'Rollback failed: public.billing_webhook_events still exists';
  end if;

  if to_regprocedure('public.billing_set_updated_at()') is not null then
    raise exception 'Rollback failed: public.billing_set_updated_at() still exists';
  end if;

  raise notice 'EP-023 rollback verification passed inside the transaction';
end;
$$;

-- Restore the test database to its pre-test state.
rollback;

-- Postcondition: ROLLBACK must have restored all forward-migration objects.
do $$
begin
  if to_regclass('public.billing_customers') is null then
    raise exception 'Restoration failed: public.billing_customers was not restored';
  end if;

  if to_regclass('public.billing_subscriptions') is null then
    raise exception 'Restoration failed: public.billing_subscriptions was not restored';
  end if;

  if to_regclass('public.billing_webhook_events') is null then
    raise exception 'Restoration failed: public.billing_webhook_events was not restored';
  end if;

  if to_regprocedure('public.billing_set_updated_at()') is null then
    raise exception 'Restoration failed: public.billing_set_updated_at() was not restored';
  end if;

  raise notice 'EP-023 rollback restoration verification passed';
end;
$$;
