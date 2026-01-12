import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Copy, ArrowLeft, Settings, Map as MapIcon, Users } from 'lucide-react';
import { Button } from './ui/Button';
import { TeamSection } from './TeamSection';
import { SpectatorSection } from './SpectatorSection';
import { CountryStatus } from './CountryAvatar';
import { WsClient, LobbyPlayer, CountryAssignment, HostUpdatePayload } from '@/lib/wsClient';

interface GameLobbyProps {
  gameCode: string;
  playerName: string;
  ws: WsClient | null;
  role: 'host' | 'client';
  clientId: string;
  onLeave: () => void;
  onStartGame: () => void;
}

// WW2 Countries with flag images from /map/flags/
const AXIS_COUNTRIES: CountryAssignment[] = [
  { id: 'germany', name: 'Germany', flagImage: '/map/flags/Germans.png', status: 'available' },
  { id: 'italy', name: 'Italy', flagImage: '/map/flags/Italians.png', status: 'available' },
  { id: 'japan', name: 'Japan', flagImage: '/map/flags/Japanese.png', status: 'available' },
];

const ALLIED_COUNTRIES: CountryAssignment[] = [
  { id: 'united_states', name: 'United States', flagImage: '/map/flags/Americans.png', status: 'available' },
  { id: 'soviet_union', name: 'Soviet Union', flagImage: '/map/flags/Russians.png', status: 'available' },
  { id: 'united_kingdom_europe', name: 'UK Europe', flagImage: '/map/flags/UK_Europe.png', status: 'available' },
  { id: 'united_kingdom_pacific', name: 'UK Pacific', flagImage: '/map/flags/UK_Pacific.png', status: 'available' },
  { id: 'france', name: 'France', flagImage: '/map/flags/French.png', status: 'available' },
  { id: 'china', name: 'China', flagImage: '/map/flags/Chinese.png', status: 'available' },
  { id: 'anzac', name: 'ANZAC', flagImage: '/map/flags/ANZAC.png', status: 'available' },
];

// Generate a random color for player
const PLAYER_COLORS = [
  'bg-red-700', 'bg-blue-700', 'bg-green-700', 'bg-yellow-600',
  'bg-purple-700', 'bg-pink-600', 'bg-orange-600', 'bg-cyan-700',
];

const getRandomColor = () => PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

