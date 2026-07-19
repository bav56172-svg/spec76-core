begin;

-- EP-023 Billing RLS functional test
-- Safe to run in Supabase SQL Editor.
-- All test tables and data are removed by the final ROLLBACK.
-- Requires at least two existing users in auth.users.

create table public.ep023_rls_test_results_7f3a (
  test_name text primary key,
  passed boolean not null,
  details text not null
);

create table public.ep023_rls_test_seed_7f3a (
  user_number integer primary key,
  user_id uuid not null,
  billing_customer_id uuid not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null
);

grant select, insert, update
on table public.ep023_rls_test_results_7f3a
to authenticated, service_role;

grant select
on table public.ep023_rls_test_seed_7f3a
to authenticated, service_role;

insert into public.ep023_rls_test_seed_7f3a (
  user_number,
  user_id,
  billing_customer_id,
  stripe_customer_id,
  stripe_subscription_id
)
select
  row_number() over (order by created_at, id),
  id,
  gen_random_uuid(),
  'cus_ep023_' || replace(gen_random_uuid()::text, '-', ''),
  'sub_ep023_' || replace(gen_random_uuid()::text, '-', '')
from auth.users
order by created_at, id
limit 2;

do $$
begin
  if (select count(*) from public.ep023_rls_test_seed_7f3a) < 2 then
    raise exception 'EP-023 test requires at least two users in auth.users';
  end if;
end;
$$;

insert into public.billing_customers (
  id,
  user_id,
  stripe_customer_id
)
select
  billing_customer_id,
  user_id,
  stripe_customer_id
from public.ep023_rls_test_seed_7f3a;

insert into public.billing_subscriptions (
  billing_customer_id,
  user_id,
  stripe_subscription_id,
  stripe_price_id,
  status
)
select
  billing_customer_id,
  user_id,
  stripe_subscription_id,
  'price_ep023_test',
  'active'
from public.ep023_rls_test_seed_7f3a;

select set_config(
  'request.jwt.claim.sub',
  (
    select user_id::text
    from public.ep023_rls_test_seed_7f3a
    where user_number = 1
  ),
  true
);

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

insert into public.ep023_rls_test_results_7f3a values (
  'authenticated_reads_own_customer',
  (
    select count(*) = 1
    from public.billing_customers
    where user_id = (
      select user_id
      from public.ep023_rls_test_seed_7f3a
      where user_number = 1
    )
  ),
  'Authenticated user must read exactly one own billing_customers row.'
);

insert into public.ep023_rls_test_results_7f3a values (
  'authenticated_cannot_read_other_customer',
  (
    select count(*) = 0
    from public.billing_customers
    where user_id = (
      select user_id
      from public.ep023_rls_test_seed_7f3a
      where user_number = 2
    )
  ),
  'Authenticated user must not read another user billing_customers row.'
);

insert into public.ep023_rls_test_results_7f3a values (
  'authenticated_reads_own_subscription',
  (
    select count(*) = 1
    from public.billing_subscriptions
    where user_id = (
      select user_id
      from public.ep023_rls_test_seed_7f3a
      where user_number = 1
    )
  ),
  'Authenticated user must read exactly one own billing_subscriptions row.'
);

insert into public.ep023_rls_test_results_7f3a values (
  'authenticated_cannot_read_other_subscription',
  (
    select count(*) = 0
    from public.billing_subscriptions
    where user_id = (
      select user_id
      from public.ep023_rls_test_seed_7f3a
      where user_number = 2
    )
  ),
  'Authenticated user must not read another user billing_subscriptions row.'
);

