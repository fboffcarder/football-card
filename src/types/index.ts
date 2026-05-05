// ─── Database Types ────────────────────────────────────────────────────────────
// These mirror the Supabase tables exactly.

export interface Game {
  id: string;
  game_date: string;
  kickoff_time: string | null;
  actual_start_time: string | null;
  home_team: string;
  away_team: string;
  venue: string | null;
  conference: string | null;
  game_level: string | null;
  weather_conditions: string | null;
  field_surface: string | null;
  halftime_duration_minutes: number | null;
  final_score_home: number | null;
  final_score_away: number | null;
  overtime_periods: number;
  notes: string | null;
  created_at: string;
  // ─── Added in migration 002 ───
  finalized: boolean;
  finalized_at: string | null;
}

export interface Official {
  id: string;
  game_id: string;
  name: string;
  position: string;
  experience_years: number | null;
  conference_affiliation: string | null;
}

export interface CoinToss {
  id: string;
  game_id: string;
  toss_winner: string | null;
  toss_call: string | null;
  toss_result: string | null;
  winner_choice: string | null;
  loser_choice: string | null;
  second_half_choice: string | null;
  captains_home: string | null;
  captains_away: string | null;
}

export interface Timeout {
  id: string;
  game_id: string;
  quarter: number;
  game_clock_time: string | null;
  team: string;
  timeout_number_for_team: number | null;
  reason: string | null;
}

export interface ScoringPlay {
  id: string;
  game_id: string;
  quarter: number;
  game_clock_time: string | null;
  wall_clock_time: string | null;
  scoring_team: string;
  score_type: string;
  scoring_player_number: number | null;
  home_score_after: number;
  away_score_after: number;
  drive_start_yard_line: number | null;
  notes: string | null;
}

export interface Penalty {
  id: string;
  game_id: string;
  quarter: number;
  game_clock_time: string | null;
  wall_clock_time: string | null;
  team_penalized: string;
  player_number: number | null;
  foul_type: string;
  yardage: number | null;
  spot_enforcement: boolean;
  status: string;
  automatic_first_down: boolean;
  calling_official_position: string | null;
  down_and_distance_before: string | null;
  notes: string | null;
}

export interface InstantReplay {
  id: string;
  game_id: string;
  quarter: number;
  game_clock_time: string | null;
  initiated_by: string;
  challenging_team: string | null;
  play_description: string | null;
  original_ruling: string | null;
  outcome: string;
  timeout_charged: boolean;
  review_duration_minutes: number | null;
}

export interface GameEvent {
  id: string;
  game_id: string;
  quarter: number | null;
  game_clock_time: string | null;
  wall_clock_time: string | null;
  event_type: string;
  team_involved: string | null;
  player_number: number | null;
  description: string | null;
}

// ─── Composite type for full game detail ────────────────────────────────────
export interface GameDetail {
  game: Game;
  officials: Official[];
  coinToss: CoinToss | null;
  timeouts: Timeout[];
  scoringPlays: ScoringPlay[];
  penalties: Penalty[];
  replays: InstantReplay[];
  events: GameEvent[];
}

// ─── UI state types ──────────────────────────────────────────────────────────
export type ModalType = 'timeout' | 'penalty' | 'score' | 'replay' | 'event' | null;

export interface LiveGameState {
  quarter: number;
  gameClock: string;
  homeScore: number;
  awayScore: number;
  homeTimeoutsLeft: number; // per half: 3
  awayTimeoutsLeft: number;
  isOnline: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────
export const OFFICIAL_POSITIONS = [
  'Referee',
  'Umpire',
  'Line Judge',
  'Down Judge',
  'Field Judge',
  'Side Judge',
  'Back Judge',
  'Center Judge',
] as const;

export const FOUL_TYPES = [
  'Holding',
  'Pass Interference (Offensive)',
  'Pass Interference (Defensive)',
  'False Start',
  'Offsides',
  'Encroachment',
  'Targeting',
  'Unsportsmanlike Conduct',
  'Roughing the Passer',
  'Roughing the Kicker',
  'Illegal Block in the Back',
  'Personal Foul',
  'Illegal Use of Hands',
  'Clipping',
  'Tripping',
  'Face Mask',
  'Horse Collar',
  'Chop Block',
  'Illegal Formation',
  'Illegal Motion',
  'Illegal Shift',
  'Delay of Game',
  'Excessive Timeouts',
  'Intentional Grounding',
  'Ineligible Receiver Downfield',
  'Illegal Forward Pass',
  'Illegal Contact',
  'Interference with Fair Catch',
  'Kick Catch Interference',
  'Neutral Zone Infraction',
  'Too Many Players on Field',
  'Taunting',
  'Illegal Blindside Block',
  'Other',
] as const;

export const SCORE_TYPES = [
  'Touchdown',
  'PAT (kick)',
  'PAT (2-pt)',
  'Field Goal',
  'Safety',
  'Defensive TD',
] as const;

export const GAME_LEVELS = ['FBS', 'FCS', 'D2', 'D3', 'NAIA', 'High School', 'Other'] as const;

export const CONFERENCES = [
  'ACC',
  'Big Ten',
  'Big 12',
  'Pac-12',
  'SEC',
  'AAC',
  'C-USA',
  'MAC',
  'Mountain West',
  'Sun Belt',
  'Independents',
  'FCS – Big South',
  'FCS – CAA',
  'FCS – Missouri Valley',
  'FCS – Southland',
  'FCS – Other',
  'D2 – CIAA',
  'D2 – GLIAC',
  'D2 – GSAC',
  'D2 – Other',
  'High School – State',
  'Other',
] as const;

export const EVENT_TYPES = [
  'Injury',
  'TV Timeout',
  'Lightning Delay',
  'Equipment Check',
  'Ejection',
  'Measurement',
  'Kickoff',
  'Halftime Start',
  'Halftime End',
  'Final Whistle',
  'Instant Replay Review',
  'Official Review',
  'Coach Complaint',
  'Weather Delay',
  'Other',
] as const;
