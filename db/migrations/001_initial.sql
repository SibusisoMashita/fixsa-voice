-- Historical PostgreSQL reference only. Production migrations now live in api/database/migrations for Laravel + MariaDB.
-- FixSA Voice reference schema (PostgreSQL-compatible).
-- This migration documents the original persistence contract.

create extension if not exists pgcrypto;

create type issue_category as enum ('water_leak','pothole','electricity_fault','sewer_overflow','broken_streetlight','illegal_dumping','damaged_public_asset');
create type report_status as enum ('reported','triaged','assigned','in_progress','resolved','closed');
create type report_priority as enum ('routine','priority','urgent','emergency_hold');

create table areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  municipality_code text,
  active boolean not null default true
);

create table users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  role text not null check (role in ('resident','operator','supervisor','demo_judge')),
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^FSA-[0-9]{4}-[0-9]{4}$'),
  category issue_category not null,
  status report_status not null default 'reported',
  priority report_priority not null,
  area_id uuid references areas(id),
  address text not null,
  landmark text,
  latitude double precision not null,
  longitude double precision not null,
  location_precision text not null check (location_precision in ('approximate','confirmed')),
  duration_text text not null,
  severity text not null check (severity in ('low','moderate','high','critical')),
  hazards jsonb not null default '[]'::jsonb,
  people_affected integer not null default 0 check (people_affected >= 0),
  details text not null,
  source text not null check (source in ('voice','text','demo_scenario')),
  sla_due_at timestamptz not null,
  duplicate_of uuid references reports(id),
  assignee_id uuid references users(id),
  audio_retention text not null default 'ephemeral_deleted',
  safety_hold boolean not null default false,
  synthetic boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  assemblyai_session_id text,
  consented_at timestamptz,
  started_at timestamptz not null,
  ended_at timestamptz,
  audio_retained boolean not null default false
);

create table transcript_segments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  speaker text not null check (speaker in ('resident','agent','system')),
  text text not null,
  is_final boolean not null default true,
  occurred_at timestamptz not null,
  sequence integer not null,
  unique (conversation_id, sequence)
);

create table evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('photo','note','transcript')),
  object_key text,
  display_name text not null,
  public boolean not null default false,
  created_at timestamptz not null default now()
);

create table duplicate_matches (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  candidate_report_id uuid not null references reports(id) on delete cascade,
  score numeric(4,3) not null check (score between 0 and 1),
  distance_metres integer not null check (distance_metres >= 0),
  rationale jsonb not null,
  decision text check (decision in ('merge','separate','pending')) default 'pending',
  decided_by uuid references users(id),
  decided_at timestamptz,
  unique (report_id, candidate_report_id)
);

create table status_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  status report_status not null,
  note text not null,
  public boolean not null default false,
  actor_id uuid references users(id),
  actor_type text not null check (actor_type in ('resident','agent','operator','system')),
  occurred_at timestamptz not null default now()
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  assignee_id uuid not null references users(id),
  assigned_at timestamptz not null default now(),
  released_at timestamptz
);

create table sla_rules (
  id uuid primary key default gen_random_uuid(),
  category issue_category,
  priority report_priority not null,
  target_hours integer not null check (target_hours > 0),
  active boolean not null default true
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id),
  actor_id uuid references users(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index reports_open_location_idx on reports (category, latitude, longitude) where status not in ('resolved','closed');
create index reports_status_sla_idx on reports (status, sla_due_at);
create index audit_events_report_time_idx on audit_events (report_id, occurred_at desc);

-- Audit events are append-only. Application roles should receive INSERT and
-- SELECT only; UPDATE and DELETE remain reserved for controlled maintenance.