do $$
begin
  begin
    insert into public.billing_customers (user_id, stripe_customer_id)
    values (
      (
        select user_id
        from public.ep023_rls_test_seed_7f3a
        where user_number = 1
      ),
      'cus_ep023_forbidden_' || replace(gen_random_uuid()::text, '-', '')
    );

    insert into public.ep023_rls_test_results_7f3a values (
      'authenticated_insert_denied',
      false,
      'Unexpected INSERT success.'
    );
  exception
    when insufficient_privilege then
      insert into public.ep023_rls_test_results_7f3a values (
        'authenticated_insert_denied',
        true,
        'INSERT was denied as expected.'
      );
  end;

  begin
    update public.billing_customers
    set stripe_customer_id = 'cus_ep023_forbidden_update'
    where user_id = (
      select user_id
      from public.ep023_rls_test_seed_7f3a
      where user_number = 1
    );

    insert into public.ep023_rls_test_results_7f3a values (
      'authenticated_update_denied',
      false,
      'Unexpected UPDATE success.'
    );
  exception
    when insufficient_privilege then
      insert into public.ep023_rls_test_results_7f3a values (
        'authenticated_update_denied',
        true,
        'UPDATE was denied as expected.'
      );
  end;

  begin
    delete from public.billing_customers
    where user_id = (
      select user_id
      from public.ep023_rls_test_seed_7f3a
      where user_number = 1
    );

    insert into public.ep023_rls_test_results_7f3a values (
      'authenticated_delete_denied',
      false,
      'Unexpected DELETE success.'
    );
  exception
    when insufficient_privilege then
      insert into public.ep023_rls_test_results_7f3a values (
        'authenticated_delete_denied',
        true,
        'DELETE was denied as expected.'
      );
  end;

  begin
    perform 1 from public.billing_webhook_events limit 1;

    insert into public.ep023_rls_test_results_7f3a values (
      'authenticated_webhook_log_denied',
      false,
      'Unexpected billing_webhook_events SELECT success.'
    );
  exception
    when insufficient_privilege then
      insert into public.ep023_rls_test_results_7f3a values (
        'authenticated_webhook_log_denied',
        true,
        'billing_webhook_events SELECT was denied as expected.'
      );
  end;
end;
$$;

reset role;

do $$
declare
  test_event_id text := 'evt_ep023_' || replace(gen_random_uuid()::text, '-', '');
begin
  insert into public.billing_webhook_events (
    stripe_event_id,
    event_type,
    processing_status,
    processed_at
  ) values (
    test_event_id,
    'ep023.test',
    'processed',
    now()
  );

  begin
    insert into public.billing_webhook_events (
      stripe_event_id,
      event_type,
      processing_status,
      processed_at
    ) values (
      test_event_id,
      'ep023.test.duplicate',
      'processed',
      now()
    );

    insert into public.ep023_rls_test_results_7f3a values (
      'duplicate_stripe_event_denied',
      false,
      'Unexpected duplicate stripe_event_id success.'
    );
  exception
    when unique_violation then
      insert into public.ep023_rls_test_results_7f3a values (
        'duplicate_stripe_event_denied',
        true,
        'Duplicate stripe_event_id was denied as expected.'
      );
  end;
end;
$$;

set local role service_role;

do $$
begin
  begin
    insert into public.billing_webhook_events (
      stripe_event_id,
      event_type,
      processing_status,
      processed_at
    ) values (
      'evt_ep023_service_' || replace(gen_random_uuid()::text, '-', ''),
      'ep023.service_role',
      'processed',
      now()
    );

    insert into public.ep023_rls_test_results_7f3a values (
      'service_role_webhook_write_allowed',
      true,
      'service_role INSERT succeeded.'
    );
  exception
    when others then
      insert into public.ep023_rls_test_results_7f3a values (
        'service_role_webhook_write_allowed',
        false,
        'service_role INSERT failed: ' || sqlstate || ' ' || sqlerrm
      );
  end;
end;
$$;

reset role;

select jsonb_pretty(
  jsonb_build_object(
    'all_passed', bool_and(passed),
    'passed_count', count(*) filter (where passed),
    'failed_count', count(*) filter (where not passed),
    'results', jsonb_agg(
      jsonb_build_object(
        'test_name', test_name,
        'passed', passed,
        'details', details
      )
      order by test_name
    )
  )
) as ep_023_billing_rls_functional_test
from public.ep023_rls_test_results_7f3a;

rollback;
