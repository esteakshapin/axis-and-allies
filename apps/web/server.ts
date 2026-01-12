import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import crypto from 'crypto';
import { WebSocketServer, WebSocket, RawData } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// --- WebSocket game session management ---
type ClientRole = 'host' | 'client';

interface SocketMeta {
  role: ClientRole;
  gameId: string;
  clientId: string;
}

interface GameRoom {
  host: WebSocket;
  clients: Set<WebSocket>;
}

const games = new Map<string, GameRoom>();
const socketMeta = new WeakMap<WebSocket, SocketMeta>();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const send = (ws: WebSocket, data: unknown) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

const randomGameId = () => crypto.randomBytes(3).toString('hex');
const randomClientId = () => crypto.randomUUID();

const cleanupSocket = (ws: WebSocket) => {
  const meta = socketMeta.get(ws);
  if (!meta) return;
  const room = games.get(meta.gameId);
  if (!room) return;

  if (meta.role === 'host') {
    // Remove entire room and notify clients
    games.delete(meta.gameId);
    for (const client of room.clients) {
      send(client, { type: 'game_closed', reason: 'host_disconnected' });
      client.close();
    }
  } else {
    room.clients.delete(ws);
    const host = room.host;
    send(host, { type: 'client_left', gameId: meta.gameId, clientId: meta.clientId });
  }
};

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (raw: RawData) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: 'error', reason: 'invalid_json' });
      return;
    }

    switch (msg.type) {
      case 'create_game': {
        const gameId = msg.gameId || randomGameId();
        const clientId = msg.clientId || randomClientId();
        if (games.has(gameId)) {
          send(ws, { type: 'error', reason: 'game_exists' });
          return;
        }
        games.set(gameId, { host: ws, clients: new Set() });
        socketMeta.set(ws, { role: 'host', gameId, clientId });
        send(ws, { type: 'game_created', gameId, clientId });
        break;
      }

      case 'join_game': {
        const gameId = msg.gameId;
        const clientId = msg.clientId || randomClientId();
        if (!gameId || !games.has(gameId)) {
          send(ws, { type: 'error', reason: 'unknown_game' });
          return;
        }
        const room = games.get(gameId)!;
        room.clients.add(ws);
        socketMeta.set(ws, { role: 'client', gameId, clientId });
        send(ws, { type: 'joined_game', gameId, clientId });
        send(room.host, { type: 'client_joined', gameId, clientId });
        break;
      }

      case 'host_update': {
        const meta = socketMeta.get(ws);
        if (!meta || meta.role !== 'host') {
          send(ws, { type: 'error', reason: 'not_host' });
          return;
        }
        const room = games.get(meta.gameId);
        if (!room) return;
        for (const client of room.clients) {
          send(client, { type: 'host_update', gameId: meta.gameId, payload: msg.payload });
        }
        break;
      }

      case 'client_action': {
        const meta = socketMeta.get(ws);
        if (!meta || meta.role !== 'client') {
          send(ws, { type: 'error', reason: 'not_client' });
          return;
        }
        const room = games.get(meta.gameId);
        if (!room) {
          send(ws, { type: 'error', reason: 'unknown_game' });
          return;
        }
        send(room.host, { type: 'client_action', gameId: meta.gameId, payload: msg.payload });
        break;
      }

      default:
        send(ws, { type: 'error', reason: 'unknown_message_type' });
    }
  });

  ws.on('close', () => cleanupSocket(ws));
  ws.on('error', () => cleanupSocket(ws));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Note: In development, run 'npm run dev' to start Vite dev server`);
  }
});
