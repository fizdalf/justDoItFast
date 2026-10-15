import type {CommonMessages} from '../es/common.js';

export const common: CommonMessages = {
  // TODO: provisional English name — pending decision (avoid anything close to Nike's "Just Do It").
  gameName: 'Defuse It Fast!',
  tagline: 'Get them to guess the wire before the bomb blows up in your hands',

  roles: {
    holder: { singular: 'Defuser', plural: 'Defusers' },
    helpers: { singular: 'Backup', plural: 'Backup' },
    saboteurs: { singular: 'Saboteur', plural: 'Saboteurs' },
    host: { singular: 'Host', plural: 'Hosts' },
  },

  teams: {
    A: 'Red Team',
    B: 'Blue Team',
  },

  tools: 'Tools',
  yourTeamTools: "🧰 Your team's tools",

  powerUps: {
    REVERSE: {
      name: 'Return to Sender',
      description: 'Sends the bomb back to whoever just passed it to you and reverses the passing order.',
    },
    SKIP: {
      name: 'Other Wire',
      description: "Discard the current wire and take another. This turn can't earn tools anymore.",
    },
    DOUBLE_BURDEN: {
      name: 'Double Detonator',
      description: "The rival's bomb gets an extra wire. They won't know until they cut the first one.",
    },
    FREEZE: {
      name: 'Jammer',
      description: "Blocks the rival defuser's button for a few seconds.",
    },
    SHIELD: {
      name: 'Bomb Suit',
      description: 'Kicks in by itself if the bomb blows up on your team: it re-arms with a short fuse and goes to the rival.',
    },
    XRAY: {
      name: 'X-Ray',
      description: 'Your team sees roughly how much time the bomb has left.',
    },
    REWIRE: {
      name: 'Rewire Timer',
      description: "The bomb's remaining time is secretly redrawn.",
    },
  },

  connection: {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
  },

  header: {
    bombAlt: 'bomb',
    copyRoomCode: 'Copy room code',
    mute: 'Mute sound',
    unmute: 'Unmute sound',
    admin: '⚙️ Admin',
    adminTitle: 'Deck administration panel',
    leave: 'Leave',
    leaveTitle: 'Leave the room',
    language: 'Language',
    menu: 'Menu',
    roomCode: 'Room code',
  },

  you: '(You)',
  hostBadge: 'Host',
  back: 'Back',
  cancel: 'Cancel',
  close: 'Close',
  dismiss: 'Dismiss',
  aPlayer: 'a player',
  disconnected: 'disconnected',
  returningToRoom: (roomCode: string) => `Returning to room ${roomCode}...`,
  waitingForHost: (hostName: string) => `Waiting for the host (${hostName}) to continue...`,
};
