// ============================================================
// Core Types for Axis & Allies Global 1940 Engine
// ============================================================

// ------------------------------------------------------------
// Powers & Turn Order
// ------------------------------------------------------------

/** Major playable powers in Global 1940 */
export type MajorPower =
  | 'germany'
  | 'soviet_union'
  | 'japan'
  | 'united_states'
  | 'china'
  | 'united_kingdom'
  | 'italy'
  | 'anzac'
  | 'france';

/** Minor/neutral factions that can control territories */
export type MinorFaction =
  | 'dutch'
  | 'mongolians'
  | 'neutral_true'
  | 'neutral_allies'
  | 'neutral_axis';

/** All powers/factions that can control territories */
export type Power = MajorPower | MinorFaction;

export type Side = 'axis' | 'allies' | 'neutral';

export const MAJOR_POWERS: MajorPower[] = [
  'germany',
  'soviet_union',
  'japan',
  'united_states',
  'china',
  'united_kingdom',
  'italy',
  'anzac',
  'france',
];

export const POWERS_BY_SIDE: Record<Side, Power[]> = {
  axis: ['germany', 'japan', 'italy', 'neutral_axis'],
  allies: ['soviet_union', 'united_states', 'china', 'united_kingdom', 'anzac', 'france', 'dutch', 'neutral_allies'],
  neutral: ['neutral_true', 'mongolians'],
};

export const TURN_ORDER: MajorPower[] = [
  'germany',
  'soviet_union',
  'japan',
  'united_states',
  'china',
  'united_kingdom',
  'italy',
  'anzac',
  'france',
];

export const POWER_COLORS: Record<Power, string> = {
  // Major powers
  germany: '#5a5a5a',
  soviet_union: '#af2828',
  japan: '#DCB53F',
  united_states: '#5a5a00',
  china: '#713778',
  united_kingdom: '#916400',
  italy: '#58360E',
  anzac: '#4d7f7f',
  france: '#156CC4',
  // Minor factions
  dutch: '#ff6d00',
  mongolians: '#d8ba7c',
  neutral_true: '#b88a6c',
  neutral_allies: '#d8ba7c',
  neutral_axis: '#6A5B3D',
};

// ------------------------------------------------------------
// Phases
// ------------------------------------------------------------

export type Phase =
  | 'purchase_repair'
  | 'combat_move'
  | 'conduct_combat'
  | 'noncombat_move'
  | 'mobilize'
  | 'collect_income';

export const PHASE_ORDER: Phase[] = [
  'purchase_repair',
  'combat_move',
  'conduct_combat',
  'noncombat_move',
  'mobilize',
  'collect_income',
];

// ------------------------------------------------------------
// Map & Spaces
// ------------------------------------------------------------

export type SpaceKind = 'land' | 'sea';

export interface Point {
  x: number;
  y: number;
}

/** Definition of a space on the map (static data) */
export interface SpaceDef {
  id: string;
  name: string;
  kind: SpaceKind;
  neighbors: string[];
  polygons: Point[][];    // Array of polygons for hit testing (islands have multiple)
  labelAnchor: Point;     // Where to place the name label
  ipcValue?: number;      // Only for land territories
  isVictoryCity?: boolean;
  originalController?: Power;
  isCoastal?: boolean;    // Land territory adjacent to sea
}

// ------------------------------------------------------------
// Units
// ------------------------------------------------------------

export type LandUnitType =
  | 'infantry'
  | 'artillery'
  | 'mechanized_infantry'
  | 'tank'
  | 'aaa';

export type AirUnitType =
  | 'fighter'
  | 'tactical_bomber'
  | 'strategic_bomber';

export type SeaUnitType =
  | 'submarine'
  | 'destroyer'
  | 'cruiser'
  | 'carrier'
  | 'battleship'
  | 'transport';

export type UnitType = LandUnitType | AirUnitType | SeaUnitType;

export interface UnitStats {
  cost: number;
  attack: number;
  defense: number;
  movement: number;
  hits?: number;        // For multi-hit units like battleships (default 1)
  canBlitz?: boolean;
  canBombard?: boolean;
  carrierCapacity?: number;
  transportCapacity?: { infantry: number; other: number };
}

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  // Land units
  infantry:           { cost: 3,  attack: 1, defense: 2, movement: 1 },
  artillery:          { cost: 4,  attack: 2, defense: 2, movement: 1 },
  mechanized_infantry:{ cost: 4,  attack: 1, defense: 2, movement: 2 },
  tank:               { cost: 6,  attack: 3, defense: 3, movement: 2, canBlitz: true },
  aaa:                { cost: 5,  attack: 0, defense: 0, movement: 1 },

  // Air units
  fighter:            { cost: 10, attack: 3, defense: 4, movement: 4 },
  tactical_bomber:    { cost: 11, attack: 3, defense: 3, movement: 4 },
  strategic_bomber:   { cost: 12, attack: 4, defense: 1, movement: 6 },

  // Sea units
  submarine:          { cost: 6,  attack: 2, defense: 1, movement: 2 },
  destroyer:          { cost: 8,  attack: 2, defense: 2, movement: 2 },
  cruiser:            { cost: 12, attack: 3, defense: 3, movement: 2, canBombard: true },
  carrier:            { cost: 16, attack: 0, defense: 2, movement: 2, hits: 2, carrierCapacity: 2 },
  battleship:         { cost: 20, attack: 4, defense: 4, movement: 2, hits: 2, canBombard: true },
  transport:          { cost: 7,  attack: 0, defense: 0, movement: 2, transportCapacity: { infantry: 2, other: 1 } },
};

