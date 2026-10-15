import type {LobbyMessages} from '../es/lobby.js';

export const lobby: LobbyMessages = {
  roomCodeLabel: 'Room code',
  connectedPlayers: (n: number) => (n === 1 ? '1 player connected' : `${n} players connected`),
  linkCopied: '✓ Link copied',
  shareLink: '🔗 Share link',
  playerCount: (n: number) => (n === 1 ? '1 player' : `${n} players`),
  noPlayersYet: 'No players yet',
  youAreIn: (teamName: string) => `✓ You're on the ${teamName}`,
  switchTo: (teamName: string) => `Switch to the ${teamName}`,
  turnOrderTitle: '💣 Bomb passing order (alternating seats)',
  waitingForPlayers: 'Waiting for players to join...',
  quorumMissing: '⚠️ You need at least 2 players per team (4 in total) to start the game.',
  quorumReady: '✅ Teams ready!',
  starting: 'Arming the bomb...',
  startGame: '💣 Start game',
  waitingForHostToStart: (hostName: string) => `Waiting for the host (${hostName}) to start the game...`,
};
