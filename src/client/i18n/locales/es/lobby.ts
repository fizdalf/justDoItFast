export const lobby = {
  roomCodeLabel: 'Código de sala',
  connectedPlayers: (n: number) => (n === 1 ? '1 jugador conectado' : `${n} jugadores conectados`),
  linkCopied: '✓ Enlace copiado',
  shareLink: '🔗 Compartir enlace',
  playerCount: (n: number) => (n === 1 ? '1 jugador' : `${n} jugadores`),
  noPlayersYet: 'Sin jugadores todavía',
  youAreIn: (teamName: string) => `✓ Estás en el ${teamName}`,
  switchTo: (teamName: string) => `Cambiarte al ${teamName}`,
  turnOrderTitle: '💣 Orden de pases de la bomba (asientos alternos)',
  waitingForPlayers: 'Esperando a que se unan jugadores...',
  quorumMissing: '⚠️ Se necesitan al menos 2 jugadores por equipo (mínimo 4 en total) para iniciar la partida.',
  quorumReady: '✅ ¡Equipos listos!',
  starting: 'Armando la bomba...',
  startGame: '💣 Iniciar partida',
  waitingForHostToStart: (hostName: string) => `Esperando a que el anfitrión (${hostName}) inicie la partida...`,
};

export type LobbyMessages = typeof lobby;
