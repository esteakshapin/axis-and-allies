'use client';

import { useState, useMemo } from 'react';
import { GLOBAL_SPACES, createInitialGameState } from '@aa/engine';
import { Board } from '@/components/Board';
import { Inspector } from '@/components/Inspector';

export default function Home() {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);

  // Create initial game state once
  const gameState = useMemo(() => createInitialGameState(), []);

  const selectedSpace = selectedSpaceId
    ? GLOBAL_SPACES.find((s) => s.id === selectedSpaceId)
    : null;

  const hoveredSpace = hoveredSpaceId
    ? GLOBAL_SPACES.find((s) => s.id === hoveredSpaceId)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Simple header */}
      <div style={styles.header}>
        <div style={styles.title}>Axis & Allies Global 1940</div>
        <div style={styles.hoveredName}>
          {hoveredSpace ? hoveredSpace.name : 'Hover over a territory'}
        </div>
        <div style={styles.stats}>
          {GLOBAL_SPACES.filter(s => s.kind === 'land').length} Land | {GLOBAL_SPACES.filter(s => s.kind === 'sea').length} Sea Zones
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Board
            spaces={GLOBAL_SPACES}
            gameState={gameState}
            selectedSpaceId={selectedSpaceId}
            hoveredSpaceId={hoveredSpaceId}
            onSpaceClick={setSelectedSpaceId}
            onSpaceHover={setHoveredSpaceId}
          />
        </div>
        <Inspector spaceDef={selectedSpace ?? undefined} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16162a',
    borderBottom: '2px solid #3d3d5c',
    padding: '12px 24px',
    height: 60,
  },
  title: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hoveredName: {
    color: '#fff',
    fontSize: 16,
    minWidth: 200,
    textAlign: 'center',
  },
  stats: {
    color: '#888',
    fontSize: 14,
  },
};