export function GameLobby({
  gameCode,
  playerName,
  ws,
  role,
  clientId,
  onLeave,
  onStartGame
}: GameLobbyProps) {
  // Local player info
  const myColor = useRef(getRandomColor());

  // Game state
  const [players, setPlayers] = useState<LobbyPlayer[]>([
    {
      id: clientId,
      name: playerName,
      color: myColor.current,
      role: role,
      team: null,
      assignedCountries: [],
      ready: false,
    },
  ]);

  const [axisCountries, setAxisCountries] = useState<CountryAssignment[]>(
    AXIS_COUNTRIES.map(c => ({ ...c }))
  );

  const [alliedCountries, setAlliedCountries] = useState<CountryAssignment[]>(
    ALLIED_COUNTRIES.map(c => ({ ...c }))
  );

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>(
    ws ? 'connected' : 'disconnected'
  );

  // Broadcast state to all clients (host only)
  const broadcastState = useCallback(() => {
    if (role !== 'host' || !ws) return;

    const payload: HostUpdatePayload = {
      gameId: gameCode,
      players,
      axisCountries,
      alliedCountries,
      started: false,
    };

    ws.send({ type: 'host_update', payload });
  }, [ws, role, gameCode, players, axisCountries, alliedCountries]);

  // Broadcast whenever state changes (host only)
  useEffect(() => {
    if (role === 'host') {
      broadcastState();
    }
  }, [players, axisCountries, alliedCountries, role, broadcastState]);

  // Set up WebSocket handlers
  useEffect(() => {
    if (!ws) return;

    const cleanups: (() => void)[] = [];

    if (role === 'host') {
      // Host: listen for new clients joining
      cleanups.push(
        ws.on('client_joined', ({ clientId: newClientId }) => {
          console.log('Client joined:', newClientId);
          // Add new player (they will send their info shortly)
          setPlayers(prev => {
            if (prev.find(p => p.id === newClientId)) return prev;
            return [...prev, {
              id: newClientId,
              name: 'Connecting...',
              color: getRandomColor(),
              role: 'client',
              team: null,
              assignedCountries: [],
              ready: false,
            }];
          });
        })
      );

      cleanups.push(
        ws.on('client_left', ({ clientId: leftClientId }) => {
          console.log('Client left:', leftClientId);
          // Remove player and unassign their countries
          setPlayers(prev => {
            const leavingPlayer = prev.find(p => p.id === leftClientId);
            if (leavingPlayer) {
              // Unassign countries
              if (leavingPlayer.team === 'axis') {
                setAxisCountries(countries =>
                  countries.map(c =>
                    leavingPlayer.assignedCountries.includes(c.id)
                      ? { ...c, status: 'available', assignedToPlayerId: undefined }
                      : c
                  )
                );
              } else if (leavingPlayer.team === 'allies') {
                setAlliedCountries(countries =>
                  countries.map(c =>
                    leavingPlayer.assignedCountries.includes(c.id)
                      ? { ...c, status: 'available', assignedToPlayerId: undefined }
                      : c
                  )
                );
              }
            }
            return prev.filter(p => p.id !== leftClientId);
          });
        })
      );

      // Host: listen for client actions
      cleanups.push(
        ws.on('client_action', ({ payload }) => {
          const { clientId: actionClientId, action } = payload;

          switch (action.type) {
            case 'player_info':
              setPlayers(prev => prev.map(p =>
                p.id === actionClientId
                  ? { ...p, name: action.name, color: action.color }
                  : p
              ));
              break;

            case 'join_team':
              handlePlayerTeamChange(actionClientId, action.team);
              break;

            case 'assign_country':
              handleCountryAssignment(action.countryId, action.playerId);
              break;

            case 'unassign_country':
              handleCountryUnassignment(action.countryId);
              break;

            case 'set_ready':
              setPlayers(prev => prev.map(p =>
                p.id === actionClientId ? { ...p, ready: action.ready } : p
              ));
              break;
          }
        })
      );
    } else {
      // Client: listen for host updates
      cleanups.push(
        ws.on('host_update', ({ payload }) => {
          setPlayers(payload.players);
          setAxisCountries(payload.axisCountries);
          setAlliedCountries(payload.alliedCountries);

          if (payload.started) {
            onStartGame();
          }
        })
      );

      // Send our player info to host
      ws.send({
        type: 'client_action',
        payload: {
          clientId,
          action: { type: 'player_info', name: playerName, color: myColor.current },
        },
      });
    }

    cleanups.push(
      ws.on('game_closed', () => {
        setConnectionStatus('disconnected');
        onLeave();
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
  }, [ws, role, clientId, playerName, onLeave, onStartGame]);

  // Helper: Change player's team
  const handlePlayerTeamChange = (playerId: string, newTeam: 'axis' | 'allies' | null) => {
    setPlayers(prev => {
      const player = prev.find(p => p.id === playerId);
      if (!player) return prev;

      // Unassign countries from old team
      if (player.team === 'axis' && player.assignedCountries.length > 0) {
        setAxisCountries(countries =>
          countries.map(c =>
            player.assignedCountries.includes(c.id)
              ? { ...c, status: 'available', assignedToPlayerId: undefined }
              : c
          )
        );
      } else if (player.team === 'allies' && player.assignedCountries.length > 0) {
        setAlliedCountries(countries =>
          countries.map(c =>
            player.assignedCountries.includes(c.id)
              ? { ...c, status: 'available', assignedToPlayerId: undefined }
              : c
          )
        );
      }

      return prev.map(p =>
        p.id === playerId ? { ...p, team: newTeam, assignedCountries: [] } : p
      );
    });
  };

  // Helper: Assign country to player
  const handleCountryAssignment = (countryId: string, playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const isAxisCountry = axisCountries.some(c => c.id === countryId);

    if (isAxisCountry) {
      // Remove from previous owner
      const prevOwner = axisCountries.find(c => c.id === countryId)?.assignedToPlayerId;
      if (prevOwner) {
        setPlayers(prev => prev.map(p =>
          p.id === prevOwner
            ? { ...p, assignedCountries: p.assignedCountries.filter(id => id !== countryId) }
            : p
        ));
      }

      setAxisCountries(prev => prev.map(c =>
        c.id === countryId ? { ...c, status: 'assigned', assignedToPlayerId: playerId } : c
      ));
      setPlayers(prev => prev.map(p =>
        p.id === playerId
          ? { ...p, assignedCountries: [...p.assignedCountries.filter(id => id !== countryId), countryId] }
          : p
      ));
    } else {
      // Allied country
      const prevOwner = alliedCountries.find(c => c.id === countryId)?.assignedToPlayerId;
      if (prevOwner) {
        setPlayers(prev => prev.map(p =>
          p.id === prevOwner
            ? { ...p, assignedCountries: p.assignedCountries.filter(id => id !== countryId) }
            : p
        ));
      }

      setAlliedCountries(prev => prev.map(c =>
        c.id === countryId ? { ...c, status: 'assigned', assignedToPlayerId: playerId } : c
      ));
      setPlayers(prev => prev.map(p =>
        p.id === playerId
          ? { ...p, assignedCountries: [...p.assignedCountries.filter(id => id !== countryId), countryId] }
          : p
      ));
    }
  };

  // Helper: Unassign country
  const handleCountryUnassignment = (countryId: string) => {
    const axisCountry = axisCountries.find(c => c.id === countryId);
    const alliedCountry = alliedCountries.find(c => c.id === countryId);

    if (axisCountry?.assignedToPlayerId) {
      setPlayers(prev => prev.map(p =>
        p.id === axisCountry.assignedToPlayerId
          ? { ...p, assignedCountries: p.assignedCountries.filter(id => id !== countryId) }
          : p
      ));
      setAxisCountries(prev => prev.map(c =>
        c.id === countryId ? { ...c, status: 'available', assignedToPlayerId: undefined } : c
      ));
    } else if (alliedCountry?.assignedToPlayerId) {
      setPlayers(prev => prev.map(p =>
        p.id === alliedCountry.assignedToPlayerId
          ? { ...p, assignedCountries: p.assignedCountries.filter(id => id !== countryId) }
          : p
      ));
      setAlliedCountries(prev => prev.map(c =>
        c.id === countryId ? { ...c, status: 'available', assignedToPlayerId: undefined } : c
      ));
    }
  };

  // Send action to host (client) or apply directly (host)
  const sendAction = useCallback((action: any) => {
    if (role === 'host') {
      // Apply directly
      switch (action.type) {
        case 'join_team':
          handlePlayerTeamChange(clientId, action.team);
          break;
        case 'assign_country':
          handleCountryAssignment(action.countryId, action.playerId);
          break;
        case 'unassign_country':
          handleCountryUnassignment(action.countryId);
          break;
      }
    } else if (ws) {
      // Send to host
      ws.send({
        type: 'client_action',
        payload: { clientId, action },
      });
    }
  }, [role, ws, clientId]);

  // Get players by team
  const spectators = players.filter((p) => p.team === null);
  const axisPlayers = players.filter((p) => p.team === 'axis');
  const alliedPlayers = players.filter((p) => p.team === 'allies');
  const currentPlayer = players.find((p) => p.id === clientId);
  const currentPlayerTeam = currentPlayer?.team || null;

  // UI Handlers
  const handlePlayerLeaveTeam = (playerId: string) => {
    if (playerId !== clientId) return; // Can only move yourself
    sendAction({ type: 'join_team', team: null });
  };

  const handlePlayerJoinTeam = (team: 'axis' | 'allies') => (playerId: string) => {
    if (playerId !== clientId) return; // Can only move yourself
    sendAction({ type: 'join_team', team });
  };

  const handleCountryDragStart = (_team: 'axis' | 'allies') => (_countryId: string) => {
    // Visual feedback only
  };

  const handleCountryDrop = (_team: 'axis' | 'allies') => (countryId: string, playerId: string) => {
    if (playerId !== clientId) return; // Can only assign to yourself
    sendAction({ type: 'assign_country', countryId, playerId });
  };

  const handleCountryUnassign = (_team: 'axis' | 'allies') => (countryId: string) => {
    sendAction({ type: 'unassign_country', countryId });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode);
  };

  const handleStartGame = () => {
    if (role === 'host' && ws) {
      // Broadcast game start
      ws.send({
        type: 'host_update',
        payload: {
          gameId: gameCode,
          players,
          axisCountries,
          alliedCountries,
          started: true,
        },
      });
    }
    onStartGame();
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
              {players.length} Player{players.length !== 1 ? 's' : ''}
            </div>
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
            {role === 'host' && (
              <p className="font-typewriter text-military-green text-sm mt-1">
                You are the host. Share the code above with others to join.
              </p>
            )}
          </div>

          {/* Spectators Section - Always visible */}
          <SpectatorSection
            spectators={spectators}
            currentPlayerId={clientId}
            onPlayerDragStart={() => {}}
            onPlayerDrop={handlePlayerLeaveTeam}
          />

          {/* Teams Grid */}
          <div className="grid md:grid-cols-2 gap-8 min-h-[500px] items-start relative">
            <TeamSection
              team="axis"
              countries={axisCountries}
              players={axisPlayers}
              currentPlayerId={clientId}
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
              players={alliedPlayers}
              currentPlayerId={clientId}
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
      {role === 'host' && (
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