/** A stack of units of a single type belonging to one power */
export interface UnitStack {
  type: UnitType;
  power: Power;
  count: number;
  damage?: number;  // For damaged capital ships
}

// ------------------------------------------------------------
// Facilities
// ------------------------------------------------------------

export type FacilityType = 'minor_ic' | 'major_ic' | 'air_base' | 'naval_base';

export interface Facility {
  type: FacilityType;
  damage: number;
}

export const FACILITY_MAX_DAMAGE: Record<FacilityType, number> = {
  minor_ic: 6,
  major_ic: 20,
  air_base: 6,
  naval_base: 6,
};

export const FACILITY_PRODUCTION_LIMIT: Record<'minor_ic' | 'major_ic', number> = {
  minor_ic: 3,
  major_ic: 10,
};

// ------------------------------------------------------------
// Space State (dynamic per-game data)
// ------------------------------------------------------------

export interface SpaceState {
  controller?: Power;      // Who controls this space (undefined for sea zones)
  units: UnitStack[];
  facilities: Facility[];
  contestedBy?: Power[];   // Powers with units here (for sea zones)
}

// ------------------------------------------------------------
// Power State
// ------------------------------------------------------------

export interface PowerState {
  ipcs: number;
  capitalCaptured: boolean;
  atWarWith: Power[];
  kamikazeTokens?: number;  // Japan only
}

// UK special: two economies
export interface UKEconomyState {
  europeIPCs: number;
  pacificIPCs: number;
}

// ------------------------------------------------------------
// Game State
// ------------------------------------------------------------

export interface GameState {
  round: number;
  currentPower: Power;
  currentPhase: Phase;
  turnOrderIndex: number;

  spaces: Record<string, SpaceState>;
  powers: Record<Power, PowerState>;

  // UK special economy tracking
  ukEconomy: UKEconomyState;

  // Victory tracking
  victoryCandidate?: {
    side: Side;
    condition: string;
    round: number;
  };
  winner?: Side;

  // Pending purchases for current turn
  pendingPurchases: { type: UnitType | FacilityType; count: number }[];
}

// ------------------------------------------------------------
// Actions (player intents)
// ------------------------------------------------------------

export type Action =
  | { type: 'PURCHASE'; unitType: UnitType; count: number }
  | { type: 'REPAIR'; spaceId: string; facilityType: FacilityType; amount: number }
  | { type: 'MOVE_UNITS'; from: string; to: string; units: { type: UnitType; count: number }[] }
  | { type: 'DECLARE_COMBAT'; spaceId: string }
  | { type: 'ALLOCATE_HITS'; spaceId: string; casualties: { type: UnitType; count: number }[] }
  | { type: 'RETREAT'; from: string; to: string }
  | { type: 'SCRAMBLE'; from: string; to: string; count: number }
  | { type: 'MOBILIZE'; spaceId: string; units: { type: UnitType; count: number }[] }
  | { type: 'END_PHASE' }
  | { type: 'DECLARE_WAR'; target: Power };

// ------------------------------------------------------------
// Events (state changes for animation/replay)
// ------------------------------------------------------------

export type GameEvent =
  | { type: 'PHASE_STARTED'; power: Power; phase: Phase }
  | { type: 'UNITS_MOVED'; from: string; to: string; units: UnitStack[]; power: Power }
  | { type: 'BATTLE_STARTED'; spaceId: string; attackers: UnitStack[]; defenders: UnitStack[] }
  | { type: 'DICE_ROLLED'; spaceId: string; side: 'attacker' | 'defender'; rolls: { unitType: UnitType; roll: number; hit: boolean }[] }
  | { type: 'CASUALTIES_REMOVED'; spaceId: string; side: 'attacker' | 'defender'; units: UnitStack[] }
  | { type: 'BATTLE_ENDED'; spaceId: string; winner: 'attacker' | 'defender' | 'draw' }
  | { type: 'TERRITORY_CAPTURED'; spaceId: string; from: Power; to: Power }
  | { type: 'UNITS_MOBILIZED'; spaceId: string; units: UnitStack[] }
  | { type: 'INCOME_COLLECTED'; power: Power; amount: number; breakdown: { base: number; objectives: number; convoy: number } }
  | { type: 'WAR_DECLARED'; aggressor: Power; target: Power }
  | { type: 'ROUND_ENDED'; round: number }
  | { type: 'VICTORY'; side: Side; condition: string };
