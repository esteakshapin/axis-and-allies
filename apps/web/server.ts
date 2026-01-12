import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import crypto from 'crypto';
import { WebSocketServer, WebSocket, RawData } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from public directory
app.use('/map', express.static(path.join(__dirname, 'public', 'map')));

// Serve built assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));

  // Serve index.html for all routes (SPA fallback)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// --- Types ---

interface CountryAssignment {
  id: string;
  name: string;
  flagImage: string;
  status: 'available' | 'assigned';
  assignedToPlayer?: string; // Player name
}

interface PlayerProfile {
  name: string;
  color: string;
  team: 'axis' | 'allies' | null;
  assignedCountries: string[];
  isHost: boolean;
  connected: boolean;
  socket: WebSocket | null;
}

interface GameRoom {
  gameId: string;
  players: Map<string, PlayerProfile>; // name -> profile
  axisCountries: CountryAssignment[];
  alliedCountries: CountryAssignment[];
  started: boolean;
  createdAt: number;
}

interface GameState {
  gameId: string;
  players: Array<{
    name: string;
    color: string;
    team: 'axis' | 'allies' | null;
    assignedCountries: string[];
    isHost: boolean;
    connected: boolean;
  }>;
  axisCountries: CountryAssignment[];
  alliedCountries: CountryAssignment[];
  started: boolean;
}

// Initial country data
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

// --- Game Storage ---

const games = new Map<string, GameRoom>();
const socketToPlayer = new WeakMap<WebSocket, { gameId: string; playerName: string }>();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- Helpers ---

const send = (ws: WebSocket | null, data: unknown) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

const randomGameId = () => crypto.randomBytes(3).toString('hex').toUpperCase();

const getGameState = (room: GameRoom): GameState => {
  const players = Array.from(room.players.values()).map(p => ({
    name: p.name,
    color: p.color,
    team: p.team,
    assignedCountries: p.assignedCountries,
    isHost: p.isHost,
    connected: p.connected,
  }));

  return {
    gameId: room.gameId,
    players,
    axisCountries: room.axisCountries,
    alliedCountries: room.alliedCountries,
    started: room.started,
  };
};

const broadcastState = (room: GameRoom) => {
  const state = getGameState(room);
  for (const player of room.players.values()) {
    if (player.connected && player.socket) {
      send(player.socket, { type: 'state_update', state });
    }
  }
};

const broadcastToOthers = (room: GameRoom, excludeName: string, message: unknown) => {
  for (const player of room.players.values()) {
    if (player.name !== excludeName && player.connected && player.socket) {
      send(player.socket, message);
    }
  }
};

// --- Connection Handler ---

