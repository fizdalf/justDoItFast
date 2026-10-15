import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ClientError, JoinedRoom, socketService, SocketStatus} from '../services/socketService.js';
import {clearSession, saveSession, sessionForCurrentUrl, setRoomUrl} from '../services/roomSession.js';
import {audioService} from '../services/audioService.js';
import {hapticService} from '../services/hapticService.js';
import {
  ApiResponse,
  RoomSnapshot,
  TimerExplodedPayload,
  TimerTickPayload,
  UpdateSetupPayload
} from '../../server/protocol.js';
import {
  DisputeResolution,
  DisputeState,
  GameState,
  Player,
  PowerUp,
  PowerUpType,
  RoomState,
  TeamId,
  TurnState,
  XrayReading,
} from '../../core/types.js';

export interface GameOverInfo {
  winner: TeamId;
  finalScores: Record<TeamId, number>;
}

/** Aviso de partida: guarda los datos del evento y se traduce al pintarlo. */
export type NoticeEvent =
  | { kind: 'AWARDED'; powerUp: PowerUp; source: 'FAST_GUESS' | 'TILE' }
  | { kind: 'ACTIVATED'; type: PowerUpType; team: TeamId; byPlayerId: string }
  | { kind: 'DOUBLE_REVEALED'; requiredGuesses: number; bounced: boolean; holderTeam: TeamId }
  | { kind: 'XRAY'; reading: XrayReading }
  | { kind: 'SHIELDED'; playerId: string; team: TeamId };

export type Notice = NoticeEvent & { id: number };

/** Cuánto se ve cada aviso (Rayos X se queda más para que el equipo lo lea). */
export const NOTICE_DURATION_MS = { default: 4000, XRAY: 6000 } as const;
const MAX_NOTICES = 3;

export interface GameContextValue {
  socketStatus: SocketStatus;
  playerId: string | null;
  /** La sala en la que estás (null en el inicio). */
  room: RoomState | null;
  /** La partida en curso de la sala (null mientras la sala está reunida sin jugar). */
  game: GameState | null;
  players: Player[];
  currentTurn: TurnState | null;
  currentDispute: DisputeState | null;
  lastTick: TimerTickPayload | null;
  explosion: TimerExplodedPayload | null;
  gameOver: GameOverInfo | null;
  inventory: Record<TeamId, PowerUp[]>;
  error: ClientError | null;
  /** Avisos de herramientas en pantalla (se descartan solos). */
  notices: Notice[];
  /** Código de la sala a la que se está volviendo tras recargar (null si no). */
  restoringRoom: string | null;

  // Ayudas calculadas
  myPlayer: Player | undefined;
  hostPlayer: Player | undefined;
  isHost: boolean;
  /** Hay partida y no participas en ella: juegas en la siguiente. */
  isSpectator: boolean;
  isActivePlayer: boolean;
  isOpponentReferee: boolean;
  isTeammate: boolean;

