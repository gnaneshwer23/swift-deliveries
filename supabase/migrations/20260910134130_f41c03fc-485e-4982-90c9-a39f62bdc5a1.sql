-- ============ enums ============
create type public.evidence_source as enum (
  'self_report','ai_draft','experience_sim','workspace_contribution','assessment','external_verification'
);
create type public.evidence_strength as enum (
  'self_reported','observed','assessed','externally_verified'
);
create type public.score_run_kind as enum ('baseline','interim','final','transfer');
create type public.confidence_band as enum ('low','moderate','high');
create type public.attestation_status as enum ('unattested','attestation_requested','externally_attested','disputed');
create type public.attestation_state as enum ('pending','confirmed','declined','disputed');

-- ============ framework catalogue (read-only to app) ============
create table public.capability_frameworks (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version text not null,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (key, version)
);
grant select on public.capability_frameworks to authenticated;
grant all on public.capability_frameworks to service_role;
alter table public.capability_frameworks enable row level security;
create policy "Signed-in users can read frameworks"
  on public.capability_frameworks for select to authenticated using (true);

create table public.framework_capabilities (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.capability_frameworks(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (framework_id, key)
);
grant select on public.framework_capabilities to authenticated;
grant all on public.framework_capabilities to service_role;
alter table public.framework_capabilities enable row level security;
create policy "Signed-in users can read framework capabilities"
  on public.framework_capabilities for select to authenticated using (true);

-- ============ artefacts + immutable versions ============
create table public.artefacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null,
  title text not null,
  kind text not null default 'document',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.artefacts to authenticated;
grant all on public.artefacts to service_role;
alter table public.artefacts enable row level security;
create policy "Owners read own artefacts" on public.artefacts
  for select to authenticated using (auth.uid() = owner_id);
create policy "Owners create own artefacts" on public.artefacts
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners update own artefacts" on public.artefacts
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create trigger update_artefacts_updated_at before update on public.artefacts
  for each row execute function private.update_updated_at_column();

create table public.artefact_versions (
  id uuid primary key default gen_random_uuid(),
  artefact_id uuid not null references public.artefacts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  version int not null,
  body text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (artefact_id, version)
);
grant select, insert on public.artefact_versions to authenticated;
grant all on public.artefact_versions to service_role;
alter table public.artefact_versions enable row level security;
create policy "Owners read own artefact versions" on public.artefact_versions
  for select to authenticated using (auth.uid() = owner_id);
create policy "Owners create own artefact versions" on public.artefact_versions
  for insert to authenticated with check (
    auth.uid() = owner_id
    and exists (select 1 from public.artefacts a where a.id = artefact_id and a.owner_id = auth.uid())
  );

create or replace function private.forbid_mutation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  raise exception 'immutable_record: % rows cannot be changed or deleted', tg_table_name;
end;
$$;

create trigger artefact_versions_immutable
  before update or delete on public.artefact_versions
  for each row execute function private.forbid_mutation();

-- ============ evidence ledger (append-only) ============
create table public.evidence_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null,
  artefact_version_id uuid references public.artefact_versions(id) on delete restrict,
  source public.evidence_source not null,
  strength public.evidence_strength not null,
  capability_key text,
  summary text not null,
  provenance jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
grant select, insert on public.evidence_ledger to authenticated;
grant all on public.evidence_ledger to service_role;
alter table public.evidence_ledger enable row level security;
create policy "Owners read own evidence" on public.evidence_ledger
  for select to authenticated using (auth.uid() = owner_id);
create policy "Owners append own evidence" on public.evidence_ledger
  for insert to authenticated with check (auth.uid() = owner_id);

create index evidence_ledger_owner_idx on public.evidence_ledger (owner_id, occurred_at desc);

-- work-based evidence must cite an immutable artefact version; external
-- verification may only be written by trusted server code
create or replace function private.validate_evidence()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.source in ('experience_sim','workspace_contribution','assessment')
     and new.artefact_version_id is null then
    raise exception 'evidence_requires_artefact_version: % evidence must cite an artefact version', new.source;
  end if;

  if new.source in ('self_report','ai_draft') and new.strength <> 'self_reported' then
    raise exception 'evidence_strength_overstated: % evidence is always self_reported', new.source;
  end if;

  if new.strength = 'externally_verified' and new.source <> 'external_verification' then
    raise exception 'evidence_strength_overstated: externally_verified requires external_verification';
  end if;

  if new.source = 'external_verification' and current_setting('role', true) <> 'service_role'
     and auth.role() <> 'service_role' then
    raise exception 'external_verification_reserved: only attestation confirmation can write this';
  end if;

  if new.artefact_version_id is not null and not exists (
    select 1 from public.artefact_versions v
    where v.id = new.artefact_version_id and v.owner_id = new.owner_id
  ) then
    raise exception 'evidence_artefact_mismatch: artefact version does not belong to this person';
  end if;

  return new;
end;
$$;

create trigger validate_evidence_before_insert
  before insert on public.evidence_ledger
  for each row execute function private.validate_evidence();

create trigger evidence_ledger_append_only
  before update or delete on public.evidence_ledger
  for each row execute function private.forbid_mutation();

-- ============ capability engine output (server-only writes) ============
create table public.score_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  framework_id uuid not null references public.capability_frameworks(id) on delete restrict,
  run_kind public.score_run_kind not null,
  status text not null default 'complete',
  notes text,
  created_at timestamptz not null default now()
);
grant select on public.score_runs to authenticated;
grant all on public.score_runs to service_role;
alter table public.score_runs enable row level security;
create policy "Owners read own score runs" on public.score_runs
  for select to authenticated using (auth.uid() = owner_id);