wss.on('connection', (ws: WebSocket) => {
  console.log('New connection');

  ws.on('message', (raw: RawData) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: 'error', reason: 'invalid_json' });
      return;
    }

    console.log('Received:', msg.type, msg);

    switch (msg.type) {
      case 'create_game': {
        const { playerName, playerColor, gameId: requestedGameId } = msg;

        if (!playerName || typeof playerName !== 'string') {
          send(ws, { type: 'error', reason: 'player_name_required' });
          return;
        }

        const gameId = requestedGameId || randomGameId();

        if (games.has(gameId)) {
          send(ws, { type: 'error', reason: 'game_exists' });
          return;
        }

        // Create new game room
        const room: GameRoom = {
          gameId,
          players: new Map(),
          axisCountries: AXIS_COUNTRIES.map(c => ({ ...c })),
          alliedCountries: ALLIED_COUNTRIES.map(c => ({ ...c })),
          started: false,
          createdAt: Date.now(),
        };

        // Add host player
        room.players.set(playerName, {
          name: playerName,
          color: playerColor || '#b91c1c',
          team: null,
          assignedCountries: [],
          isHost: true,
          connected: true,
          socket: ws,
        });

        games.set(gameId, room);
        socketToPlayer.set(ws, { gameId, playerName });

        console.log(`Game ${gameId} created by ${playerName}`);

        send(ws, {
          type: 'game_created',
          gameId,
          playerName,
          state: getGameState(room),
        });
        break;
      }

      case 'join_game': {
        const { playerName, playerColor, gameId } = msg;

        if (!playerName || typeof playerName !== 'string') {
          send(ws, { type: 'error', reason: 'player_name_required' });
          return;
        }

        if (!gameId || !games.has(gameId.toUpperCase())) {
          send(ws, { type: 'error', reason: 'unknown_game' });
          return;
        }

        const room = games.get(gameId.toUpperCase())!;
        const existingPlayer = room.players.get(playerName);

        if (existingPlayer) {
          // Player exists - check if reconnecting
          if (existingPlayer.connected) {
            send(ws, { type: 'error', reason: 'name_taken' });
            return;
          }

          // Reconnection - restore player
          existingPlayer.connected = true;
          existingPlayer.socket = ws;
          socketToPlayer.set(ws, { gameId: room.gameId, playerName });

          console.log(`${playerName} reconnected to game ${room.gameId}`);

          // Send rejoined message with full state
          send(ws, {
            type: 'rejoined_game',
            gameId: room.gameId,
            playerName,
            state: getGameState(room),
          });

          // Notify others
          broadcastToOthers(room, playerName, {
            type: 'player_reconnected',
            playerName,
          });

          // Broadcast updated state to all
          broadcastState(room);
        } else {
          // New player joining
          room.players.set(playerName, {
            name: playerName,
            color: playerColor || '#1d4ed8',
            team: null,
            assignedCountries: [],
            isHost: false,
            connected: true,
            socket: ws,
          });

          socketToPlayer.set(ws, { gameId: room.gameId, playerName });

          console.log(`${playerName} joined game ${room.gameId}`);

          // Send joined message with full state
          send(ws, {
            type: 'joined_game',
            gameId: room.gameId,
            playerName,
            state: getGameState(room),
          });

          // Notify others
          broadcastToOthers(room, playerName, {
            type: 'player_joined',
            playerName,
          });

          // Broadcast updated state to all
          broadcastState(room);
        }
        break;
      }

      case 'player_action': {
        const meta = socketToPlayer.get(ws);
        if (!meta) {
          send(ws, { type: 'error', reason: 'not_in_game' });
          return;
        }

        const room = games.get(meta.gameId);
        if (!room) {
          send(ws, { type: 'error', reason: 'game_not_found' });
          return;
        }

        const player = room.players.get(meta.playerName);
        if (!player) {
          send(ws, { type: 'error', reason: 'player_not_found' });
          return;
        }

        const { action } = msg;
        if (!action || !action.type) {
          send(ws, { type: 'error', reason: 'invalid_action' });
          return;
        }

        console.log(`Action from ${meta.playerName}:`, action);

        switch (action.type) {
          case 'join_team': {
            const { team } = action;
            if (team !== 'axis' && team !== 'allies' && team !== null) {
              send(ws, { type: 'error', reason: 'invalid_team' });
              return;
            }

            // If leaving a team, unassign all countries
            if (player.team && player.team !== team) {
              const countries = player.team === 'axis' ? room.axisCountries : room.alliedCountries;
              for (const countryId of player.assignedCountries) {
                const country = countries.find(c => c.id === countryId);
                if (country) {
                  country.status = 'available';
                  country.assignedToPlayer = undefined;
                }
              }
              player.assignedCountries = [];
            }

            player.team = team;
            broadcastState(room);
            break;
          }

          case 'assign_country': {
            const { countryId } = action;

            // Find the country
            let country = room.axisCountries.find(c => c.id === countryId);
            let isAxis = true;
            if (!country) {
              country = room.alliedCountries.find(c => c.id === countryId);
              isAxis = false;
            }

            if (!country) {
              send(ws, { type: 'error', reason: 'country_not_found' });
              return;
            }

            // Validate player is on correct team
            if ((isAxis && player.team !== 'axis') || (!isAxis && player.team !== 'allies')) {
              send(ws, { type: 'error', reason: 'wrong_team' });
              return;
            }

            // If country is assigned to another player, unassign first
            if (country.assignedToPlayer && country.assignedToPlayer !== meta.playerName) {
              const prevPlayer = room.players.get(country.assignedToPlayer);
              if (prevPlayer) {
                prevPlayer.assignedCountries = prevPlayer.assignedCountries.filter(id => id !== countryId);
              }
            }

            // Assign country
            country.status = 'assigned';
            country.assignedToPlayer = meta.playerName;
            if (!player.assignedCountries.includes(countryId)) {
              player.assignedCountries.push(countryId);
            }

            broadcastState(room);
            break;
          }

          case 'unassign_country': {
            const { countryId } = action;

            // Find the country
            let country = room.axisCountries.find(c => c.id === countryId);
            if (!country) {
              country = room.alliedCountries.find(c => c.id === countryId);
            }

            if (!country) {
              send(ws, { type: 'error', reason: 'country_not_found' });
              return;
            }

            // Validate player owns this country
            if (country.assignedToPlayer !== meta.playerName) {
              send(ws, { type: 'error', reason: 'not_your_country' });
              return;
            }

            // Unassign
            country.status = 'available';
            country.assignedToPlayer = undefined;
            player.assignedCountries = player.assignedCountries.filter(id => id !== countryId);

            broadcastState(room);
            break;
          }

          case 'start_game': {
            // Only host can start
            if (!player.isHost) {
              send(ws, { type: 'error', reason: 'not_host' });
              return;
            }

            room.started = true;

            // Notify all players
            for (const p of room.players.values()) {
              if (p.connected && p.socket) {
                send(p.socket, { type: 'game_started', state: getGameState(room) });
              }
            }
            break;
          }

          default:
            send(ws, { type: 'error', reason: 'unknown_action' });
        }
        break;
      }

      default:
        send(ws, { type: 'error', reason: 'unknown_message_type' });
    }
  });

  ws.on('close', () => {
    const meta = socketToPlayer.get(ws);
    if (!meta) return;

    const room = games.get(meta.gameId);
    if (!room) return;

    const player = room.players.get(meta.playerName);
    if (!player) return;

    console.log(`${meta.playerName} disconnected from game ${meta.gameId}`);

    // Mark player as disconnected (don't remove)
    player.connected = false;
    player.socket = null;

    // Notify other players
    broadcastToOthers(room, meta.playerName, {
      type: 'player_disconnected',
      playerName: meta.playerName,
    });

    // Broadcast updated state
    broadcastState(room);

    // Note: We do NOT delete the game even if host disconnects
    // Games persist until manually cleaned up or server restarts
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// --- Cleanup old games periodically (optional) ---
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [gameId, room] of games) {
    // Only clean up games where ALL players are disconnected and game is old
    const allDisconnected = Array.from(room.players.values()).every(p => !p.connected);
    const isOld = now - room.createdAt > maxAge;

    if (allDisconnected && isOld) {
      console.log(`Cleaning up abandoned game ${gameId}`);
      games.delete(gameId);
    }
  }
}, 60 * 60 * 1000); // Check every hour

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Note: In development, run 'npm run dev' to start Vite dev server`);
  }
});