  // Acciones
  createRoom: (playerName: string) => Promise<ApiResponse<JoinedRoom & { sessionToken: string }>>;
  joinRoom: (roomCode: string, playerName: string) => Promise<ApiResponse<JoinedRoom & { sessionToken: string }>>;
  leaveRoom: () => Promise<ApiResponse<{}>>;
  switchTeam: (team: TeamId) => Promise<ApiResponse<RoomSnapshot>>;
  updateSetup: (changes: UpdateSetupPayload) => Promise<ApiResponse<RoomSnapshot>>;
  startGame: () => Promise<ApiResponse<RoomSnapshot>>;
  startRound: () => Promise<ApiResponse<RoomSnapshot>>;
  endGame: () => Promise<ApiResponse<RoomSnapshot>>;
  guessSuccess: () => Promise<ApiResponse<{ passed: boolean }>>;
  triggerFoul: () => Promise<ApiResponse<{ dispute: DisputeState }>>;
  resolveDispute: (resolution: DisputeResolution) => Promise<ApiResponse<RoomSnapshot>>;
  usePowerUp: (powerUpId: string) => Promise<ApiResponse<{ powerUpType: PowerUpType }>>;
  clearError: () => void;
  dismissNotice: (id: number) => void;
  resetLocalState: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(socketService.getStatus());
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [lastTick, setLastTick] = useState<TimerTickPayload | null>(null);
  const [explosion, setExplosion] = useState<TimerExplodedPayload | null>(null);
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);
  const [error, setError] = useState<ClientError | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const noticeTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextNoticeId = useRef(1);
  const [restoringRoom, setRestoringRoom] = useState<string | null>(
    () => sessionForCurrentUrl()?.roomCode ?? null
  );
  const rejoinedSocketId = useRef<string | undefined>(undefined);

  const dismissNotice = useCallback((id: number) => {
    const timer = noticeTimers.current.get(id);
    if (timer) clearTimeout(timer);
    noticeTimers.current.delete(id);
    setNotices((list) => list.filter((n) => n.id !== id));
  }, []);

  const pushNotice = useCallback(
    (event: NoticeEvent) => {
      const id = nextNoticeId.current++;
      setNotices((list) => [...list, { ...event, id }].slice(-MAX_NOTICES));
      const duration = event.kind === 'XRAY' ? NOTICE_DURATION_MS.XRAY : NOTICE_DURATION_MS.default;
      noticeTimers.current.set(id, setTimeout(() => dismissNotice(id), duration));
    },
    [dismissNotice]
  );

  const clearNotices = useCallback(() => {
    noticeTimers.current.forEach((timer) => clearTimeout(timer));
    noticeTimers.current.clear();
    setNotices([]);
  }, []);

  useEffect(() => clearNotices, [clearNotices]);

  /** Aplica una foto completa de sala + partida (la fuente de verdad). */
  const applySnapshot = useCallback(
    (snapshot: RoomSnapshot) => {
      setRoom(snapshot.room);
      setGame(snapshot.game);
      if (!snapshot.game) {
        // De vuelta en la sala: se olvida todo lo de la partida anterior.
        setExplosion(null);
        setGameOver(null);
        setLastTick(null);
        clearNotices();
      }
    },
    [clearNotices]
  );

  const clearLocalState = useCallback(() => {
    setPlayerId(null);
    setRoom(null);
    setGame(null);
    setExplosion(null);
    setGameOver(null);
    setLastTick(null);
    clearNotices();
  }, [clearNotices]);

  // Volver a la sala de la URL con la sesión guardada: al cargar la página (F5)
  // y cada vez que el socket se reconecta tras perder la conexión.
  useEffect(() => {
    const tryRejoin = async () => {
      const socketId = socketService.getSocketId();
      if (!socketId || rejoinedSocketId.current === socketId) return;
      rejoinedSocketId.current = socketId;

      const session = sessionForCurrentUrl();
      if (!session) {
        setRestoringRoom(null);
        return;
      }

      const res = await socketService.rejoinRoom(session.roomCode, session.sessionToken);
      if (res.success) {
        setPlayerId(res.data.player.id);
        applySnapshot(res.data);
      } else if (res.code === 'ROOM_NOT_FOUND' || res.code === 'SESSION_EXPIRED') {
        // La URL se mantiene: el inicio mostrará el formulario de unirse con ese código.
        clearSession();
      }
      setRestoringRoom(null);
    };

    return socketService.onStatusChange((status) => {
      if (status === 'CONNECTED') void tryRejoin();
    });
  }, [applySnapshot]);

  // La URL siempre refleja la sala en la que estás (también si se pulsa "atrás").
  const roomCode = room?.roomCode;
  useEffect(() => {
    if (!roomCode) return;
    setRoomUrl(roomCode, 'replace');
    const keepRoomUrl = () => setRoomUrl(roomCode, 'push');
    window.addEventListener('popstate', keepRoomUrl);
    return () => window.removeEventListener('popstate', keepRoomUrl);
  }, [roomCode]);

  useEffect(() => {
    socketService.connect();

    // Los eventos solo avisan (sonido, vibración, avisos); el estado llega en room:state_updated.
    const unsubs = [
      socketService.onStatusChange((status) => setSocketStatus(status)),
      socketService.onError((err) => setError(err)),
      socketService.onRoomStateUpdated(applySnapshot),

      socketService.onRoundStarted(() => {
        setExplosion(null);
        audioService.playSuccess();
      }),

      socketService.onTurnChanged(() => {
        setExplosion(null);
        audioService.playSuccess();
      }),

      socketService.onDisputeStarted(() => {
        audioService.playFoulBuzzer();
        hapticService.vibrateFoul();
      }),

      socketService.onTimerTick((tick) => {
        setLastTick(tick);
        if (playerId && tick.activePlayerId === playerId) {
          audioService.playTick();
          hapticService.vibrateTick(45);
        }
      }),

      socketService.onTimerExploded((exploded) => {
        setExplosion(exploded);
        audioService.playExplosion();
        hapticService.vibrateExplosion();
      }),

      socketService.onGameOver(({ winner, finalScores }) => {
        setGameOver({ winner, finalScores });
        audioService.playExplosion();
      }),

      socketService.onPowerUpAwarded(({ powerUp, source }) => {
        pushNotice({ kind: 'AWARDED', powerUp, source });
        hapticService.vibrateTick(60);
      }),

      socketService.onPowerUpActivated(({ type, team, byPlayerId }) => {
        pushNotice({ kind: 'ACTIVATED', type, team, byPlayerId });
        hapticService.vibrateTick(60);
      }),

      socketService.onDoubleRevealed(({ requiredGuesses, bounced, holderTeam }) => {
        pushNotice({ kind: 'DOUBLE_REVEALED', requiredGuesses, bounced, holderTeam });
        hapticService.vibrateFoul();
      }),

      socketService.onXray(({ reading }) => {
        pushNotice({ kind: 'XRAY', reading });
        hapticService.vibrateTick(60);
      }),

      socketService.onBombShielded(({ playerId: savedPlayerId, team }) => {
        pushNotice({ kind: 'SHIELDED', playerId: savedPlayerId, team });
        audioService.playFoulBuzzer();
        hapticService.vibrateExplosion();
      }),

      socketService.onErrorMessage((err) => setError(err)),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [playerId, applySnapshot, pushNotice]);

  const players = useMemo(() => room?.players ?? [], [room]);

  const myPlayer = useMemo(() => {
    if (!playerId) return undefined;
    return players.find((p: Player) => p.id === playerId);
  }, [players, playerId]);

  const hostPlayer = useMemo(
    () => players.find((p: Player) => p.id === room?.hostPlayerId),
    [players, room?.hostPlayerId]
  );

  const isHost = !!playerId && room?.hostPlayerId === playerId;

  const isSpectator = !!game && !!playerId && !game.participantIds.includes(playerId);

  const currentTurn = game?.currentTurn ?? null;
  const currentDispute = game?.currentDispute ?? null;
  const activePlayerId = currentTurn?.activePlayerId ?? null;
  const activeTeam = currentTurn?.activeTeam ?? null;

  // Los roles solo tienen sentido para quien participa en la partida.
  const isActivePlayer = !isSpectator && !!playerId && !!activePlayerId && playerId === activePlayerId;
  const isOpponentReferee = !isSpectator && !!myPlayer && !!activeTeam && myPlayer.team !== activeTeam;
  const isTeammate =
    !isSpectator &&
    !!myPlayer &&
    !!activeTeam &&
    !!activePlayerId &&
    myPlayer.team === activeTeam &&
    myPlayer.id !== activePlayerId;

  const inventory = useMemo(() => game?.teamInventory || { A: [], B: [] }, [game]);

  /** Guarda la sesión de la pestaña y muestra la sala recién creada o a la que te unes. */
  const enterRoom = useCallback(
    (data: JoinedRoom & { sessionToken: string }) => {
      saveSession({ roomCode: data.room.roomCode, playerId: data.player.id, sessionToken: data.sessionToken });
      setRoomUrl(data.room.roomCode);
      setPlayerId(data.player.id);
      applySnapshot(data);
    },
    [applySnapshot]
  );

  const createRoom = useCallback(
    async (playerName: string) => {
      audioService.enableAudio();
      const res = await socketService.createRoom(playerName);
      if (res.success) enterRoom(res.data);
      return res;
    },
    [enterRoom]
  );

  const joinRoom = useCallback(
    async (code: string, playerName: string) => {
      audioService.enableAudio();
      const res = await socketService.joinRoom(code, playerName);
      if (res.success) enterRoom(res.data);
      return res;
    },
    [enterRoom]
  );

  const leaveRoom = useCallback(async () => {
    const res = await socketService.leaveRoom();
    clearSession();
    setRoomUrl(null);
    clearLocalState();
    return res;
  }, [clearLocalState]);

  /** Envuelve una acción que responde con la foto de la sala. */
  const withSnapshot = useCallback(
    async (request: Promise<ApiResponse<RoomSnapshot>>) => {
      const res = await request;
      if (res.success) applySnapshot(res.data);
      return res;
    },
    [applySnapshot]
  );

  const switchTeam = useCallback((team: TeamId) => withSnapshot(socketService.switchTeam(team)), [withSnapshot]);
  const updateSetup = useCallback(
    (changes: UpdateSetupPayload) => withSnapshot(socketService.updateSetup(changes)),
    [withSnapshot]
  );
  const startGame = useCallback(() => withSnapshot(socketService.startGame()), [withSnapshot]);
  const startRound = useCallback(() => withSnapshot(socketService.startRound()), [withSnapshot]);
  const endGame = useCallback(() => withSnapshot(socketService.endGame()), [withSnapshot]);
  const resolveDispute = useCallback(
    (resolution: DisputeResolution) => withSnapshot(socketService.resolveDispute(resolution)),
    [withSnapshot]
  );

  const guessSuccess = useCallback(() => socketService.guessSuccess(), []);
  const triggerFoul = useCallback(() => socketService.triggerFoul(), []);
  const usePowerUp = useCallback((powerUpId: string) => socketService.usePowerUp(powerUpId), []);

  const clearError = useCallback(() => setError(null), []);

  const resetLocalState = useCallback(() => {
    clearSession();
    setRoomUrl(null);
    clearLocalState();
  }, [clearLocalState]);

  const value: GameContextValue = {
    socketStatus,
    playerId,
    room,
    game,
    players,
    currentTurn,
    currentDispute,
    lastTick,
    explosion,
    gameOver,
    inventory,
    error,
    notices,
    restoringRoom,
    myPlayer,
    hostPlayer,
    isHost,
    isSpectator,
    isActivePlayer,
    isOpponentReferee,
    isTeammate,
    createRoom,
    joinRoom,
    leaveRoom,
    switchTeam,
    updateSetup,
    startGame,
    startRound,
    endGame,
    guessSuccess,
    triggerFoul,
    resolveDispute,
    usePowerUp,
    clearError,
    dismissNotice,
    resetLocalState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextValue => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
};
