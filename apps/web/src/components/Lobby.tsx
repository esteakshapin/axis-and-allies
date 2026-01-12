import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClientActionPayload,
  HostUpdatePayload,
  LobbyPlayer,
  WsClient,
} from '@/lib/wsClient';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type Role = LobbyPlayer['role'];

type Country =
  | 'Germany'
  | 'Italy'
  | 'Japan'
  | 'USA'
  | 'UK'
  | 'Russia'
  | 'ANZAC'
  | 'China'
  | 'France';

const COUNTRIES: Country[] = [
  'Germany',
  'Italy',
  'Japan',
  'USA',
  'UK',
  'Russia',
  'ANZAC',
  'China',
  'France',
];

export interface LobbyStartState {
  gameId: string;
  players: LobbyPlayer[];
}

interface LobbyProps {
  onStart: (state: LobbyStartState, socket: WsClient, self: LobbyPlayer) => void;
  wsUrl?: string;
  initialError?: string | null;
}

export function Lobby({ onStart, wsUrl = 'ws://localhost:3000', initialError }: LobbyProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [gameIdInput, setGameIdInput] = useState('');
  const [gameId, setGameId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | ''>('');
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ws = useMemo(() => new WsClient(), []);
  const handlerCleanups = useRef<Array<() => void>>([]);
  const roleRef = useRef<Role | null>(null);
  const startedRef = useRef(false);
  const gameIdRef = useRef<string | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const keepAliveRef = useRef(false);

  const selfPlayer = selfId ? players.find((p) => p.id === selfId) ?? null : null;

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  useEffect(() => {
    gameIdRef.current = gameId;
  }, [gameId]);

  useEffect(() => {
    selfIdRef.current = selfId;
  }, [selfId]);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const resetHandlers = () => {
    handlerCleanups.current.forEach((cleanup) => cleanup());
    handlerCleanups.current = [];
  };

  const resetState = () => {
    resetHandlers();
    ws.disconnect();
    setConnectionStatus('disconnected');
    setGameId(null);
    setRole(null);
    setSelfId(null);
    setPlayers([]);
    setSelectedCountry('');
    setReady(false);
    setStarted(false);
    setError(null);
  };

  const ensureConnected = async () => {
    if (connectionStatus === 'connected') return;
    setConnectionStatus('connecting');
    try {
      await ws.connect(wsUrl);
      setConnectionStatus('connected');
      registerHandlers();
    } catch (err) {
      setConnectionStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Failed to connect');
      throw err;
    }
  };

  const registerHandlers = () => {
    resetHandlers();
    handlerCleanups.current = [
      ws.on('game_created', (payload) => {
        setRole('host');
        setGameId(payload.gameId);
        setSelfId(payload.clientId);
        const self: LobbyPlayer = { id: payload.clientId, role: 'host', ready: false };
        setPlayers([self]);
        setError(null);
      }),
      ws.on('joined_game', (payload) => {
        setRole('client');
        setGameId(payload.gameId);
        setSelfId(payload.clientId);
        setError(null);
      }),
      ws.on('client_joined', (payload) => {
        if (roleRef.current !== 'host') return;
        setPlayers((prev) => {
          if (prev.some((p) => p.id === payload.clientId)) return prev;
          const next: LobbyPlayer[] = [
            ...prev,
            { id: payload.clientId, role: 'client', ready: false },
          ];
          broadcastLobby(next, startedRef.current);
          return next;
        });
      }),
      ws.on('client_left', (payload) => {
        if (roleRef.current !== 'host') return;
        setPlayers((prev) => {
          const next = prev.filter((p) => p.id !== payload.clientId);
          broadcastLobby(next, startedRef.current);
          return next;
        });
      }),
      ws.on('client_action', (payload) => {
        if (roleRef.current !== 'host') return;
        const action: ClientActionPayload = payload.payload;
        setPlayers((prev): LobbyPlayer[] => {
          const existing = prev.find((p) => p.id === action.clientId);
          const nextPlayers: LobbyPlayer[] = existing
            ? prev.map<LobbyPlayer>((p) =>
                p.id === action.clientId
                  ? { ...p, country: action.country, ready: !!action.ready }
                  : p
              )
            : [
                ...prev,
                {
                  id: action.clientId,
                  role: 'client',
                  country: action.country,
                  ready: !!action.ready,
                },
              ];
          broadcastLobby(nextPlayers, startedRef.current);
          return nextPlayers;
        });
      }),
      ws.on('host_update', (payload) => {
        applyHostUpdate(payload.payload);
      }),
      ws.on('game_closed', (payload) => {
        setError(payload.reason || 'Game closed');
        resetState();
      }),
      ws.on('error', (payload) => {
        setError(payload.reason || 'Unknown error');
      }),
      ws.onClose(() => {
        setConnectionStatus('disconnected');
        setError('Disconnected from server');
      }),
    ];
  };

  const broadcastLobby = (nextPlayers: LobbyPlayer[], startedFlag: boolean) => {
    if (roleRef.current !== 'host') return;
    const activeGameId = gameIdRef.current;
    if (!activeGameId) return;
    const payload: HostUpdatePayload = {
      gameId: activeGameId,
      players: nextPlayers,
      started: startedFlag,
    };
    ws.send({ type: 'host_update', payload });
  };

  const applyHostUpdate = (payload: HostUpdatePayload) => {
    setGameId(payload.gameId);
    setPlayers(payload.players);
    setStarted(payload.started);
    const currentSelfId = selfIdRef.current;
    if (payload.started && payload.gameId && currentSelfId) {
      const me = payload.players.find((p) => p.id === currentSelfId);
      if (me) {
        keepAliveRef.current = true;
        onStart({ gameId: payload.gameId, players: payload.players }, ws, me);
      }
    }
  };

  const handleCreate = async () => {
    try {
      await ensureConnected();
      ws.send({ type: 'create_game', clientId: crypto.randomUUID(), gameId: gameIdInput || undefined });
    } catch {
      /* error handled in ensureConnected */
    }
  };

  const handleJoin = async () => {
    if (!gameIdInput) {
      setError('Enter a game id to join');
      return;
    }
    try {
      await ensureConnected();
      ws.send({ type: 'join_game', clientId: crypto.randomUUID(), gameId: gameIdInput });
    } catch {
      /* error handled in ensureConnected */
    }
  };

  const handleStart = () => {
    if (role !== 'host' || !gameId) return;
    const allReady = players.length > 0 && players.every((p) => p.ready && p.country);
    if (!allReady) {
      setError('All players must select a country and be ready');
      return;
    }
    const startPayload: HostUpdatePayload = { gameId, players, started: true };
    setStarted(true);
    broadcastLobby(players, true);
    // Apply locally so host state mirrors clients immediately
    applyHostUpdate(startPayload);
  };

  // Reflect local user changes
  useEffect(() => {
    if (!selfId) return;
    if (role === 'client') {
      ws.send({
        type: 'client_action',
        payload: { clientId: selfId, country: selectedCountry || undefined, ready },
      });
    }
    if (role === 'host') {
      setPlayers((prev): LobbyPlayer[] => {
        const next: LobbyPlayer[] = prev.map((p) =>
          p.id === selfId ? { ...p, country: selectedCountry || undefined, ready } : p
        );
        broadcastLobby(next, startedRef.current);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, ready]);

  // Backup: if started becomes true but onStart wasn't called, trigger it
  useEffect(() => {
    if (started && gameId && selfIdRef.current && players.length > 0) {
      const me = players.find((p) => p.id === selfIdRef.current);
      if (me && !keepAliveRef.current) {
        keepAliveRef.current = true;
        onStart({ gameId, players }, ws, me);
      }
    }
  }, [started, gameId, players, ws, onStart]);

  useEffect(
    () => () => {
      if (keepAliveRef.current) {
        resetHandlers();
        return;
      }
      resetState();
    },
    []
  ); // cleanup on unmount

  const statusLine = [
    gameId ? `Game: ${gameId}` : 'Not connected',
    `Status: ${connectionStatus}`,
    role ? `Role: ${role}` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>Lobby</div>

        <div style={styles.row}>
          <input
            placeholder="Game ID"
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleCreate} style={styles.button}>Create</button>
          <button onClick={handleJoin} style={styles.button}>Join</button>
        </div>

        <div style={styles.infoLine}>{statusLine}</div>

        <div style={styles.subheader}>You</div>
        <div style={styles.row}>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value as Country | '')}
            style={styles.select}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={ready}
              onChange={(e) => setReady(e.target.checked)}
            />
            Ready
          </label>
        </div>

        <div style={styles.subheader}>Players</div>
        <div style={styles.playerList}>
          {players.length === 0 && <div style={styles.muted}>No players yet</div>}
          {players.map((p) => (
            <div key={p.id} style={styles.playerRow}>
              <div>{p.role === 'host' ? 'Host' : 'Client'} • {p.id === selfId ? 'You' : p.id.slice(0, 6)}</div>
              <div>{p.country ?? 'No country'}</div>
              <div>{p.ready ? 'Ready' : 'Not ready'}</div>
            </div>
          ))}
        </div>

        {role === 'host' && (
          <button onClick={handleStart} style={styles.primaryButton} disabled={started}>
            Start Game
          </button>
        )}

        {error && <div style={styles.error}>{error}</div>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0f1028',
    color: '#eee',
  },
  card: {
    width: 520,
    background: '#1b1d36',
    border: '1px solid #2d3050',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  subheader: {
    fontWeight: 600,
    color: '#aab',
  },
  row: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '8px 10px',
    background: '#12132a',
    border: '1px solid #30345a',
    color: '#eee',
    borderRadius: 4,
  },
  select: {
    flex: 1,
    padding: '8px 10px',
    background: '#12132a',
    border: '1px solid #30345a',
    color: '#eee',
    borderRadius: 4,
  },
  button: {
    background: '#252a4d',
    color: '#fff',
    border: '1px solid #30345a',
    padding: '8px 12px',
    borderRadius: 4,
    cursor: 'pointer',
  },
  primaryButton: {
    background: '#3b4b9c',
    color: '#fff',
    border: '1px solid #5061c5',
    padding: '10px 12px',
    borderRadius: 4,
    cursor: 'pointer',
  },
  infoLine: {
    fontSize: 13,
    color: '#bbb',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: '#13142c',
    padding: 8,
    borderRadius: 4,
    border: '1px solid #2d3050',
  },
  playerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
  },
  muted: {
    color: '#777',
    fontSize: 13,
  },
  error: {
    color: '#ff6666',
    fontSize: 13,
  },
};
