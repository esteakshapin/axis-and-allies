'use client';

import { useState, useMemo, useEffect } from 'react';
import { GLOBAL_SPACES, createInitialGameState } from '@aa/engine';
import { Board } from '@/components/Board';
import { Inspector } from '@/components/Inspector';
import { Lobby, LobbyStartState } from '@/components/Lobby';
import { LobbyPlayer, WsClient } from '@/lib/wsClient';

export default function App() {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [gameId, setGameId] = useState<string | null>(null);
  const [selfPlayer, setSelfPlayer] = useState<LobbyPlayer | null>(null);
  const [socket, setSocket] = useState<WsClient | null>(null);
  const [lobbyError, setLobbyError] = useState<string | null>(null);

  // Create initial game state once
  const gameState = useMemo(() => createInitialGameState(), []);

  const selectedSpace = selectedSpaceId
    ? GLOBAL_SPACES.find((s) => s.id === selectedSpaceId)
    : null;

  const hoveredSpace = hoveredSpaceId
    ? GLOBAL_SPACES.find((s) => s.id === hoveredSpaceId)
    : null;

  useEffect(() => {
    if (!socket) return;
    const off = socket.onClose(() => {
      setView('lobby');
      setSocket(null);
      setSelfPlayer(null);
      setGameId(null);
      setLobbyError('Disconnected from server');
    });
    return off;
  }, [socket]);

  if (view === 'lobby') {
    const handleStart = (state: LobbyStartState, ws: WsClient, self: LobbyPlayer) => {
      setGameId(state.gameId);
      setSelfPlayer(self);
      setSocket(ws);
      setLobbyError(null);
      setView('game');
    };

    return <Lobby onStart={handleStart} initialError={lobbyError} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={styles.header}>
        <div style={styles.title}>Axis & Allies Global 1940</div>
        <div style={styles.hoveredName}>
          {hoveredSpace ? hoveredSpace.name : 'Hover over a territory'}
        </div>
        <div style={styles.stats}>
          {GLOBAL_SPACES.filter(s => s.kind === 'land').length} Land | {GLOBAL_SPACES.filter(s => s.kind === 'sea').length} Sea Zones
        </div>
        {gameId && selfPlayer && (
          <div style={styles.gameInfo}>
            Game: {gameId} • Role: {selfPlayer.role}{selfPlayer.country ? ` • ${selfPlayer.country}` : ''}
          </div>
        )}
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
  gameInfo: {
    color: '#aaa',
    fontSize: 12,
  },
};
