/**
 * Factory functions for creating game states
 */

import type { GameState, SpaceState, Power, UnitStack, Facility } from './types';
import { MAJOR_POWERS } from './types';
import { GLOBAL_SPACES } from './globalMap';
import { INITIAL_SETUP } from './initialSetup';

/**
 * Creates an empty SpaceState with default values
 */
function createEmptySpaceState(): SpaceState {
  return {
    controller: undefined,
    units: [],
    facilities: [],
  };
}

/**
 * Creates the initial game state for Global 1940 Second Edition
 */
export function createInitialGameState(): GameState {
  // Initialize all spaces with empty state and set controllers from originalController
  const spaces: Record<string, SpaceState> = {};

  for (const spaceDef of GLOBAL_SPACES) {
    spaces[spaceDef.id] = createEmptySpaceState();
    // Set controller for land territories based on originalController
    if (spaceDef.kind === 'land' && spaceDef.originalController) {
      spaces[spaceDef.id].controller = spaceDef.originalController;
    }
  }

  // Place units and facilities from INITIAL_SETUP for each power
  for (const [power, setup] of Object.entries(INITIAL_SETUP)) {
    if (!setup) continue;
    const powerKey = power as Power;

    // Place units and facilities in territories
    for (const [territoryId, territorySetup] of Object.entries(setup.territories)) {
      const spaceState = spaces[territoryId];
      if (!spaceState) {
        console.warn(`Territory not found: ${territoryId} for power ${power}`);
        continue;
      }

      // Add units
      for (const unit of territorySetup.units) {
        // Check if we already have units of this type from the same power
        const existingStack = spaceState.units.find(
          (u) => u.type === unit.type && u.power === powerKey
        );
        if (existingStack) {
          existingStack.count += unit.count;
        } else {
          spaceState.units.push({
            type: unit.type,
            power: powerKey,
            count: unit.count,
          });
        }
      }

      // Add facilities (only for the territory's controller)
      for (const facilityType of territorySetup.facilities) {
        // Only add facility if not already present
        if (!spaceState.facilities.some((f) => f.type === facilityType)) {
          spaceState.facilities.push({
            type: facilityType,
            damage: 0,
          });
        }
      }
    }

    // Place naval units in sea zones
    for (const [seaZoneId, units] of Object.entries(setup.seaZones)) {
      const spaceState = spaces[seaZoneId];
      if (!spaceState) {
        console.warn(`Sea zone not found: ${seaZoneId} for power ${power}`);
        continue;
      }

      for (const unit of units) {
        // Check if we already have units of this type from the same power
        const existingStack = spaceState.units.find(
          (u) => u.type === unit.type && u.power === powerKey
        );
        if (existingStack) {
          existingStack.count += unit.count;
        } else {
          spaceState.units.push({
            type: unit.type,
            power: powerKey,
            count: unit.count,
          });
        }
      }
    }
  }

  // Initialize power states
  const powers: GameState['powers'] = {
    // Major powers
    germany: {
      ipcs: INITIAL_SETUP.germany?.ipcs ?? 30,
      capitalCaptured: false,
      atWarWith: ['united_kingdom', 'france'],
    },
    soviet_union: {
      ipcs: INITIAL_SETUP.soviet_union?.ipcs ?? 37,
      capitalCaptured: false,
      atWarWith: [], // Not at war at start
    },
    japan: {
      ipcs: INITIAL_SETUP.japan?.ipcs ?? 26,
      capitalCaptured: false,
      atWarWith: ['china'],
      kamikazeTokens: 6,
    },
    united_states: {
      ipcs: INITIAL_SETUP.united_states?.ipcs ?? 52,
      capitalCaptured: false,
      atWarWith: [], // Not at war at start
    },
    china: {
      ipcs: INITIAL_SETUP.china?.ipcs ?? 12,
      capitalCaptured: false,
      atWarWith: ['japan'],
    },
    united_kingdom: {
      ipcs: INITIAL_SETUP.united_kingdom?.ipcs ?? 28,
      capitalCaptured: false,
      atWarWith: ['germany', 'italy'],
    },
    italy: {
      ipcs: INITIAL_SETUP.italy?.ipcs ?? 10,
      capitalCaptured: false,
      atWarWith: ['united_kingdom', 'france'],
    },
    anzac: {
      ipcs: INITIAL_SETUP.anzac?.ipcs ?? 10,
      capitalCaptured: false,
      atWarWith: [], // Not at war at start but allied with UK
    },
    france: {
      ipcs: INITIAL_SETUP.france?.ipcs ?? 19,
      capitalCaptured: false,
      atWarWith: ['germany', 'italy'],
    },
    // Minor factions (neutral)
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
      europeIPCs: 28,
      pacificIPCs: 17,
    },
    pendingPurchases: [],
  };
}
