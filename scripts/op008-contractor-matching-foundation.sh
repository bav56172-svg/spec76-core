#!/usr/bin/env bash
set -euo pipefail

mkdir -p types services database/migrations

cat > types/contractor-match.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export interface ContractorMatch {
  id: EntityId;
  request_id: EntityId;
  company_id: EntityId;
  score: number;
  matched_services: string[];
  matched_equipment: string[];
  reasons: string[];
  is_current: boolean;
  created_at: IsoDateTime;
  company?: {
    id: EntityId;
    name: string;
    city: string | null;
  };
}

export interface ContractorMatchDraft {
  company_id: EntityId;
  score: number;
  matched_services: string[];
  matched_equipment: string[];
  reasons: string[];
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("types/index.ts")
text = path.read_text()
line = 'export * from "./contractor-match";\n'
if line not in text:
    path.write_text(line + text)
PY

cat > services/contractorMatching.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type {
  ContractorMatch,
  ContractorMatchDraft,
} from "@/types/contractor-match";
import type { Request } from "@/types/request";
import type { RequestAnalysis } from "@/types/request-analysis";

interface CompanyCandidate {
  id: string;
  name: string;
  city: string | null;
  status: string | null;
}

interface CompanyCapability {
  company_id: string;
  value: string;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("ru-RU");
}

function intersections(source: string[], target: string[]): string[] {
  const targetSet = new Set(target.map(normalize));
  return source.filter((item) => targetSet.has(normalize(item)));
}

function buildDraft(
  request: Request,
  analysis: RequestAnalysis,
  company: CompanyCandidate,
  serviceValues: string[],
  equipmentValues: string[],
): ContractorMatchDraft | null {
  const matchedServices = intersections(analysis.services, serviceValues);
  const matchedEquipment = intersections(analysis.equipment, equipmentValues);
  const cityMatches =
    Boolean(company.city) && normalize(company.city ?? "") === normalize(request.city);

  let score = 0;
  const reasons: string[] = [];

  if (analysis.services.length > 0 && matchedServices.length > 0) {
    score += Math.round((matchedServices.length / analysis.services.length) * 50);
    reasons.push(`Совпали услуги: ${matchedServices.join(", ")}`);
  }

  if (analysis.equipment.length > 0 && matchedEquipment.length > 0) {
    score += Math.round((matchedEquipment.length / analysis.equipment.length) * 30);
    reasons.push(`Есть техника: ${matchedEquipment.join(", ")}`);
  }

  if (cityMatches) {
    score += 20;
    reasons.push(`Работает в городе ${request.city}`);
  }

  if (score === 0) return null;

  return {
    company_id: company.id,
    score: Math.min(score, 100),
    matched_services: matchedServices,
    matched_equipment: matchedEquipment,
    reasons,
  };
}

export async function getCurrentContractorMatches(requestId: string) {
  return await supabase
    .from("request_matches")
    .select("*, company:companies(id, name, city)")
    .eq("request_id", requestId)
    .eq("is_current", true)
    .order("score", { ascending: false })
    .returns<ContractorMatch[]>();
}

export async function runContractorMatching(
  request: Request,
  analysis: RequestAnalysis,
) {
  const companiesResult = await supabase
    .from("companies")
    .select("id, name, city, status")
    .in("status", ["active", "draft"])
    .returns<CompanyCandidate[]>();

  if (companiesResult.error) {
    return { data: null, error: companiesResult.error };
  }

  const companies = companiesResult.data ?? [];
  const companyIds = companies.map((company) => company.id);

  if (companyIds.length === 0) {
    return { data: [] as ContractorMatch[], error: null };
  }

  const [servicesResult, equipmentResult] = await Promise.all([
    supabase
      .from("company_services")
      .select("company_id, service_name:value")
      .in("company_id", companyIds)
      .returns<CompanyCapability[]>(),
    supabase
      .from("company_equipment")
      .select("company_id, equipment_name:value")
      .in("company_id", companyIds)
      .returns<CompanyCapability[]>(),
  ]);

  if (servicesResult.error) {
    return { data: null, error: servicesResult.error };
  }

  if (equipmentResult.error) {
    return { data: null, error: equipmentResult.error };
  }

  const drafts = companies
    .map((company) => {
      const serviceValues = (servicesResult.data ?? [])
        .filter((item) => item.company_id === company.id)
        .map((item) => item.value);
      const equipmentValues = (equipmentResult.data ?? [])
        .filter((item) => item.company_id === company.id)
        .map((item) => item.value);

      return buildDraft(
        request,
        analysis,
        company,
        serviceValues,
        equipmentValues,
      );
    })
    .filter((item): item is ContractorMatchDraft => item !== null)
    .sort((left, right) => right.score - left.score);

  const deactivateResult = await supabase
    .from("request_matches")
    .update({ is_current: false })
    .eq("request_id", request.id)
    .eq("is_current", true);

  if (deactivateResult.error) {
    return { data: null, error: deactivateResult.error };
  }

  if (drafts.length === 0) {
    return { data: [] as ContractorMatch[], error: null };
  }

  const insertResult = await supabase
    .from("request_matches")
    .insert(
      drafts.map((draft) => ({
        request_id: request.id,
        ...draft,
        is_current: true,
      })),
    )
    .select("*, company:companies(id, name, city)")
    .order("score", { ascending: false })
    .returns<ContractorMatch[]>();

  return insertResult;
}
EOF

cat > database/migrations/20260713_003_create_contractor_matching.sql <<'EOF'
alter table public.companies
  add column if not exists description text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'archived')),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.company_services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_name text not null check (char_length(trim(service_name)) between 2 and 160),
  created_at timestamptz not null default now(),
  unique (company_id, service_name)
);

