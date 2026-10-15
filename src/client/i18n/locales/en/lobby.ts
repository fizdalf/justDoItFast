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
  quorumMissing: '⚠️ You need at least 2 connected players per team (4 in total) to start the game.',
  quorumReady: '✅ Teams ready!',
  starting: 'Arming the bomb...',
  startGame: '💣 Start game',
  nextGame: (gameNumber: number) => `Up next: game ${gameNumber}`,
  waitingForHostToStart: (hostName: string) => `Waiting for the host (${hostName}) to start the game...`,

  invite: {
    showQr: '📱 QR code',
    hideQr: 'Hide QR',
    linkShort: '🔗 Link',
    qrShort: '📱 QR',
    qrHint: "Scan it with your phone's camera to join",
    qrAlt: (roomCode: string) => `QR code to join room ${roomCode}`,
  },

  pack: {
    label: '📚 Word decks',
    hint: 'Pick one or more: their wires get shuffled together',
    words: (n: number) => (n === 1 ? '1 word' : `${n} words`),
    total: (n: number) => (n === 1 ? 'Total: 1 word' : `Total: ${n} words`),
    lastOne: 'At least one deck must stay selected',
  },

  history: {
    title: '📜 Games in this room',
    empty: 'No games played yet',
    gameLabel: (gameNumber: number) => `Game ${gameNumber}`,
    winner: (teamName: string) => `${teamName} won`,
    abandoned: 'Ended early',
    rounds: (n: number) => (n === 1 ? '1 round' : `${n} rounds`),
  },

  settings: {
    title: '⚙️ Next game settings',
    hostOnly: 'Only the host can change them',
    summary: (targetScore: number, minSec: number, maxSec: number, tools: boolean) =>
      `${targetScore} pts · bomb ${minSec}–${maxSec} s · tools ${tools ? 'on' : 'off'}`,
    targetScore: 'Points to win',
    minRoundDuration: 'Shortest bomb fuse',
    maxRoundDuration: 'Longest bomb fuse',
    fastGuess: 'Fast guess (earns a tool)',
    disconnectGrace: 'Wait if the defuser disconnects',
    toolsTitle: '🧰 Tools',
    toolsEnabled: 'Tools enabled',
    on: 'Yes',
    off: 'No',
    maxTools: 'Max tools per team',
    freezeDuration: (toolName: string) => `${toolName} duration`,
    availableTools: 'Tools that can be earned',
    seconds: (n: number) => `${n} s`,
    decrease: (label: string) => `Decrease: ${label}`,
    increase: (label: string) => `Increase: ${label}`,
  },
};
