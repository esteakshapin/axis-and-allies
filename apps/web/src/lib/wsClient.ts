// Player in the game lobby
export type LobbyPlayer = {
  id: string;
  name: string;
  color: string;
  role: 'host' | 'client';
  team: 'axis' | 'allies' | null;
  assignedCountries: string[];
  ready: boolean;
};

// Country/Territory assignment
export type CountryAssignment = {
  id: string;
  name: string;
  flagImage: string;
  status: 'available' | 'assigned';
  assignedToPlayerId?: string;
};

// Client action payload - what clients send to host
export type ClientActionPayload = {
  clientId: string;
  action:
    | { type: 'join_team'; team: 'axis' | 'allies' | null }
    | { type: 'assign_country'; countryId: string; playerId: string }
    | { type: 'unassign_country'; countryId: string }
    | { type: 'set_ready'; ready: boolean }
    | { type: 'player_info'; name: string; color: string };
};

// Host update payload - what host broadcasts to all clients
export type HostUpdatePayload = {
  gameId: string;
  players: LobbyPlayer[];
  axisCountries: CountryAssignment[];
  alliedCountries: CountryAssignment[];
  started: boolean;
};

type ClientMessage =
  | { type: 'create_game'; clientId: string; gameId?: string }
  | { type: 'join_game'; clientId: string; gameId: string }
  | { type: 'host_update'; payload: HostUpdatePayload }
  | { type: 'client_action'; payload: ClientActionPayload };

type ServerMessage =
  | { type: 'game_created'; gameId: string; clientId: string }
  | { type: 'joined_game'; gameId: string; clientId: string }
  | { type: 'client_joined'; gameId: string; clientId: string }
  | { type: 'client_left'; gameId: string; clientId: string }
  | { type: 'host_update'; gameId: string; payload: HostUpdatePayload }
  | { type: 'client_action'; gameId: string; payload: ClientActionPayload }
  | { type: 'game_closed'; reason: string }
  | { type: 'error'; reason: string };

type HandlerBucket<K extends ServerMessage['type']> = Set<
  (payload: Extract<ServerMessage, { type: K }>) => void
>;

type HandlerMap = {
  game_created: HandlerBucket<'game_created'>;
  joined_game: HandlerBucket<'joined_game'>;
  client_joined: HandlerBucket<'client_joined'>;
  client_left: HandlerBucket<'client_left'>;
  host_update: HandlerBucket<'host_update'>;
  client_action: HandlerBucket<'client_action'>;
  game_closed: HandlerBucket<'game_closed'>;
  error: HandlerBucket<'error'>;
};

const createHandlerMap = (): HandlerMap => ({
  game_created: new Set(),
  joined_game: new Set(),
  client_joined: new Set(),
  client_left: new Set(),
  host_update: new Set(),
  client_action: new Set(),
  game_closed: new Set(),
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
