-- ==========================================
-- SPEC76 OS
-- Migration: 003_projects_rls.sql
-- Description: RLS policies for projects
-- ==========================================

alter table public.projects enable row level security;

-- Пользователь видит только свои проекты
create policy "Users can view own projects"
on public.projects
for select
using (
    owner_id = auth.uid()
);

-- Пользователь может создавать свои проекты
create policy "Users can create own projects"
on public.projects
for insert
with check (
    owner_id = auth.uid()
);

-- Пользователь может изменять свои проекты
create policy "Users can update own projects"
on public.projects
for update
using (
    owner_id = auth.uid()
);

-- Пользователь может удалять свои проекты
create policy "Users can delete own projects"
on public.projects
for delete
using (
    owner_id = auth.uid()
);