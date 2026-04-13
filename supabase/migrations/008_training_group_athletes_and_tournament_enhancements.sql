-- =============================================
-- 008_training_group_athletes_and_tournament_enhancements.sql
-- =============================================

-- ─── TRAINING GROUP ATHLETES ───────────────────────────────────────────────
-- Asignacion explicita de atletas a grupos de entrenamiento.
-- Antes se usaba solo la categoria; ahora el entrenador elige quien va.
create table training_group_athletes (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  training_group_id uuid not null references training_groups(id) on delete cascade,
  athlete_enrollment_id uuid not null references athlete_academy_enrollments(id) on delete cascade,
  added_by uuid references profiles(id),
  added_at timestamptz not null default now(),
  unique (training_group_id, athlete_enrollment_id)
);

create index idx_tga_group_id   on training_group_athletes(training_group_id);
create index idx_tga_enrollment on training_group_athletes(athlete_enrollment_id);
create index idx_tga_academy    on training_group_athletes(academy_id);

-- ─── TOURNAMENT ENHANCEMENTS ───────────────────────────────────────────────
alter table tournaments
  add column if not exists training_group_id  uuid references training_groups(id),
  add column if not exists format             text check (format in ('elimination','round_robin','groups_then_elimination','other')),
  add column if not exists is_local_organizer boolean not null default false;

create index idx_tournaments_group_id on tournaments(training_group_id) where training_group_id is not null;

-- ─── TOURNAMENT COSTS ──────────────────────────────────────────────────────
-- Desglose de costos del torneo: inscripcion, arbitraje, transporte, etc.
create table tournament_costs (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  type text not null check (type in ('inscription','arbitrage','transport','uniform','accommodation','meals','other')),
  description text,
  amount numeric(12,2) not null default 0,
  is_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tournament_costs_tournament_id on tournament_costs(tournament_id);

-- ─── TOURNAMENT MATCHES ────────────────────────────────────────────────────
-- Partidos del torneo: fechas, rivales, resultados.
create table tournament_matches (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  match_date date,
  match_time time,
  venue text,
  opponent text not null,
  stage text,   -- 'group_stage','quarterfinal','semifinal','third_place','final','friendly'
  our_score int,
  opponent_score int,
  result text check (result in ('win','draw','loss')),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tournament_matches_tournament_id on tournament_matches(tournament_id);

-- ─── TOURNAMENT MATCH ATHLETES ─────────────────────────────────────────────
-- Asistencia y desempeno de atletas en cada partido.
create table tournament_match_athletes (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  tournament_match_id uuid not null references tournament_matches(id) on delete cascade,
  athlete_enrollment_id uuid not null references athlete_academy_enrollments(id) on delete cascade,
  attended boolean not null default false,
  goals int not null default 0,
  assists int not null default 0,
  yellow_cards int not null default 0,
  red_cards int not null default 0,
  is_injured boolean not null default false,
  injury_notes text,
  performance_note text,
  unique (tournament_match_id, athlete_enrollment_id)
);

create index idx_tma_match_id   on tournament_match_athletes(tournament_match_id);
create index idx_tma_enrollment on tournament_match_athletes(athlete_enrollment_id);
