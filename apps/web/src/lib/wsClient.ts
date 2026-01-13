// Player info in game state
export type PlayerInfo = {
  name: string;
  color: string;
  team: 'axis' | 'allies' | null;
  assignedCountries: string[];
  isHost: boolean;
  connected: boolean;
};

// Country/Territory assignment
export type CountryAssignment = {
  id: string;
  name: string;
  flagImage: string;
  status: 'available' | 'assigned';
  assignedToPlayer?: string; // Player name
};

// Full game state from server
export type GameState = {
  gameId: string;
  players: PlayerInfo[];
  axisCountries: CountryAssignment[];
  alliedCountries: CountryAssignment[];
  started: boolean;
};

// Player actions sent to server
export type PlayerAction =
  | { type: 'join_team'; team: 'axis' | 'allies' | null }
  | { type: 'assign_country'; countryId: string }
  | { type: 'unassign_country'; countryId: string }
  | { type: 'start_game' };

// Messages client sends to server
type ClientMessage =
  | { type: 'create_game'; playerName: string; playerColor?: string; gameId?: string }
  | { type: 'join_game'; playerName: string; playerColor?: string; gameId: string }
  | { type: 'player_action'; action: PlayerAction };

// Messages server sends to client
type ServerMessage =
  | { type: 'game_created'; gameId: string; playerName: string; state: GameState }
  | { type: 'joined_game'; gameId: string; playerName: string; state: GameState }
  | { type: 'rejoined_game'; gameId: string; playerName: string; state: GameState }
  | { type: 'state_update'; state: GameState }
  | { type: 'player_joined'; playerName: string }
  | { type: 'player_disconnected'; playerName: string }
  | { type: 'player_reconnected'; playerName: string }
  | { type: 'game_started'; state: GameState }
  | { type: 'error'; reason: string };

type HandlerBucket<K extends ServerMessage['type']> = Set<
  (payload: Extract<ServerMessage, { type: K }>) => void
>;

type HandlerMap = {
  game_created: HandlerBucket<'game_created'>;
  joined_game: HandlerBucket<'joined_game'>;
  rejoined_game: HandlerBucket<'rejoined_game'>;
  state_update: HandlerBucket<'state_update'>;
  player_joined: HandlerBucket<'player_joined'>;
  player_disconnected: HandlerBucket<'player_disconnected'>;
  player_reconnected: HandlerBucket<'player_reconnected'>;
  game_started: HandlerBucket<'game_started'>;
  error: HandlerBucket<'error'>;
};

const createHandlerMap = (): HandlerMap => ({
  game_created: new Set(),
  joined_game: new Set(),
  rejoined_game: new Set(),
  state_update: new Set(),
  player_joined: new Set(),
  player_disconnected: new Set(),
  player_reconnected: new Set(),
  game_started: new Set(),
  error: new Set(),
});

export class WsClient {
  private socket: WebSocket | null = null;
  private handlers: HandlerMap = createHandlerMap();
  private closeHandlers = new Set<() => void>();

  async connect(url: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        this.socket = ws;
        resolve();
      };

      ws.onerror = () => {
        reject(new Error('Failed to connect to WebSocket server'));
      };

      ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      ws.onclose = () => {
        this.closeHandlers.forEach((handler) => handler());
        this.socket = null;
      };
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: ClientMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.socket.send(JSON.stringify(message));
  }

  sendAction(action: PlayerAction) {
    this.send({ type: 'player_action', action });
  }

  onClose(handler: () => void): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  on<K extends ServerMessage['type']>(
    type: K,
    handler: (payload: Extract<ServerMessage, { type: K }>) => void
  ): () => void {
    const bucket = this.handlers[type] as HandlerBucket<K>;
    bucket.add(handler);
    return () => bucket.delete(handler);
  }

  private handleMessage(raw: string) {
    try {
      const parsed: ServerMessage = JSON.parse(raw);
      const bucket = this.handlers[parsed.type] as HandlerBucket<typeof parsed.type>;
      if (!bucket) {
        return;
      }
      bucket.forEach((handler) => handler(parsed as Extract<ServerMessage, { type: typeof parsed.type }>));
    } catch (error) {
      console.warn('Failed to parse server message', error);
    }
  }
}
