-- ==========================================
-- SPEC76 OS
-- Migration: 002_create_projects.sql
-- Description: Create projects table
-- ==========================================

create table if not exists public.projects (

    id uuid primary key default gen_random_uuid(),

    company_id uuid not null
        references public.companies(id)
        on delete cascade,

    owner_id uuid not null
        references auth.users(id)
        on delete cascade,

    title text not null,

    description text,

    status text not null default 'draft',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);

create index if not exists idx_projects_company
on public.projects(company_id);

create index if not exists idx_projects_owner
on public.projects(owner_id);

create index if not exists idx_projects_status
on public.projects(status);