create table public.capability_judgements (
  id uuid primary key default gen_random_uuid(),
  score_run_id uuid not null references public.score_runs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  capability_key text not null,
  level int not null check (level between 0 and 5),
  band public.confidence_band not null,
  rationale text not null,
  evidence_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  unique (score_run_id, capability_key)
);
grant select on public.capability_judgements to authenticated;
grant all on public.capability_judgements to service_role;
alter table public.capability_judgements enable row level security;
create policy "Owners read own judgements" on public.capability_judgements
  for select to authenticated using (auth.uid() = owner_id);

create trigger capability_judgements_immutable
  before update or delete on public.capability_judgements
  for each row execute function private.forbid_mutation();

-- ============ snapshot claims: verified is computed, never set ============
create table public.snapshot_claims (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  framework_id uuid not null references public.capability_frameworks(id) on delete restrict,
  capability_key text not null,
  level int check (level between 0 and 5),
  band public.confidence_band,
  score_run_id uuid references public.score_runs(id) on delete set null,
  evidence_strength public.evidence_strength not null default 'self_reported',
  attestation_status public.attestation_status not null default 'unattested',
  readiness_basis text not null default 'evidence_coverage_heuristic',
  verified boolean generated always as (
    attestation_status = 'externally_attested'
    and evidence_strength = 'externally_verified'
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, framework_id, capability_key)
);
grant select on public.snapshot_claims to authenticated;
grant all on public.snapshot_claims to service_role;
alter table public.snapshot_claims enable row level security;
create policy "Owners read own claims" on public.snapshot_claims
  for select to authenticated using (auth.uid() = owner_id);
create trigger update_snapshot_claims_updated_at before update on public.snapshot_claims
  for each row execute function private.update_updated_at_column();

-- ============ attestations ============
create table public.attestations (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.snapshot_claims(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  attestor_name text not null,
  attestor_email text not null,
  relationship text,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  state public.attestation_state not null default 'pending',
  statement text,
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.attestations to authenticated;
grant all on public.attestations to service_role;
alter table public.attestations enable row level security;
create policy "Owners read own attestations" on public.attestations
  for select to authenticated using (auth.uid() = owner_id);
create policy "Owners request attestations" on public.attestations
  for insert to authenticated with check (
    auth.uid() = owner_id
    and exists (select 1 from public.snapshot_claims c where c.id = claim_id and c.owner_id = auth.uid())
  );
create trigger update_attestations_updated_at before update on public.attestations
  for each row execute function private.update_updated_at_column();

-- a claim may only become externally attested when a confirmed attestation exists
create or replace function private.guard_claim_attestation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.attestation_status = 'externally_attested' and not exists (
    select 1 from public.attestations a
    where a.claim_id = new.id and a.state = 'confirmed'
  ) then
    raise exception 'verified_requires_attestation: no confirmed external attestation for this claim';
  end if;

  if new.evidence_strength = 'externally_verified' and not exists (
    select 1 from public.attestations a
    where a.claim_id = new.id and a.state = 'confirmed'
  ) then
    raise exception 'verified_requires_attestation: externally_verified needs a confirmed attestation';
  end if;

  return new;
end;
$$;

create trigger guard_claim_attestation_before_write
  before insert or update on public.snapshot_claims
  for each row execute function private.guard_claim_attestation();

-- ============ pilot framework seed ============
insert into public.capability_frameworks (key, version, name)
values ('pm-core', '2026.1', 'PM Core Capability Framework');

insert into public.framework_capabilities (framework_id, key, name, description, sort_order)
select f.id, c.key, c.name, c.description, c.sort_order
from public.capability_frameworks f,
(values
  ('discovery','Discovery & problem framing','Finds the real problem before proposing solutions.',1),
  ('prioritisation','Prioritisation & trade-offs','Chooses what not to do, and can explain why.',2),
  ('delivery','Delivery execution','Moves work from intent to shipped outcome.',3),
  ('stakeholders','Stakeholder management','Aligns people with competing interests.',4),
  ('data','Data & measurement','Defines and reads the evidence of impact.',5),
  ('communication','Written & verbal communication','Makes complex decisions legible.',6)
) as c(key,name,description,sort_order)
where f.key = 'pm-core' and f.version = '2026.1';