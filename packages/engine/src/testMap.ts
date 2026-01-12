import type { SpaceDef, GameState, Power, UnitStack } from './types';

// ============================================================
// Test Map Definition
// A simplified ~12 space map for development & testing
// Layout: roughly mimics a Europe theater scenario
// ============================================================

export const TEST_SPACES: SpaceDef[] = [
  // === LAND TERRITORIES ===
  {
    id: 'germany',
    name: 'Germany',
    kind: 'land',
    neighbors: ['western_europe', 'eastern_europe', 'baltic_sea', 'north_sea'],
    polygons: [[
      { x: 400, y: 150 },
      { x: 500, y: 130 },
      { x: 520, y: 200 },
      { x: 480, y: 280 },
      { x: 380, y: 260 },
      { x: 360, y: 200 },
    ]],
    labelAnchor: { x: 440, y: 200 },
    ipcValue: 10,
    isVictoryCity: true,
    originalController: 'germany',
    isCoastal: true,
  },
  {
    id: 'western_europe',
    name: 'Western Europe',
    kind: 'land',
    neighbors: ['germany', 'united_kingdom', 'north_sea', 'atlantic'],
    polygons: [[
      { x: 200, y: 200 },
      { x: 360, y: 200 },
      { x: 380, y: 260 },
      { x: 350, y: 340 },
      { x: 250, y: 350 },
      { x: 180, y: 280 },
    ]],
    labelAnchor: { x: 280, y: 270 },
    ipcValue: 6,
    originalController: 'germany',
    isCoastal: true,
  },
  {
    id: 'eastern_europe',
    name: 'Eastern Europe',
    kind: 'land',
    neighbors: ['germany', 'soviet_union', 'baltic_sea'],
    polygons: [[
      { x: 520, y: 200 },
      { x: 620, y: 180 },
      { x: 680, y: 250 },
      { x: 640, y: 320 },
      { x: 540, y: 300 },
      { x: 480, y: 280 },
    ]],
    labelAnchor: { x: 570, y: 250 },
    ipcValue: 4,
    originalController: 'germany',
    isCoastal: false,
  },
  {
    id: 'soviet_union',
    name: 'Soviet Union',
    kind: 'land',
    neighbors: ['eastern_europe', 'baltic_sea'],
    polygons: [[
      { x: 620, y: 180 },
      { x: 800, y: 100 },
      { x: 850, y: 200 },
      { x: 820, y: 350 },
      { x: 680, y: 350 },
      { x: 680, y: 250 },
    ]],
    labelAnchor: { x: 740, y: 220 },
    ipcValue: 8,
    isVictoryCity: true,
    originalController: 'soviet_union',
    isCoastal: true,
  },
  {
    id: 'united_kingdom',
    name: 'United Kingdom',
    kind: 'land',
    neighbors: ['western_europe', 'north_sea', 'atlantic'],
    polygons: [[
      { x: 150, y: 80 },
      { x: 220, y: 70 },
      { x: 240, y: 140 },
      { x: 200, y: 180 },
      { x: 140, y: 170 },
      { x: 130, y: 120 },
    ]],
    labelAnchor: { x: 180, y: 125 },
    ipcValue: 6,
    isVictoryCity: true,
    originalController: 'united_kingdom',
    isCoastal: true,
  },
  {
    id: 'italy',
    name: 'Italy',
    kind: 'land',
    neighbors: ['western_europe', 'mediterranean'],
    polygons: [[
      { x: 350, y: 340 },
      { x: 420, y: 320 },
      { x: 460, y: 380 },
      { x: 430, y: 450 },
      { x: 360, y: 440 },
      { x: 320, y: 380 },
    ]],
    labelAnchor: { x: 390, y: 390 },
    ipcValue: 4,
    isVictoryCity: true,
    originalController: 'italy',
    isCoastal: true,
  },
  {
    id: 'north_africa',
    name: 'North Africa',
    kind: 'land',
    neighbors: ['mediterranean', 'atlantic'],
    polygons: [[
      { x: 200, y: 450 },
      { x: 400, y: 480 },
      { x: 500, y: 520 },
      { x: 450, y: 580 },
      { x: 250, y: 580 },
      { x: 150, y: 520 },
    ]],
    labelAnchor: { x: 320, y: 530 },
    ipcValue: 2,
    originalController: 'italy',
    isCoastal: true,
  },

  // === SEA ZONES ===
  {
    id: 'north_sea',
    name: 'North Sea',
    kind: 'sea',
    neighbors: ['germany', 'western_europe', 'united_kingdom', 'atlantic', 'baltic_sea'],
    polygons: [[
      { x: 240, y: 140 },
      { x: 360, y: 120 },
      { x: 400, y: 150 },
      { x: 360, y: 200 },
      { x: 200, y: 200 },
      { x: 200, y: 180 },
    ]],
    labelAnchor: { x: 300, y: 160 },
  },
  {
    id: 'baltic_sea',
    name: 'Baltic Sea',
    kind: 'sea',
    neighbors: ['germany', 'eastern_europe', 'soviet_union', 'north_sea'],
    polygons: [[
      { x: 500, y: 130 },
      { x: 620, y: 100 },
      { x: 620, y: 180 },
      { x: 520, y: 200 },
    ]],
    labelAnchor: { x: 560, y: 150 },
  },
  {
    id: 'atlantic',
    name: 'Atlantic Ocean',
    kind: 'sea',
    neighbors: ['united_kingdom', 'western_europe', 'north_africa', 'north_sea', 'mediterranean'],
    polygons: [[
      { x: 50, y: 100 },
      { x: 130, y: 120 },
      { x: 140, y: 170 },
      { x: 180, y: 280 },
      { x: 150, y: 520 },
      { x: 50, y: 500 },
    ]],
    labelAnchor: { x: 100, y: 320 },
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean Sea',
    kind: 'sea',
    neighbors: ['italy', 'north_africa', 'atlantic'],
    polygons: [[
      { x: 250, y: 350 },
      { x: 320, y: 380 },
      { x: 360, y: 440 },
      { x: 430, y: 450 },
      { x: 460, y: 480 },
      { x: 400, y: 480 },
      { x: 200, y: 450 },
      { x: 180, y: 400 },
    ]],
    labelAnchor: { x: 320, y: 420 },
  },
];

