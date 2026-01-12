'use client';

import type { GameState, Power, Phase } from '@aa/engine';

interface PhaseHeaderProps {
  gameState: GameState;
}

const POWER_DISPLAY_NAMES: Record<Power, string> = {
  // Major powers
  germany: 'Germany',
  soviet_union: 'Soviet Union',
  japan: 'Japan',
  united_states: 'United States',
  china: 'China',
  united_kingdom: 'United Kingdom',
  italy: 'Italy',
  anzac: 'ANZAC',
  france: 'France',
  // Minor factions
  dutch: 'Dutch',
  mongolians: 'Mongolians',
  neutral_true: 'Neutral',
  neutral_allies: 'Pro-Allied Neutral',
  neutral_axis: 'Pro-Axis Neutral',
};

const PHASE_DISPLAY_NAMES: Record<Phase, string> = {
  purchase_repair: 'Purchase & Repair',
  combat_move: 'Combat Move',
  conduct_combat: 'Conduct Combat',
  noncombat_move: 'Non-Combat Move',
  mobilize: 'Mobilize',
  collect_income: 'Collect Income',
};

const POWER_COLORS: Record<Power, string> = {
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

export function PhaseHeader({ gameState }: PhaseHeaderProps) {
  const { currentPower, currentPhase, round } = gameState;
  const powerState = gameState.powers[currentPower];

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <span style={styles.roundLabel}>Round {round}</span>
      </div>
      <div style={styles.center}>
        <div
          style={{
            ...styles.powerBadge,
            backgroundColor: POWER_COLORS[currentPower],
          }}
        >
          {POWER_DISPLAY_NAMES[currentPower]}
        </div>
        <div style={styles.phase}>{PHASE_DISPLAY_NAMES[currentPhase]}</div>
      </div>
      <div style={styles.right}>
        <span style={styles.ipcLabel}>
          IPCs: <span style={styles.ipcValue}>{powerState.ipcs}</span>
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16162a',
    borderBottom: '2px solid #3d3d5c',
    padding: '12px 24px',
    height: 60,
  },
  left: {
    flex: 1,
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  right: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  roundLabel: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  powerBadge: {
    padding: '4px 16px',
    borderRadius: 4,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  phase: {
    color: '#aaa',
    fontSize: 12,
  },
  ipcLabel: {
    color: '#888',
    fontSize: 14,
  },
  ipcValue: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: 16,
  },
};
