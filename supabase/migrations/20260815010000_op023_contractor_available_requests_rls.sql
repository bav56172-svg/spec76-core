-- OP-023: Contractor Journey — "Доступные заказы" (Wave 2, Release 0.4)
--
-- Root cause found before this change: request_matches and requests were
-- only readable by the customer who owns the request. A contractor
-- company had zero visibility into requests it was matched to — the
-- exchange was one-sided at the database level, not just missing UI.
--
-- Adds read access for company members to requests/matches where their
-- company has a current match, reusing the is_company_member() helper
-- from EP-024 rather than duplicating membership logic.

begin;

create policy "Company members can read their current matches"
  on public.request_matches
  for select
  to authenticated
  using (
    is_current = true
    and public.is_company_member(company_id)
  );

create policy "Company members can read matched requests"
  on public.requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.request_matches rm
      where rm.request_id = requests.id
        and rm.is_current = true
        and public.is_company_member(rm.company_id)
    )
  );

commit;
