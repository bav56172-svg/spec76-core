-- SPEC76 test seed: first contractor profile for end-to-end matching verification.
-- Safe to run repeatedly.

do $$
declare
  target_company_id uuid;
begin
  select id
    into target_company_id
  from public.companies
  order by created_at asc
  limit 1;

  if target_company_id is null then
    raise exception 'No company exists. Create a company in the application first.';
  end if;

  update public.companies
  set
    description = coalesce(description, 'Тестовый исполнитель для проверки подбора SPEC76'),
    city = 'Ярославль',
    status = 'active',
    updated_at = now()
  where id = target_company_id;

  insert into public.company_services (company_id, service_name)
  values
    (target_company_id, 'Уборка снега'),
    (target_company_id, 'Вывоз снега')
  on conflict (company_id, service_name) do nothing;

  insert into public.company_equipment (company_id, equipment_name)
  values
    (target_company_id, 'Фронтальный погрузчик'),
    (target_company_id, 'Самосвал')
  on conflict (company_id, equipment_name) do nothing;
end;
$$;

select
  c.id,
  c.name,
  c.city,
  c.status,
  coalesce(array_agg(distinct cs.service_name) filter (where cs.service_name is not null), '{}') as services,
  coalesce(array_agg(distinct ce.equipment_name) filter (where ce.equipment_name is not null), '{}') as equipment
from public.companies c
left join public.company_services cs on cs.company_id = c.id
left join public.company_equipment ce on ce.company_id = c.id
where c.id = (
  select id
  from public.companies
  order by created_at asc
  limit 1
)
group by c.id, c.name, c.city, c.status;
