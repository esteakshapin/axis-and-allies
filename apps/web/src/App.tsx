/// <reference types="vite/client" />
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Move, ArrowLeft } from 'lucide-react';
import { GLOBAL_SPACES, createInitialGameState, SpaceDef } from '@aa/engine';
import { Board } from '@/components/Board';
import { LandingPage } from '@/components/LandingPage';
import { GameLobby } from '@/components/GameLobby';
import { GameHeader } from '@/components/GameHeader';
import { TerritoryInfoPanel, TerritoryData } from '@/components/TerritoryInfoPanel';
import { WsClient, GameState } from '@/lib/wsClient';
import { GameSettings } from '@/components/CreateGameModal';

type ViewState = 'landing' | 'connecting' | 'gameLobby' | 'game';

// Get WebSocket URL based on environment
const getWsUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:4000';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // In development, Vite runs on 5000 but our WebSocket server runs on 4000
  const host = window.location.hostname;
  const port = import.meta.env.DEV ? '4000' : window.location.port;
  return `${protocol}//${host}:${port}`;
};

// Convert SpaceDef to TerritoryData for the info panel
function spaceToTerritoryData(space: SpaceDef): TerritoryData {
  return {
    id: space.id,
    name: space.name,
    type: space.kind === 'land' ? 'Land Territory' : 'Sea Zone',
    ipcValue: space.kind === 'land' ? (space.ipcValue ?? 0) : 0,
    originalOwner: space.kind === 'land' ? (space.originalController ?? 'Neutral') : 'N/A',
    neighbors: space.neighbors,
    polygons: {
      count: space.polygons.length,
      totalVertices: space.polygons.reduce((sum, p) => sum + p.length, 0),
      center: [space.labelAnchor.x, space.labelAnchor.y],
    },
    // Units would come from game state - placeholder for now
    units: [],
  };
}

export default function App() {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [gameId, setGameId] = useState<string | null>(null);
  const [socket, setSocket] = useState<WsClient | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [initialGameState, setInitialGameState] = useState<GameState | undefined>(undefined);

  // Create initial game state once
  const gameState = useMemo(() => createInitialGameState(), []);

  const selectedSpace = selectedSpaceId
    ? GLOBAL_SPACES.find((s) => s.id === selectedSpaceId)
    : null;

  const selectedTerritoryData = selectedSpace
    ? spaceToTerritoryData(selectedSpace)
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

    try {
      const ws = new WsClient();
      await ws.connect(getWsUrl());

      // Set up one-time handler for game creation response
      const cleanup = ws.on('game_created', ({ gameId: createdGameId, state }) => {
        cleanup();
        setGameId(createdGameId);
        setInitialGameState(state);
        setSocket(ws);
        setView('gameLobby');
      });

      const errorCleanup = ws.on('error', ({ reason }) => {
        errorCleanup();
        setConnectionError(`Failed to create game: ${reason}`);
        setView('landing');
        ws.disconnect();
      });

      // Send create game message with player name
      ws.send({
        type: 'create_game',
        playerName: name,
        playerColor: '#b91c1c', // Default red color
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

    try {
      const ws = new WsClient();
      await ws.connect(getWsUrl());

      // Set up one-time handler for join response
      const joinCleanup = ws.on('joined_game', ({ gameId: joinedGameId, state }) => {
        joinCleanup();
        setGameId(joinedGameId);
        setInitialGameState(state);
        setSocket(ws);
        setView('gameLobby');
      });

      // Handle reconnection
      const rejoinCleanup = ws.on('rejoined_game', ({ gameId: rejoinedGameId, state }) => {
        rejoinCleanup();
        setGameId(rejoinedGameId);
        setInitialGameState(state);
        setSocket(ws);
        setView('gameLobby');
      });

      const errorCleanup = ws.on('error', ({ reason }) => {
        errorCleanup();
        setConnectionError(`Failed to join game: ${reason}`);
        setView('landing');
        ws.disconnect();
      });

      // Send join game message with player name
      ws.send({
        type: 'join_game',
        playerName: name,
        playerColor: '#1d4ed8', // Default blue color
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
    setInitialGameState(undefined);
    setView('landing');
  }, [socket]);

  // Handle starting the game
  const handleStartGame = useCallback(() => {
    setView('game');
  }, []);

  // Handle going back to lobby from game
  const handleBackToLobby = useCallback(() => {
    setView('gameLobby');
  }, []);

  // Handle neighbor click in territory panel
  const handleNeighborClick = useCallback((neighborId: string) => {
    const space = GLOBAL_SPACES.find(s => s.id === neighborId || s.name === neighborId);
    if (space) {
      setSelectedSpaceId(space.id);
    }
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
  if (view === 'gameLobby' && gameId) {
    return (
      <GameLobby
        gameCode={gameId}
        playerName={playerName || 'Commander'}
        ws={socket}
        initialState={initialGameState}
        onLeave={handleLeave}
        onStartGame={handleStartGame}
      />
    );
  }

  // Game view - New layout with header, map, and overlay panel
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0a1628]">
      {/* Game Header */}
      <GameHeader
        turn={3}
        phase="Combat Move"
        activePlayer={{
          name: playerName || 'Commander',
          color: 'bg-military-red',
        }}
      />

      {/* Main Game Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map - Full width, behind everything */}
        <div className="absolute inset-0">
          <Board
            spaces={GLOBAL_SPACES}
            gameState={gameState}
            selectedSpaceId={selectedSpaceId}
            hoveredSpaceId={hoveredSpaceId}
            onSpaceClick={setSelectedSpaceId}
            onSpaceHover={setHoveredSpaceId}
          />
        </div>

        {/* Territory Info Panel - Overlaid on right */}
        <div className="absolute top-0 right-0 h-full z-30">
          <TerritoryInfoPanel
            territory={selectedTerritoryData}
            onNeighborClick={handleNeighborClick}
          />
        </div>

        {/* Map Controls - Bottom left */}
        <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-3">
          {/* Zoom Controls */}
          <div className="flex flex-col bg-paper-light border-2 border-ink rounded-lg overflow-hidden shadow-lg">
            <motion.button
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 border-b border-ink/20 text-ink hover:text-military-red transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </motion.button>
            <motion.button
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 border-b border-ink/20 text-ink hover:text-military-red transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </motion.button>
            <motion.button
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 text-ink hover:text-military-red transition-colors"
              title="Reset View"
            >
              <Move size={20} />
            </motion.button>
          </div>

          {/* Back to Lobby Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackToLobby}
            className="
              flex items-center gap-2
              px-4 py-2.5
              bg-paper-light border-2 border-ink
              rounded-lg shadow-lg
              font-stencil text-sm uppercase tracking-wider
              text-ink hover:text-military-red
              transition-colors
            "
          >
            <ArrowLeft size={16} />
            Lobby
          </motion.button>
        </div>
      </div>
    </div>
  );
}
