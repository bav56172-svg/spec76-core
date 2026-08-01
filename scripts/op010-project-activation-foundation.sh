#!/usr/bin/env bash
set -euo pipefail

mkdir -p database/migrations

cat > database/migrations/20260713_005_create_project_activation.sql <<'SQL'
alter table public.projects
  add column if not exists request_id uuid references public.requests(id) on delete restrict,
  add column if not exists accepted_offer_id uuid references public.offers(id) on delete restrict;

create unique index if not exists projects_request_id_unique_idx
  on public.projects(request_id)
  where request_id is not null;

create unique index if not exists projects_accepted_offer_id_unique_idx
  on public.projects(accepted_offer_id)
  where accepted_offer_id is not null;

create or replace function public.accept_offer(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_offer public.offers%rowtype;
  target_request public.requests%rowtype;
  existing_project_id uuid;
  created_project_id uuid;
begin
  select *
    into target_offer
  from public.offers
  where id = p_offer_id
  for update;

  if target_offer.id is null then
    raise exception 'Offer not found';
  end if;

  select *
    into target_request
  from public.requests
  where id = target_offer.request_id
  for update;

  if target_request.id is null then
    raise exception 'Request not found';
  end if;

  if target_request.customer_id <> auth.uid() then
    raise exception 'Access denied';
  end if;

  select id
    into existing_project_id
  from public.projects
  where request_id = target_request.id;

  if existing_project_id is not null then
    if target_offer.status = 'accepted' then
      return existing_project_id;
    end if;

    raise exception 'Project already exists for this request';
  end if;

  if target_request.status = 'accepted' then
    raise exception 'Another offer is already accepted';
  end if;

  update public.offers
  set status = case when id = p_offer_id then 'accepted' else 'rejected' end
  where request_id = target_request.id
    and status in ('submitted', 'accepted');

  update public.requests
  set status = 'accepted'
  where id = target_request.id;

  insert into public.projects (
    request_id,
    accepted_offer_id,
    company_id,
    owner_id,
    title,
    description,
    status
  )
  values (
    target_request.id,
    target_offer.id,
    target_offer.company_id,
    target_request.customer_id,
    target_request.title,
    target_request.description,
    'active'
  )
  returning id into created_project_id;

  return created_project_id;
end;
$$;

grant execute on function public.accept_offer(uuid) to authenticated;
SQL

echo "created: database/migrations/20260713_005_create_project_activation.sql"

cat > types/project.ts <<'TS'
import type { EntityId, IsoDateTime } from "./common";

export type ProjectStatus =
  | "draft"
  | "published"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "archived";

export interface Project {
  id: EntityId;
  request_id: EntityId | null;
  accepted_offer_id: EntityId | null;
  company_id: EntityId;
  owner_id: EntityId;
  title: string;
  description: string | null;
  status: ProjectStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type ProjectCreateInput = Pick<Project, "title"> &
  Partial<Pick<Project, "description" | "company_id">>;
TS

echo "updated: types/project.ts"

python3 - <<'PY'
from pathlib import Path

path = Path("services/offers.ts")
text = path.read_text(encoding="utf-8")
old = '''export async function acceptOffer(offerId: string) {
  const { error } = await supabase.rpc("accept_offer", {
    p_offer_id: offerId,
  });

  if (error) {
    return { data: null, error };
  }

  return { data: true, error: null };
}
'''
new = '''export async function acceptOffer(offerId: string) {
  const { data, error } = await supabase.rpc("accept_offer", {
    p_offer_id: offerId,
  });

  if (error) {
    return { data: null, error };
  }

  return { data: data as string, error: null };
}
'''
if old not in text:
    raise SystemExit("acceptOffer block not found")
path.write_text(text.replace(old, new), encoding="utf-8")
PY

echo "updated: services/offers.ts"

python3 - <<'PY'
from pathlib import Path

path = Path("app/requests/[id]/page.tsx")
text = path.read_text(encoding="utf-8")
old = '''  async function handleAcceptOffer(offerId: string) {
    setAcceptingOfferId(offerId);
    setErrorMessage(null);
    const { error } = await acceptOffer(offerId);
    setAcceptingOfferId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const requestResult = await getRequest(params.id);
    if (!requestResult.error && requestResult.data) setRequest(requestResult.data);
    await reloadOffers();
  }
'''
new = '''  async function handleAcceptOffer(offerId: string) {
    setAcceptingOfferId(offerId);
    setErrorMessage(null);
    const { data: projectId, error } = await acceptOffer(offerId);
    setAcceptingOfferId(null);

    if (error || !projectId) {
      setErrorMessage(error?.message ?? "Не удалось активировать проект.");
      return;
    }

    window.location.assign(`/projects/${projectId}`);
  }
'''
if old not in text:
    raise SystemExit("handleAcceptOffer block not found")
path.write_text(text.replace(old, new), encoding="utf-8")
PY

echo "updated: app/requests/[id]/page.tsx"
