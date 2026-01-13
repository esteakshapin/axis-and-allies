import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, ArrowLeft, Settings, Map as MapIcon, Users, Crown } from 'lucide-react';
import { Button } from './ui/Button';
import { TeamSection } from './TeamSection';
import { SpectatorSection } from './SpectatorSection';
import { WsClient, PlayerInfo, CountryAssignment, GameState } from '@/lib/wsClient';

interface GameLobbyProps {
  gameCode: string;
  playerName: string;
  ws: WsClient | null;
  initialState?: GameState;
  onLeave: () => void;
  onStartGame: () => void;
}

export function GameLobby({
  gameCode,
  playerName,
  ws,
  initialState,
  onLeave,
  onStartGame
}: GameLobbyProps) {
  // Game state from server
  const [players, setPlayers] = useState<PlayerInfo[]>(initialState?.players ?? []);
  const [axisCountries, setAxisCountries] = useState<CountryAssignment[]>(initialState?.axisCountries ?? []);
  const [alliedCountries, setAlliedCountries] = useState<CountryAssignment[]>(initialState?.alliedCountries ?? []);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>(
    ws ? 'connected' : 'disconnected'
  );

  // Find current player info
  const currentPlayer = players.find(p => p.name === playerName);
  const currentPlayerTeam = currentPlayer?.team ?? null;
  const isHost = currentPlayer?.isHost ?? false;

  // Set up WebSocket handlers
  useEffect(() => {
    if (!ws) return;

    const cleanups: (() => void)[] = [];

    // Listen for state updates from server
    cleanups.push(
      ws.on('state_update', ({ state }) => {
        setPlayers(state.players);
        setAxisCountries(state.axisCountries);
        setAlliedCountries(state.alliedCountries);
      })
    );

    // Listen for game started
    cleanups.push(
      ws.on('game_started', ({ state }) => {
        setPlayers(state.players);
        setAxisCountries(state.axisCountries);
        setAlliedCountries(state.alliedCountries);
        onStartGame();
      })
    );

    // Listen for player events (optional notifications)
    cleanups.push(
      ws.on('player_joined', ({ playerName: name }) => {
        console.log(`${name} joined the game`);
      })
    );

    cleanups.push(
      ws.on('player_disconnected', ({ playerName: name }) => {
        console.log(`${name} disconnected`);
      })
    );

    cleanups.push(
      ws.on('player_reconnected', ({ playerName: name }) => {
        console.log(`${name} reconnected`);
      })
    );

    cleanups.push(
      ws.on('error', ({ reason }) => {
        console.error('WebSocket error:', reason);
      })
    );

    cleanups.push(
      ws.onClose(() => {
        setConnectionStatus('disconnected');
      })
    );

    return () => cleanups.forEach(cleanup => cleanup());
  }, [ws, onStartGame]);

  // Send action to server
  const sendAction = useCallback((action: Parameters<WsClient['sendAction']>[0]) => {
    if (!ws) return;
    ws.sendAction(action);
  }, [ws]);

  // Get players by team
  const spectators = players.filter(p => p.team === null);
  const axisPlayers = players.filter(p => p.team === 'axis');
  const alliedPlayers = players.filter(p => p.team === 'allies');

  // UI Handlers - all actions go to server
  const handlePlayerLeaveTeam = (pName: string) => {
    if (pName !== playerName) return; // Can only move yourself
    sendAction({ type: 'join_team', team: null });
  };

  const handlePlayerJoinTeam = (team: 'axis' | 'allies') => (pName: string) => {
    if (pName !== playerName) return; // Can only move yourself
    sendAction({ type: 'join_team', team });
  };

  const handleCountryDragStart = (_team: 'axis' | 'allies') => (_countryId: string) => {
    // Visual feedback only
  };

  const handleCountryDrop = (_team: 'axis' | 'allies') => (countryId: string, targetPlayerName: string) => {
    if (targetPlayerName !== playerName) return; // Can only assign to yourself
    sendAction({ type: 'assign_country', countryId });
  };

  const handleCountryUnassign = (_team: 'axis' | 'allies') => (countryId: string) => {
    sendAction({ type: 'unassign_country', countryId });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode);
  };

  const handleStartGame = () => {
    if (isHost) {
      sendAction({ type: 'start_game' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-paper text-ink flex flex-col relative overflow-hidden font-serif">
      {/* Background map */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-paper-dark" />

      {/* Header */}
      <header className="relative z-10 border-b-4 border-ink bg-paper-light shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLeave}
              leftIcon={<ArrowLeft size={16} />}
            >
              Abort
            </Button>

            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-faded font-stencil">
                Operation Code
              </span>
              <div className="flex items-center gap-2">
                <span className="font-typewriter font-bold text-2xl tracking-widest text-military-red">
                  {gameCode}
                </span>
                <button
                  onClick={copyCode}
                  className="text-ink-faded hover:text-ink transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-typewriter text-ink-faded border px-3 py-1 border-ink-faded/30 bg-paper-aged/30">
              <Users size={16} />
              {players.filter(p => p.connected).length}/{players.length} Online
            </div>
            {isHost && (
              <div className="flex items-center gap-2 text-sm font-typewriter text-military-navy border px-3 py-1 border-military-khaki/30 bg-paper-aged/30">
                <Crown size={16} />
                HOST
              </div>
            )}
            <div className={`hidden md:flex items-center gap-2 text-sm font-typewriter border px-3 py-1 border-ink-faded/30 bg-paper-aged/30 ${
              connectionStatus === 'connected' ? 'text-green-700' : 'text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-600 animate-pulse' : 'bg-red-600'
              }`} />
              {connectionStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
            <Button variant="ghost" size="sm">
              <Settings size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 p-4 md:p-8 overflow-y-auto pb-32">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-stencil text-3xl md:text-4xl font-bold uppercase text-ink mb-2">
              War Room Assignment
            </h1>
            <p className="font-typewriter text-ink-faded italic">
              {currentPlayerTeam === null
                ? 'Drag yourself to join Axis or Allied forces, then command territories.'
                : 'Drag territories to your zone. You can only control your own forces.'}
            </p>
            {isHost && (
              <p className="font-typewriter text-military-green text-sm mt-1">
                You are the host. Share the code above with others to join.
              </p>
            )}
          </div>

          {/* Spectators Section - Always visible */}
          <SpectatorSection
            spectators={spectators.map(p => ({
              id: p.name,
              name: p.name,
              color: p.color,
              connected: p.connected,
              isHost: p.isHost,
            }))}
            currentPlayerId={playerName}
            onPlayerDragStart={() => {}}
            onPlayerDrop={handlePlayerLeaveTeam}
          />

          {/* Teams Grid */}
          <div className="grid md:grid-cols-2 gap-8 min-h-[500px] items-start relative">
            <TeamSection
              team="axis"
              countries={axisCountries}
              players={axisPlayers.map(p => ({
                id: p.name,
                name: p.name,
                color: p.color,
                role: p.isHost ? 'host' : 'client',
                team: p.team,
                assignedCountries: p.assignedCountries,
                ready: false,
                connected: p.connected,
                isHost: p.isHost,
              }))}
              currentPlayerId={playerName}
              currentPlayerTeam={currentPlayerTeam}
              onCountryDragStart={handleCountryDragStart('axis')}
              onCountryDrop={handleCountryDrop('axis')}
              onCountryUnassign={handleCountryUnassign('axis')}
              onPlayerDrop={handlePlayerJoinTeam('axis')}
            />

            {/* VS Badge */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex-col items-center pointer-events-none">
              <div className="h-16 w-1 bg-ink/20 mb-2" />
              <div className="bg-ink text-paper-light w-12 h-12 rounded-full flex items-center justify-center font-stencil font-bold text-xl border-4 border-paper-light shadow-lg">
                VS
              </div>
              <div className="h-16 w-1 bg-ink/20 mt-2" />
            </div>

            <TeamSection
              team="allies"
              countries={alliedCountries}
              players={alliedPlayers.map(p => ({
                id: p.name,
                name: p.name,
                color: p.color,
                role: p.isHost ? 'host' : 'client',
                team: p.team,
                assignedCountries: p.assignedCountries,
                ready: false,
                connected: p.connected,
                isHost: p.isHost,
              }))}
              currentPlayerId={playerName}
              currentPlayerTeam={currentPlayerTeam}
              onCountryDragStart={handleCountryDragStart('allies')}
              onCountryDrop={handleCountryDrop('allies')}
              onCountryUnassign={handleCountryUnassign('allies')}
              onPlayerDrop={handlePlayerJoinTeam('allies')}
            />
          </div>
        </div>
      </main>

      {/* Start Button - Host only */}
      {isHost && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
          <motion.button
            onClick={handleStartGame}
            whileHover={{ scale: 1.05, rotate: -1 }}
            whileTap={{ scale: 0.95 }}
            className="
              bg-military-green text-paper-light
              font-stencil font-bold text-xl tracking-widest uppercase
              px-10 py-4
              border-4 border-paper-light
              shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]
              flex items-center gap-3
              hover:bg-military-olive transition-colors
            "
          >
            <MapIcon size={24} />
            Deploy Troops
          </motion.button>
        </div>
      )}
    </div>
  );
}