// ============================================================
// Initial Game State Factory
// ============================================================

function createEmptySpaceState(): { controller?: Power; units: UnitStack[]; facilities: never[]; contestedBy?: Power[] } {
  return {
    controller: undefined,
    units: [],
    facilities: [],
  };
}

export function makeTestGameState(): GameState {
  // Initialize spaces
  const spaces: GameState['spaces'] = {};
  for (const spaceDef of TEST_SPACES) {
    spaces[spaceDef.id] = createEmptySpaceState();
    if (spaceDef.kind === 'land' && spaceDef.originalController) {
      spaces[spaceDef.id].controller = spaceDef.originalController;
    }
  }

  // Place initial units for each power
  // Germany
  spaces['germany'].units = [
    { type: 'infantry', power: 'germany', count: 6 },
    { type: 'tank', power: 'germany', count: 3 },
    { type: 'fighter', power: 'germany', count: 2 },
    { type: 'tactical_bomber', power: 'germany', count: 1 },
  ];
  spaces['germany'].facilities = [{ type: 'major_ic', damage: 0 }];

  spaces['western_europe'].units = [
    { type: 'infantry', power: 'germany', count: 4 },
    { type: 'artillery', power: 'germany', count: 2 },
  ];

  spaces['eastern_europe'].units = [
    { type: 'infantry', power: 'germany', count: 3 },
    { type: 'mechanized_infantry', power: 'germany', count: 2 },
    { type: 'tank', power: 'germany', count: 2 },
  ];

  // Soviet Union
  spaces['soviet_union'].units = [
    { type: 'infantry', power: 'soviet_union', count: 8 },
    { type: 'artillery', power: 'soviet_union', count: 2 },
    { type: 'tank', power: 'soviet_union', count: 2 },
    { type: 'fighter', power: 'soviet_union', count: 2 },
    { type: 'aaa', power: 'soviet_union', count: 1 },
  ];
  spaces['soviet_union'].facilities = [{ type: 'major_ic', damage: 0 }];

  // United Kingdom
  spaces['united_kingdom'].units = [
    { type: 'infantry', power: 'united_kingdom', count: 4 },
    { type: 'fighter', power: 'united_kingdom', count: 2 },
    { type: 'strategic_bomber', power: 'united_kingdom', count: 1 },
  ];
  spaces['united_kingdom'].facilities = [
    { type: 'major_ic', damage: 0 },
    { type: 'naval_base', damage: 0 },
  ];

  // UK Navy in North Sea
  spaces['north_sea'].units = [
    { type: 'battleship', power: 'united_kingdom', count: 1 },
    { type: 'cruiser', power: 'united_kingdom', count: 1 },
    { type: 'destroyer', power: 'united_kingdom', count: 2 },
    { type: 'transport', power: 'united_kingdom', count: 1 },
  ];

  // Italy
  spaces['italy'].units = [
    { type: 'infantry', power: 'italy', count: 4 },
    { type: 'artillery', power: 'italy', count: 1 },
    { type: 'tank', power: 'italy', count: 1 },
    { type: 'fighter', power: 'italy', count: 1 },
  ];
  spaces['italy'].facilities = [{ type: 'minor_ic', damage: 0 }];

  // Italian Navy in Mediterranean
  spaces['mediterranean'].units = [
    { type: 'cruiser', power: 'italy', count: 1 },
    { type: 'submarine', power: 'italy', count: 2 },
    { type: 'transport', power: 'italy', count: 1 },
  ];

  spaces['north_africa'].units = [
    { type: 'infantry', power: 'italy', count: 2 },
    { type: 'tank', power: 'italy', count: 1 },
  ];

  // German Navy in Baltic
  spaces['baltic_sea'].units = [
    { type: 'submarine', power: 'germany', count: 2 },
    { type: 'transport', power: 'germany', count: 1 },
  ];

  // Atlantic - some UK convoy presence
  spaces['atlantic'].units = [
    { type: 'destroyer', power: 'united_kingdom', count: 1 },
    { type: 'transport', power: 'united_kingdom', count: 2 },
  ];

  // Initialize power states
  const powers: GameState['powers'] = {
    // Major powers
    germany: { ipcs: 30, capitalCaptured: false, atWarWith: ['united_kingdom', 'france'] },
    soviet_union: { ipcs: 24, capitalCaptured: false, atWarWith: [] },
    japan: { ipcs: 26, capitalCaptured: false, atWarWith: ['china'], kamikazeTokens: 6 },
    united_states: { ipcs: 52, capitalCaptured: false, atWarWith: [] },
    china: { ipcs: 0, capitalCaptured: false, atWarWith: ['japan'] },
    united_kingdom: { ipcs: 28, capitalCaptured: false, atWarWith: ['germany', 'italy'] },
    italy: { ipcs: 10, capitalCaptured: false, atWarWith: ['united_kingdom', 'france'] },
    anzac: { ipcs: 10, capitalCaptured: false, atWarWith: [] },
    france: { ipcs: 0, capitalCaptured: true, atWarWith: ['germany', 'italy'] }, // France fallen
    // Minor factions
    dutch: { ipcs: 0, capitalCaptured: false, atWarWith: [] },
    mongolians: { ipcs: 0, capitalCaptured: false, atWarWith: [] },
    neutral_true: { ipcs: 0, capitalCaptured: false, atWarWith: [] },
    neutral_allies: { ipcs: 0, capitalCaptured: false, atWarWith: [] },
    neutral_axis: { ipcs: 0, capitalCaptured: false, atWarWith: [] },
  };

  return {
    round: 1,
    currentPower: 'germany',
    currentPhase: 'purchase_repair',
    turnOrderIndex: 0,
    spaces,
    powers,
    ukEconomy: {
      europeIPCs: 18,
      pacificIPCs: 10,
    },
    pendingPurchases: [],
  };
}

// ============================================================
// Map Queries
// ============================================================

export function getSpaceDef(spaceId: string): SpaceDef | undefined {
  return TEST_SPACES.find(s => s.id === spaceId);
}

export function getNeighbors(spaceId: string): SpaceDef[] {
  const space = getSpaceDef(spaceId);
  if (!space) return [];
  return space.neighbors
    .map(id => getSpaceDef(id))
    .filter((s): s is SpaceDef => s !== undefined);
}

export function isAdjacent(spaceId1: string, spaceId2: string): boolean {
  const space = getSpaceDef(spaceId1);
  return space?.neighbors.includes(spaceId2) ?? false;
}