create table if not exists public.company_equipment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  equipment_name text not null check (char_length(trim(equipment_name)) between 2 and 160),
  created_at timestamptz not null default now(),
  unique (company_id, equipment_name)
);

create table if not exists public.request_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  matched_services jsonb not null default '[]'::jsonb,
  matched_equipment jsonb not null default '[]'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists company_services_company_id_idx
  on public.company_services(company_id);

create index if not exists company_equipment_company_id_idx
  on public.company_equipment(company_id);

create index if not exists request_matches_request_score_idx
  on public.request_matches(request_id, score desc);

create unique index if not exists request_matches_one_current_company_idx
  on public.request_matches(request_id, company_id)
  where is_current = true;

alter table public.company_services enable row level security;
alter table public.company_equipment enable row level security;
alter table public.request_matches enable row level security;

drop policy if exists "Authenticated users can read company services" on public.company_services;
create policy "Authenticated users can read company services"
on public.company_services for select to authenticated using (true);

drop policy if exists "Company owners manage company services" on public.company_services;
create policy "Company owners manage company services"
on public.company_services for all to authenticated
using (
  exists (
    select 1 from public.companies
    where companies.id = company_services.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.companies
    where companies.id = company_services.company_id
      and companies.owner_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can read company equipment" on public.company_equipment;
create policy "Authenticated users can read company equipment"
on public.company_equipment for select to authenticated using (true);

drop policy if exists "Company owners manage company equipment" on public.company_equipment;
create policy "Company owners manage company equipment"
on public.company_equipment for all to authenticated
using (
  exists (
    select 1 from public.companies
    where companies.id = company_equipment.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.companies
    where companies.id = company_equipment.company_id
      and companies.owner_id = auth.uid()
  )
);

drop policy if exists "Customers can read matches of own requests" on public.request_matches;
create policy "Customers can read matches of own requests"
on public.request_matches for select to authenticated
using (
  exists (
    select 1 from public.requests
    where requests.id = request_matches.request_id
      and requests.customer_id = auth.uid()
  )
);

drop policy if exists "Customers can create matches for own requests" on public.request_matches;
create policy "Customers can create matches for own requests"
on public.request_matches for insert to authenticated
with check (
  exists (
    select 1 from public.requests
    where requests.id = request_matches.request_id
      and requests.customer_id = auth.uid()
  )
);

drop policy if exists "Customers can update matches of own requests" on public.request_matches;
create policy "Customers can update matches of own requests"
on public.request_matches for update to authenticated
using (
  exists (
    select 1 from public.requests
    where requests.id = request_matches.request_id
      and requests.customer_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.requests
    where requests.id = request_matches.request_id
      and requests.customer_id = auth.uid()
  )
);
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("app/requests/[id]/page.tsx")
text = path.read_text()
text = text.replace(
'import { getRequest } from "@/services/requests";\n',
'import {\n  getCurrentContractorMatches,\n  runContractorMatching,\n} from "@/services/contractorMatching";\nimport { getRequest } from "@/services/requests";\n'
)
text = text.replace(
'import type { Request } from "@/types/request";\n',
'import type { ContractorMatch } from "@/types/contractor-match";\nimport type { Request } from "@/types/request";\n'
)
text = text.replace(
'  const [analysis, setAnalysis] = useState<RequestAnalysis | null>(null);\n',
'  const [analysis, setAnalysis] = useState<RequestAnalysis | null>(null);\n  const [matches, setMatches] = useState<ContractorMatch[]>([]);\n'
)
text = text.replace(
'  const [analyzing, setAnalyzing] = useState(false);\n',
'  const [analyzing, setAnalyzing] = useState(false);\n  const [matching, setMatching] = useState(false);\n'
)
text = text.replace(
'      getCurrentRequestAnalysis(params.id),\n',
'      getCurrentRequestAnalysis(params.id),\n      getCurrentContractorMatches(params.id),\n'
)
text = text.replace(
'    ]).then(([requestResult, analysisResult]) => {\n',
'    ]).then(([requestResult, analysisResult, matchesResult]) => {\n'
)
text = text.replace(
'      if (!analysisResult.error && analysisResult.data) {\n        setAnalysis(analysisResult.data);\n      }\n\n      setLoading(false);\n',
'      if (!analysisResult.error && analysisResult.data) {\n        setAnalysis(analysisResult.data);\n      }\n\n      if (!matchesResult.error && matchesResult.data) {\n        setMatches(matchesResult.data);\n      }\n\n      setLoading(false);\n'
)
insert_fn = '''\n  async function handleMatching() {\n    if (!request || !analysis) return;\n\n    setMatching(true);\n    setErrorMessage(null);\n    const { data, error } = await runContractorMatching(request, analysis);\n    setMatching(false);\n\n    if (error || !data) {\n      setErrorMessage(error?.message ?? "Не удалось подобрать исполнителей.");\n      return;\n    }\n\n    setMatches(data);\n  }\n'''
text = text.replace('\n  if (loading) return <main className="p-8">Загрузка заявки...</main>;\n', insert_fn + '\n  if (loading) return <main className="p-8">Загрузка заявки...</main>;\n')
section = '''\n\n        <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">\n          <div className="flex flex-wrap items-center justify-between gap-3">\n            <div>\n              <h2 className="font-semibold text-emerald-950">Подбор исполнителей</h2>\n              <p className="mt-1 text-sm text-emerald-900">\n                Система сравнит город, услуги и необходимую технику с профилями компаний.\n              </p>\n            </div>\n            <button\n              type="button"\n              onClick={handleMatching}\n              disabled={matching || !analysis}\n              className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"\n            >\n              {matching ? "Подбираем..." : matches.length ? "Повторить подбор" : "Подобрать исполнителей"}\n            </button>\n          </div>\n\n          {!analysis && (\n            <p className="mt-4 text-sm text-emerald-900">Сначала выполните анализ заявки.</p>\n          )}\n\n          {analysis && matches.length === 0 && (\n            <p className="mt-4 text-sm text-emerald-900">\n              Подходящие компании пока не найдены. Для подбора компаниям нужно заполнить город, услуги и технику.\n            </p>\n          )}\n\n          {matches.length > 0 && (\n            <div className="mt-5 space-y-3">\n              {matches.map((match) => (\n                <article key={match.id} className="rounded-xl border border-emerald-200 bg-white p-4">\n                  <div className="flex items-start justify-between gap-4">\n                    <div>\n                      <h3 className="font-semibold text-slate-900">{match.company?.name ?? "Компания"}</h3>\n                      <p className="mt-1 text-sm text-slate-600">{match.company?.city ?? "Город не указан"}</p>\n                    </div>\n                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">\n                      {Math.round(match.score)}%\n                    </span>\n                  </div>\n                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">\n                    {match.reasons.map((reason) => <li key={reason}>{reason}</li>)}\n                  </ul>\n                </article>\n              ))}\n            </div>\n          )}\n        </section>\n'''
text = text.replace('        </section>\n      </article>', '        </section>' + section + '      </article>')
path.write_text(text)
PY

echo "created: types/contractor-match.ts"
echo "updated: types/index.ts"
echo "created: services/contractorMatching.ts"
echo "created: database/migrations/20260713_003_create_contractor_matching.sql"
echo "updated: app/requests/[id]/page.tsx"
