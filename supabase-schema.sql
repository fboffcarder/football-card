-- ═══════════════════════════════════════════════════════════════════════════
-- Football Officiating App — Database Schema
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── games ───────────────────────────────────────────────────────────────────
create table if not exists games (
  id                        uuid primary key default uuid_generate_v4(),
  game_date                 date not null,
  kickoff_time              time,
  actual_start_time         time,
  home_team                 text not null,
  away_team                 text not null,
  venue                     text,
  conference                text,
  game_level                text,
  weather_conditions        text,
  field_surface             text,
  halftime_duration_minutes integer,
  final_score_home          integer,
  final_score_away          integer,
  overtime_periods          integer default 0,
  notes                     text,
  created_at                timestamptz default now()
);

-- ─── officials ───────────────────────────────────────────────────────────────
create table if not exists officials (
  id                    uuid primary key default uuid_generate_v4(),
  game_id               uuid references games(id) on delete cascade,
  name                  text not null,
  position              text not null,
  experience_years      integer,
  conference_affiliation text
);

-- ─── coin_toss ───────────────────────────────────────────────────────────────
create table if not exists coin_toss (
  id                  uuid primary key default uuid_generate_v4(),
  game_id             uuid references games(id) on delete cascade,
  toss_winner         text,
  toss_call           text,
  toss_result         text,
  winner_choice       text,
  loser_choice        text,
  second_half_choice  text,
  captains_home       text,
  captains_away       text
);

-- ─── timeouts ────────────────────────────────────────────────────────────────
create table if not exists timeouts (
  id                        uuid primary key default uuid_generate_v4(),
  game_id                   uuid references games(id) on delete cascade,
  quarter                   integer not null,
  game_clock_time           text,
  team                      text not null,
  timeout_number_for_team   integer,
  reason                    text
);

-- ─── scoring_plays ───────────────────────────────────────────────────────────
create table if not exists scoring_plays (
  id                      uuid primary key default uuid_generate_v4(),
  game_id                 uuid references games(id) on delete cascade,
  quarter                 integer not null,
  game_clock_time         text,
  wall_clock_time         time,
  scoring_team            text not null,
  score_type              text not null,
  scoring_player_number   integer,
  home_score_after        integer not null,
  away_score_after        integer not null,
  drive_start_yard_line   integer,
  notes                   text
);

-- ─── penalties ───────────────────────────────────────────────────────────────
create table if not exists penalties (
  id                        uuid primary key default uuid_generate_v4(),
  game_id                   uuid references games(id) on delete cascade,
  quarter                   integer not null,
  game_clock_time           text,
  wall_clock_time           time,
  team_penalized            text not null,
  player_number             integer,
  foul_type                 text not null,
  yardage                   integer,
  spot_enforcement          boolean default false,
  status                    text not null default 'Accepted',
  automatic_first_down      boolean default false,
  calling_official_position text,
  down_and_distance_before  text,
  notes                     text
);

-- ─── instant_replays ─────────────────────────────────────────────────────────
create table if not exists instant_replays (
  id                      uuid primary key default uuid_generate_v4(),
  game_id                 uuid references games(id) on delete cascade,
  quarter                 integer not null,
  game_clock_time         text,
  initiated_by            text not null,
  challenging_team        text,
  play_description        text,
  original_ruling         text,
  outcome                 text not null,
  timeout_charged         boolean default false,
  review_duration_minutes integer
);

-- ─── game_events ─────────────────────────────────────────────────────────────
create table if not exists game_events (
  id              uuid primary key default uuid_generate_v4(),
  game_id         uuid references games(id) on delete cascade,
  quarter         integer,
  game_clock_time text,
  wall_clock_time time,
  event_type      text not null,
  team_involved   text,
  player_number   integer,
  description     text
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- Anyone can READ. Only authenticated users can WRITE.
-- ═══════════════════════════════════════════════════════════════════════════

alter table games           enable row level security;
alter table officials       enable row level security;
alter table coin_toss       enable row level security;
alter table timeouts        enable row level security;
alter table scoring_plays   enable row level security;
alter table penalties       enable row level security;
alter table instant_replays enable row level security;
alter table game_events     enable row level security;

-- Helper: create read+write policies for a table
-- READ: public (anyone)
create policy "Public read games"           on games           for select using (true);
create policy "Public read officials"       on officials       for select using (true);
create policy "Public read coin_toss"       on coin_toss       for select using (true);
create policy "Public read timeouts"        on timeouts        for select using (true);
create policy "Public read scoring_plays"   on scoring_plays   for select using (true);
create policy "Public read penalties"       on penalties       for select using (true);
create policy "Public read instant_replays" on instant_replays for select using (true);
create policy "Public read game_events"     on game_events     for select using (true);

-- WRITE: authenticated users only
create policy "Auth write games"           on games           for all using (auth.role() = 'authenticated');
create policy "Auth write officials"       on officials       for all using (auth.role() = 'authenticated');
create policy "Auth write coin_toss"       on coin_toss       for all using (auth.role() = 'authenticated');
create policy "Auth write timeouts"        on timeouts        for all using (auth.role() = 'authenticated');
create policy "Auth write scoring_plays"   on scoring_plays   for all using (auth.role() = 'authenticated');
create policy "Auth write penalties"       on penalties       for all using (auth.role() = 'authenticated');
create policy "Auth write instant_replays" on instant_replays for all using (auth.role() = 'authenticated');
create policy "Auth write game_events"     on game_events     for all using (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes for fast search
-- ═══════════════════════════════════════════════════════════════════════════
create index if not exists idx_games_date        on games(game_date desc);
create index if not exists idx_games_home        on games(home_team);
create index if not exists idx_games_away        on games(away_team);
create index if not exists idx_officials_game    on officials(game_id);
create index if not exists idx_penalties_game    on penalties(game_id);
create index if not exists idx_scoring_game      on scoring_plays(game_id);
create index if not exists idx_timeouts_game     on timeouts(game_id);
create index if not exists idx_events_game       on game_events(game_id);
