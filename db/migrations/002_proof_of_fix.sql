-- Historical PostgreSQL reference only. Production migrations now live in api/database/migrations for Laravel + MariaDB.
-- Proof of Fix keeps an operator's resolution claim separate from the resident's outcome evidence.

create type resolution_outcome as enum ('fixed','partially_fixed','not_fixed');
create type verification_method as enum ('voice','text','judge_demo');

create table resolution_verifications (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  outcome resolution_outcome not null,
  resident_statement text not null check (char_length(resident_statement) between 3 and 500),
  method verification_method not null,
  verified_by uuid references users(id),
  verified_at timestamptz not null default now(),
  superseded_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index resolution_verifications_current_idx
  on resolution_verifications (report_id)
  where superseded_at is null;

create index resolution_verifications_outcome_time_idx
  on resolution_verifications (outcome, verified_at desc);

-- Production application logic must insert a public status event in the same
-- transaction and move partially_fixed/not_fixed reports back to in_progress.
