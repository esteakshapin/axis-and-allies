/**
 * Initial Setup for Axis & Allies Global 1940 Second Edition
 * Defines all starting units, facilities, and IPCs for each power
 */

import type { UnitType, FacilityType, Power } from './types';

export interface TerritorySetup {
  units: { type: UnitType; count: number }[];
  facilities: FacilityType[];
}

export interface PowerSetup {
  ipcs: number;
  territories: Record<string, TerritorySetup>;
  seaZones: Record<string, { type: UnitType; count: number }[]>;
}

export const INITIAL_SETUP: Partial<Record<Power, PowerSetup>> = {
  // ============================================================
  // GERMANY - 30 IPCs
  // ============================================================
  germany: {
    ipcs: 30,
    territories: {
      'germany': {
        units: [
          { type: 'infantry', count: 11 },
          { type: 'artillery', count: 3 },
          { type: 'tactical_bomber', count: 1 },
          { type: 'strategic_bomber', count: 2 },
          { type: 'aaa', count: 3 },
        ],
        facilities: ['major_ic'],
      },
      'western_germany': {
        units: [
          { type: 'infantry', count: 3 },
          { type: 'artillery', count: 1 },
          { type: 'mechanized_infantry', count: 4 },
          { type: 'fighter', count: 2 },
          { type: 'tactical_bomber', count: 3 },
          { type: 'aaa', count: 3 },
        ],
        facilities: ['major_ic', 'naval_base', 'air_base'],
      },
      'greater_southern_germany': {
        units: [
          { type: 'infantry', count: 6 },
          { type: 'artillery', count: 2 },
          { type: 'tank', count: 3 },
        ],
        facilities: [],
      },
      'slovakia_hungary': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'tank', count: 1 },
          { type: 'fighter', count: 1 },
        ],
        facilities: [],
      },
      'poland': {
        units: [
          { type: 'infantry', count: 3 },
          { type: 'tank', count: 1 },
          { type: 'tactical_bomber', count: 1 },
        ],
        facilities: [],
      },
      'romania': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'tank', count: 1 },
        ],
        facilities: [],
      },
      'holland_belgium': {
        units: [
          { type: 'infantry', count: 4 },
          { type: 'artillery', count: 2 },
          { type: 'tank', count: 3 },
          { type: 'fighter', count: 1 },
        ],
        facilities: [],
      },
      'norway': {
        units: [
          { type: 'infantry', count: 3 },
          { type: 'fighter', count: 1 },
        ],
        facilities: [],
      },
      'denmark': {
        units: [
          { type: 'infantry', count: 2 },
        ],
        facilities: [],
      },
    },
    seaZones: {
      '113_sea_zone': [{ type: 'battleship', count: 1 }],
      '114_sea_zone': [{ type: 'cruiser', count: 1 }, { type: 'transport', count: 1 }],
      '103_sea_zone': [{ type: 'submarine', count: 1 }],
      '108_sea_zone': [{ type: 'submarine', count: 1 }],
      '117_sea_zone': [{ type: 'submarine', count: 1 }],
      '118_sea_zone': [{ type: 'submarine', count: 1 }],
      '124_sea_zone': [{ type: 'submarine', count: 1 }],
    },
  },

  // ============================================================
  // SOVIET UNION - 37 IPCs
  // ============================================================
  soviet_union: {
    ipcs: 37,
    territories: {
      'russia': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'artillery', count: 1 },
          { type: 'mechanized_infantry', count: 1 },
          { type: 'tank', count: 1 },
          { type: 'fighter', count: 1 },
          { type: 'tactical_bomber', count: 1 },
          { type: 'aaa', count: 2 },
        ],
        facilities: ['major_ic', 'air_base'],
      },
      'novgorod': {
        units: [
          { type: 'infantry', count: 6 },
          { type: 'artillery', count: 1 },
          { type: 'fighter', count: 1 },
          { type: 'aaa', count: 2 },
        ],
        facilities: ['minor_ic', 'naval_base', 'air_base'],
      },
      'archangel': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'karelia': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: [],
      },
      'vyborg': {
        units: [{ type: 'infantry', count: 3 }],
        facilities: [],
      },
      'baltic_states': {
        units: [{ type: 'infantry', count: 3 }],
        facilities: [],
      },
      'belarus': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'eastern_poland': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: [],
      },
      'western_ukraine': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'artillery', count: 1 },
        ],
        facilities: [],
      },
      'bessarabia': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: [],
      },
      'ukraine': {
        units: [{ type: 'infantry', count: 3 }],
        facilities: ['minor_ic'],
      },
      'volgograd': {
        units: [
          { type: 'mechanized_infantry', count: 1 },
          { type: 'tank', count: 1 },
        ],
        facilities: ['minor_ic'],
      },
      'caucasus': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: [],
      },
      'buryatia': {
        units: [{ type: 'infantry', count: 6 }],
        facilities: [],
      },
      'sakha': {
        units: [
          { type: 'infantry', count: 6 },
          { type: 'aaa', count: 2 },
        ],
        facilities: [],
      },
      'amur': {
        units: [{ type: 'infantry', count: 6 }],
        facilities: [],
      },
    },
    seaZones: {
      '115_sea_zone': [{ type: 'cruiser', count: 1 }, { type: 'submarine', count: 1 }],
      '127_sea_zone': [{ type: 'submarine', count: 1 }],
    },
  },

  // ============================================================
  // JAPAN - 26 IPCs
  // ============================================================
  japan: {
    ipcs: 26,
    territories: {
      'japan': {
        units: [
          { type: 'infantry', count: 6 },
          { type: 'artillery', count: 2 },
          { type: 'tank', count: 1 },
          { type: 'fighter', count: 2 },
          { type: 'tactical_bomber', count: 2 },
          { type: 'strategic_bomber', count: 2 },
          { type: 'aaa', count: 3 },
        ],
        facilities: ['major_ic', 'naval_base', 'air_base'],
      },
      'korea': {
        units: [
          { type: 'infantry', count: 4 },
          { type: 'fighter', count: 1 },
        ],
        facilities: [],
      },
      'manchuria': {
        units: [
          { type: 'infantry', count: 6 },
          { type: 'mechanized_infantry', count: 1 },
          { type: 'artillery', count: 1 },
          { type: 'aaa', count: 1 },
          { type: 'fighter', count: 2 },
          { type: 'tactical_bomber', count: 2 },
        ],
        facilities: [],
      },
      'jehol': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'artillery', count: 1 },
        ],
        facilities: [],
      },
      'shantung': {
        units: [
          { type: 'infantry', count: 3 },
          { type: 'artillery', count: 1 },
        ],
        facilities: [],
      },
      'kiangsu': {
        units: [
          { type: 'infantry', count: 3 },
          { type: 'artillery', count: 1 },
          { type: 'fighter', count: 1 },
          { type: 'tactical_bomber', count: 1 },
        ],
        facilities: [],
      },
      'kiangsi': {
        units: [
          { type: 'infantry', count: 3 },
          { type: 'artillery', count: 1 },
        ],
        facilities: [],
      },
      'kwangsi': {
        units: [
          { type: 'infantry', count: 3 },
          { type: 'artillery', count: 1 },
        ],
        facilities: [],
      },
      'siam': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: [],
      },
      'iwo_jima': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'okinawa': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'fighter', count: 1 },
        ],
        facilities: [],
      },
      'formosa': {
        units: [{ type: 'fighter', count: 1 }],
        facilities: [],
      },
      'paulau_island': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'caroline_islands': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'aaa', count: 1 },
        ],
        facilities: ['naval_base', 'air_base'],
      },
    },
    seaZones: {
      '6_sea_zone': [
        { type: 'submarine', count: 1 },
        { type: 'destroyer', count: 2 },
        { type: 'carrier', count: 2 },
        { type: 'cruiser', count: 1 },
        { type: 'battleship', count: 1 },
        { type: 'transport', count: 1 },
        { type: 'fighter', count: 2 },
        { type: 'tactical_bomber', count: 2 },
      ],
      '19_sea_zone': [
        { type: 'submarine', count: 1 },
        { type: 'battleship', count: 1 },
        { type: 'destroyer', count: 1 },
        { type: 'transport', count: 1 },
      ],
      '33_sea_zone': [
        { type: 'destroyer', count: 1 },
        { type: 'carrier', count: 1 },
        { type: 'fighter', count: 1 },
        { type: 'tactical_bomber', count: 1 },
      ],
      '20_sea_zone': [
        { type: 'cruiser', count: 1 },
        { type: 'transport', count: 1 },
      ],
    },
  },

  // ============================================================
  // UNITED STATES - 52 IPCs
  // ============================================================
  united_states: {
    ipcs: 52,
    territories: {
      'eastern_united_states': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'fighter', count: 1 },
          { type: 'artillery', count: 1 },
          { type: 'aaa', count: 2 },
        ],
        facilities: ['minor_ic', 'naval_base', 'air_base'],
      },
      'central_united_states': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'mechanized_infantry', count: 3 },
          { type: 'tank', count: 1 },
          { type: 'strategic_bomber', count: 1 },
        ],
        facilities: ['minor_ic'],
      },
      'western_united_states': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'mechanized_infantry', count: 1 },
          { type: 'artillery', count: 1 },
          { type: 'fighter', count: 1 },
          { type: 'aaa', count: 2 },
        ],
        facilities: ['minor_ic', 'naval_base', 'air_base'],
      },
      'hawaiian_islands': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'fighter', count: 2 },
        ],
        facilities: ['naval_base', 'air_base'],
      },
      'philippines': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'fighter', count: 1 },
        ],
        facilities: ['naval_base', 'air_base'],
      },
      'midway': {
        units: [],
        facilities: ['air_base'],
      },
      'wake_island': {
        units: [],
        facilities: ['air_base'],
      },
      'guam': {
        units: [],
        facilities: ['air_base'],
      },
    },
    seaZones: {
      '10_sea_zone': [
        { type: 'battleship', count: 1 },
        { type: 'cruiser', count: 1 },
        { type: 'destroyer', count: 1 },
        { type: 'transport', count: 1 },
        { type: 'carrier', count: 1 },
        { type: 'fighter', count: 1 },
        { type: 'tactical_bomber', count: 1 },
      ],
      '26_sea_zone': [
        { type: 'submarine', count: 1 },
        { type: 'destroyer', count: 1 },
        { type: 'cruiser', count: 1 },
        { type: 'transport', count: 1 },
      ],
      '35_sea_zone': [
        { type: 'destroyer', count: 1 },
        { type: 'submarine', count: 1 },
      ],
      '101_sea_zone': [
        { type: 'cruiser', count: 1 },
        { type: 'transport', count: 1 },
      ],
    },
  },

  // ============================================================
  // CHINA - 12 IPCs
  // ============================================================
  china: {
    ipcs: 12,
    territories: {
      'suiyuyan': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: [],
      },
      'shensi': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'kweichow': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: [],
      },
      'hunan': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: [],
      },
      'yunnan': {
        units: [{ type: 'infantry', count: 4 }],
        facilities: [],
      },
      'szechwan': {
        units: [
          { type: 'infantry', count: 6 },
          { type: 'fighter', count: 1 },
        ],
        facilities: [],
      },
    },
    seaZones: {},
  },

  // ============================================================
  // UNITED KINGDOM - 28 IPCs (Europe) + 17 IPCs (Pacific)
  // ============================================================
  united_kingdom: {
    ipcs: 28, // Europe side IPCs
    territories: {
      // Europe Side
      'united_kingdom': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'mechanized_infantry', count: 1 },
          { type: 'fighter', count: 2 },
          { type: 'strategic_bomber', count: 1 },
          { type: 'aaa', count: 4 },
        ],
        facilities: ['major_ic', 'naval_base', 'air_base'],
      },
      'scotland': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'fighter', count: 1 },
          { type: 'aaa', count: 1 },
        ],
        facilities: ['air_base'],
      },
      'france': {
        units: [
          { type: 'artillery', count: 1 },
          { type: 'tank', count: 1 },
        ],
        facilities: [],
      },
      'ontario': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'artillery', count: 1 },
        ],
        facilities: [],
      },
      'quebec': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'tank', count: 1 },
        ],
        facilities: ['minor_ic'],
      },
      'new_brunswick_nova_scotia': {
        units: [],
        facilities: ['naval_base'],
      },
      'iceland': {
        units: [],
        facilities: ['air_base'],
      },
      'gibraltar': {
        units: [{ type: 'fighter', count: 1 }],
        facilities: ['naval_base'],
      },
      'malta': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'fighter', count: 1 },
          { type: 'aaa', count: 1 },
        ],
        facilities: [],
      },
      'alexandria': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'artillery', count: 1 },
          { type: 'tank', count: 1 },
        ],
        facilities: [],
      },
      'egypt': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'artillery', count: 1 },
          { type: 'mechanized_infantry', count: 1 },
        ],
        facilities: ['naval_base'],
      },
      'anglo_egyptian_sudan': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'union_of_south_africa': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: ['minor_ic', 'naval_base'],
      },
      'west_india': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      // Pacific Side
      'india': {
        units: [
          { type: 'infantry', count: 6 },
          { type: 'artillery', count: 1 },
          { type: 'aaa', count: 3 },
          { type: 'fighter', count: 1 },
          { type: 'tactical_bomber', count: 1 },
        ],
        facilities: ['major_ic', 'naval_base', 'air_base'],
      },
      'burma': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'fighter', count: 1 },
        ],
        facilities: [],
      },
      'malaya': {
        units: [{ type: 'infantry', count: 3 }], // UK has 3, ANZAC adds 1
        facilities: ['naval_base'],
      },
      'kwangtung': {
        units: [{ type: 'infantry', count: 2 }],
        facilities: ['naval_base'],
      },
    },
    seaZones: {
      '106_sea_zone': [{ type: 'destroyer', count: 1 }, { type: 'transport', count: 1 }],
      '109_sea_zone': [{ type: 'destroyer', count: 1 }, { type: 'transport', count: 1 }],
      '110_sea_zone': [{ type: 'cruiser', count: 1 }, { type: 'battleship', count: 1 }],
      '111_sea_zone': [{ type: 'destroyer', count: 1 }, { type: 'battleship', count: 1 }, { type: 'cruiser', count: 1 }],
      '91_sea_zone': [{ type: 'cruiser', count: 1 }],
      '98_sea_zone': [
        { type: 'cruiser', count: 1 },
        { type: 'destroyer', count: 1 },
        { type: 'carrier', count: 1 },
        { type: 'transport', count: 1 },
        { type: 'tactical_bomber', count: 1 },
      ],
      '71_sea_zone': [{ type: 'destroyer', count: 1 }],
      // Pacific Side
      '37_sea_zone': [{ type: 'battleship', count: 1 }],
      '39_sea_zone': [{ type: 'destroyer', count: 1 }, { type: 'cruiser', count: 1 }, { type: 'transport', count: 1 }],
    },
  },

  // ============================================================
  // ITALY - 10 IPCs
  // ============================================================
  italy: {
    ipcs: 10,
    territories: {
      'northern_italy': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'artillery', count: 2 },
          { type: 'tank', count: 1 },
          { type: 'strategic_bomber', count: 1 },
          { type: 'aaa', count: 2 },
        ],
        facilities: ['major_ic'],
      },
      'southern_italy': {
        units: [
          { type: 'infantry', count: 6 },
          { type: 'fighter', count: 2 },
          { type: 'aaa', count: 2 },
        ],
        facilities: ['minor_ic', 'naval_base', 'air_base'],
      },
      'albania': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'tank', count: 1 },
        ],
        facilities: [],
      },
      'libya': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'artillery', count: 1 },
        ],
        facilities: [],
      },
      'tobruk': {
        units: [
          { type: 'infantry', count: 3 },
          { type: 'artillery', count: 1 },
          { type: 'mechanized_infantry', count: 1 },
          { type: 'tank', count: 1 },
        ],
        facilities: [],
      },
      'ethiopia': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'artillery', count: 1 },
        ],
        facilities: [],
      },
      'italian_somaliland': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
    },
    seaZones: {
      '95_sea_zone': [
        { type: 'destroyer', count: 1 },
        { type: 'cruiser', count: 1 },
        { type: 'submarine', count: 1 },
        { type: 'transport', count: 1 },
      ],
      '96_sea_zone': [{ type: 'destroyer', count: 1 }, { type: 'transport', count: 1 }],
      '97_sea_zone': [{ type: 'cruiser', count: 1 }, { type: 'battleship', count: 1 }, { type: 'transport', count: 1 }],
    },
  },

  // ============================================================
  // ANZAC - 10 IPCs
  // ============================================================
  anzac: {
    ipcs: 10,
    territories: {
      'queensland': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'artillery', count: 1 },
          { type: 'fighter', count: 1 },
        ],
        facilities: ['naval_base', 'air_base'],
      },
      'new_south_wales': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'aaa', count: 2 },
        ],
        facilities: ['minor_ic', 'naval_base'],
      },
      'new_zealand': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'fighter', count: 2 },
        ],
        facilities: ['naval_base', 'air_base'],
      },
      // ANZAC units in UK territories
      'malaya': {
        units: [{ type: 'infantry', count: 1 }], // This adds to UK's 3 infantry
        facilities: [],
      },
      'egypt': {
        units: [{ type: 'infantry', count: 2 }], // ANZAC infantry in Egypt
        facilities: [],
      },
    },
    seaZones: {
      '62_sea_zone': [{ type: 'destroyer', count: 1 }, { type: 'transport', count: 1 }],
      '63_sea_zone': [{ type: 'cruiser', count: 1 }],
    },
  },

  // ============================================================
  // FRANCE - 19 IPCs
  // ============================================================
  france: {
    ipcs: 19,
    territories: {
      'france': {
        units: [
          { type: 'infantry', count: 6 },
          { type: 'artillery', count: 1 },
          { type: 'tank', count: 1 },
          { type: 'aaa', count: 1 },
          { type: 'fighter', count: 1 },
        ],
        facilities: ['major_ic', 'air_base'],
      },
      'normandy_bordeaux': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'artillery', count: 1 },
        ],
        facilities: ['minor_ic', 'naval_base'],
      },
      'southern_france': {
        units: [
          { type: 'infantry', count: 1 },
          { type: 'artillery', count: 1 },
        ],
        facilities: ['minor_ic', 'naval_base'],
      },
      'united_kingdom': {
        units: [
          { type: 'infantry', count: 2 },
          { type: 'fighter', count: 1 },
        ],
        facilities: [],
      },
      'morocco': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'algeria': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'tunisia': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'syria': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
      'french_west_africa': {
        units: [{ type: 'infantry', count: 1 }],
        facilities: [],
      },
    },
    seaZones: {
      '72_sea_zone': [{ type: 'destroyer', count: 1 }],
      '93_sea_zone': [{ type: 'destroyer', count: 1 }, { type: 'cruiser', count: 1 }],
      '110_sea_zone': [{ type: 'cruiser', count: 1 }],
    },
  },
};
