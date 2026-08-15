begin;

-- EP-023 AI Usage Migration
-- Draft only.
-- Source of truth: Supabase.
-- No production execution without approval.

create table public.ai_usage (
  id uuid primary key default extensions.gen_random_uuid(),

  project_id uuid not null,
  company_id uuid not null,
  user_id uuid not null,

  operation_type text not null,
  provider text,
  model text,

  input_tokens integer,
  output_tokens integer,

  created_at timestamptz not null default now(),

  constraint ai_usage_project_fkey
    foreign key (project_id)
    references public.projects(id)
    on delete cascade,

  constraint ai_usage_company_fkey
    foreign key (company_id)
    references public.companies(id)
    on delete cascade,

  constraint ai_usage_user_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,

  constraint ai_usage_operation_type_not_blank
    check (length(btrim(operation_type)) > 0),

  constraint ai_usage_input_tokens_check
    check (
      input_tokens is null
      or input_tokens >= 0
    ),

  constraint ai_usage_output_tokens_check
    check (
      output_tokens is null
      or output_tokens >= 0
    )
);

comment on table public.ai_usage is
  'Server-managed AI usage audit records for C-006 AI Request Foundation.';

create index ai_usage_project_created_idx
  on public.ai_usage(project_id, created_at desc);

create index ai_usage_company_created_idx
  on public.ai_usage(company_id, created_at desc);

create index ai_usage_user_created_idx
  on public.ai_usage(user_id, created_at desc);


alter table public.ai_usage enable row level security;
alter table public.ai_usage force row level security;


create policy ai_usage_select_access
on public.ai_usage
for select
to authenticated
using (
  public.can_access_project(project_id)
);


revoke all on table public.ai_usage from anon, authenticated;

grant select on table public.ai_usage to authenticated;

grant all on table public.ai_usage to service_role;


-- Rollback:
-- drop table public.ai_usage;

commit;
