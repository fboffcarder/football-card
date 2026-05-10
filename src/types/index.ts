// ─── Database Types ────────────────────────────────────────────────────────────

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
  player_number: number | null;
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
  // Added in migration 001
  enforcement_type: string | null;
  enforcement_modifier: string | null;
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
  homeTimeoutsLeft: number;
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
  'BAT - Illegal Bat',
  'BBW - Block Below Waist',
  'BOB - Blocking Out of Bounds',
  'BSB - Blind Side Block',
  'CHB - Chop Block',
  'CLP - Clipping',
  'DH - Defensive Holding',
  'DOD - Delay of Game Defense',
  'DOF - Defensive Offside',
  'DOG - Delay of Game Offense',
  'DPI - Defensive Pass Interference',
  'DSC - Disconcerting Signals Defense',
  'ENC - Encroachment Offense',
  'EQV - Equipment Violation',
  'FBG - Fighting Before Game',
  'FFH - Fighting First Half',
  'FHT - Fighting Halftime',
  'FMM - Face Mask',
  'FSH - Fighting Second Half',
  'FST - False Start',
  'GAI - Game Admin Interference/DOG',
  'GAIM - Game Admin Interference Major',
  'HUR - Hurdling',
  'IBB - Illegal Block in Back',
  'IBK - Illegal Block Kickers',
  'IBS - Illegal Block After Fair Catch Signal',
  'ICS - Illegal Contact w Snapper',
  'IDP - Ineligible Downfield on Pass',
  'IFD - Illegal Formation Defense',
  'IFK - Illegal Free Kick Formation',
  'IFP - Illegal Forward Pass',
  'IHR - Illegally Helping Runner',
  'IIN - Interlocked Interference',
  'IKB - Illegally Kicking Ball',
  'ILF - Illegal Formation',
  'ILM - Illegal Motion',
  'ILS - Illegal Substitution',
  'ING - Intentional Grounding',
  'INU - Illegal Numbering',
  'ISH - Illegal Shift',
  'ISP - Illegal Snap',
  'ITK - Illegal Touch of Kick',
  'ITP - Illegal Touch Pass',
  'IWG - Illegal Wedge',
  'KCI - Kick Catch Interference',
  'KIK - Illegal Kick',
  'KOB - Kickoff Out of Bounds',
  'LEA - Leaping',
  'LEV - Leverage',
  'LPS - Leap Over Punt Shield',
  'OFK - Offside on Free Kick',
  'OH - Offensive Holding',
  'OPI - Offensive Pass Interference',
  'PFH - Personal Foul Helmet Off',
  'RFK - Roughing Free Kicker',
  'RFH - Roughing Holder',
  'RNH - Running into Holder',
  'RNK - Running into Kicker',
  'ROB - Return From OOB',
  'RPS - Roughing the Passer',
  'RRK - Roughing the Kicker',
  'SKE - Striking, Kicking, Kneeing, Elbowing',
  'SLW - Sideline Warning',
  'TGT - Targeting',
  'TRP - Tripping',
  'UNR/BTH - Blow to Head',
  'UNR/BUT - Butting, Ramming, w Crown Helmet',
  'UNR/HCT - Horse Collar Tackle',
  'UNR/HDP - Hit on Defenseless Player',
  'UNR/HTF - Hands to Face',
  'UNR/LTO - Late Hit Out of Bounds',
  'UNR/LTP - Late Hit / Piling on',
  'UNR/OTH - Other',
  'UNS/ABL - Abusive Language',
  'UNS/BCH - Unsportsmanlike Act Bench',
  'UNS/CTO - Unsportsmanlike Conduct/Contact Official',
  'UNS/DEA - Delayed Excessive Act',
  'UNS/HCH - Unsportsmanlike Conduct Head Coach',
  'UNS/NFA - Non-Football Act',
  'UNS/OTH - Other',
  'UNS/PSH - Pushing Shoving Opponent',
  'UNS/RHT - Removal of Helmet',
  'UNS/SLI - Sideline Interference',
  'UNS/STB - Spiking Throwing Ball',
  'UNS/TAU - Taunting or Baiting',
  'UNS/UFA - Unfair Act',
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
  'D2 – MIAA',
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
