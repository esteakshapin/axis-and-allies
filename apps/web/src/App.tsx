/// <reference types="vite/client" />
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { GLOBAL_SPACES, createInitialGameState } from '@aa/engine';
import { Board } from '@/components/Board';
import { Inspector } from '@/components/Inspector';
import { LandingPage } from '@/components/LandingPage';
import { GameLobby } from '@/components/GameLobby';
import { WsClient } from '@/lib/wsClient';
import { GameSettings } from '@/components/CreateGameModal';

type ViewState = 'landing' | 'connecting' | 'gameLobby' | 'game';

// Get WebSocket URL based on environment
const getWsUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:3000';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // In development, Vite runs on 5173 but our WebSocket server runs on 3000
  const host = window.location.hostname;
  const port = import.meta.env.DEV ? '3000' : window.location.port;
  return `${protocol}//${host}:${port}`;
};

export default function App() {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [gameId, setGameId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [role, setRole] = useState<'host' | 'client'>('host');
  const [socket, setSocket] = useState<WsClient | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');

  // Create initial game state once
  const gameState = useMemo(() => createInitialGameState(), []);

  const selectedSpace = selectedSpaceId
    ? GLOBAL_SPACES.find((s) => s.id === selectedSpaceId)
    : null;

  const hoveredSpace = hoveredSpaceId
    ? GLOBAL_SPACES.find((s) => s.id === hoveredSpaceId)
    : null;

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  // Connect and create a game
  const connectAndCreate = useCallback(async (name: string, _settings: GameSettings) => {
    setView('connecting');
    setConnectionError(null);
    setPlayerName(name);
    setRole('host');

    try {
      const ws = new WsClient();
      await ws.connect(getWsUrl());

      // Generate a game ID
      const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Set up one-time handler for game creation response
      const cleanup = ws.on('game_created', ({ gameId: createdGameId, clientId: myClientId }) => {
        cleanup();
        setGameId(createdGameId);
        setClientId(myClientId);
        setSocket(ws);
        setView('gameLobby');
      });

      const errorCleanup = ws.on('error', ({ reason }) => {
        errorCleanup();
        setConnectionError(`Failed to create game: ${reason}`);
        setView('landing');
        ws.disconnect();
      });

      // Send create game message
      ws.send({
        type: 'create_game',
        clientId: crypto.randomUUID(),
        gameId: newGameId,
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (view === 'connecting') {
          setConnectionError('Connection timeout');
          setView('landing');
          ws.disconnect();
        }
      }, 5000);
    } catch (error) {
      setConnectionError('Failed to connect to server. Make sure the server is running.');
      setView('landing');
    }
  }, [view]);

  // Connect and join a game
  const connectAndJoin = useCallback(async (name: string, code: string) => {
    setView('connecting');
    setConnectionError(null);
    setPlayerName(name);
    setRole('client');

    try {
      const ws = new WsClient();
      await ws.connect(getWsUrl());

      // Set up one-time handler for join response
      const cleanup = ws.on('joined_game', ({ gameId: joinedGameId, clientId: myClientId }) => {
        cleanup();
        setGameId(joinedGameId);
        setClientId(myClientId);
        setSocket(ws);
        setView('gameLobby');
      });

      const errorCleanup = ws.on('error', ({ reason }) => {
        errorCleanup();
        setConnectionError(`Failed to join game: ${reason}`);
        setView('landing');
        ws.disconnect();
      });

      // Send join game message
      ws.send({
        type: 'join_game',
        clientId: crypto.randomUUID(),
        gameId: code.toUpperCase(),
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (view === 'connecting') {
          setConnectionError('Connection timeout');
          setView('landing');
          ws.disconnect();
        }
      }, 5000);
    } catch (error) {
      setConnectionError('Failed to connect to server. Make sure the server is running.');
      setView('landing');
    }
  }, [view]);

  // Handle leaving a game
  const handleLeave = useCallback(() => {
    socket?.disconnect();
    setSocket(null);
    setGameId(null);
    setClientId(null);
    setView('landing');
  }, [socket]);

  // Handle starting the game
  const handleStartGame = useCallback(() => {
    setView('game');
  }, []);

  // Landing page view
  if (view === 'landing') {
    return (
      <LandingPage
        onCreateGame={connectAndCreate}
        onJoinGame={connectAndJoin}
        error={connectionError}
      />
    );
  }

  // Connecting view
  if (view === 'connecting') {
    return (
      <div className="min-h-screen w-full bg-paper text-ink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-ink border-t-transparent rounded-full mx-auto mb-4" />
          <p className="font-typewriter text-lg">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  // Game Lobby view (team selection)
  if (view === 'gameLobby' && gameId && clientId) {
    return (
      <GameLobby
        gameCode={gameId}
        playerName={playerName || 'Commander'}
        ws={socket}
        role={role}
        clientId={clientId}
        onLeave={handleLeave}
        onStartGame={handleStartGame}
      />
    );
  }

  // Game view
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
        {gameId && (
          <div style={styles.gameInfo}>
            Game: {gameId} • Role: {role}
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
