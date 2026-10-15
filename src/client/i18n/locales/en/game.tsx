import React from 'react';
import type {GameMessages} from '../es/game.js';

export const game: GameMessages = {
  holder: {
    banner: "You're the defuser: you've got the bomb!",
    wireLabel: (category: string) => `🔌 Your wire · ${category}`,
    loadingWire: 'LOADING...',
    hint: "Anything goes: words, mime, sounds... But if you say the word or something too obvious (like «place full of dogs» for «doghouse»), they can call a foul. When your backup gets it, cut the wire!",
    cutWire: 'WIRE CUT!',
    frozen: (seconds?: number) => (seconds === undefined ? 'JAMMED!' : `JAMMED! ${seconds} s`),
  },

  turn: {
    wireCounter: (current: number, total: number) => `Wire ${current}/${total}`,
    frozenBadge: (seconds?: number) => (seconds === undefined ? '❄️ Jammed' : `❄️ Jammed · ${seconds} s`),
    reversed: 'Order reversed',
  },

  tools: {
    usageHints: {
      HOLDER: 'Defuser only',
      RIVALS: 'When the rival has the bomb',
      TEAM: 'During the round',
      PASSIVE: 'Kicks in if it blows up on you',
    },
    notPlaying: 'While the round is running',
    holdHint: 'Press and hold a tool to use it',
  },

  notices: {
    awarded: (toolName: string) => `🎁 New tool: ${toolName}`,
    awardedSource: {
      FAST_GUESS: 'For cutting the wire fast',
      TILE: 'From the mystery tile',
    },
    activated: (playerName: string, teamName: string, toolName: string) => `${playerName} (${teamName}) uses ${toolName}`,
    effects: {
      REVERSE: 'The bomb goes back to whoever passed it and the passing order flips',
      SKIP: "New wire, but this turn can't earn tools anymore",
      DOUBLE_BURDEN: "The rival defuser will have to cut one more wire (they don't know yet)",
      FREEZE: "The defuser's button is blocked for a few seconds",
      SHIELD: 'The bomb suit is ready',
      XRAY: 'They checked how much time the bomb has left',
      REWIRE: 'The timer has been rewired: nobody knows how much is left',
    },
    doubleRevealed: {
      ours: 'Double detonator! One more wire',
      theirs: (teamName: string) => `The ${teamName} found the double detonator`,
      bouncedToUs: 'The double detonator was sent back to you!',
      bounced: (teamName: string) => `The double detonator goes back to the ${teamName}!`,
      wires: (n: number) => `${n} wires to cut`,
    },
    xrayTitle: (toolName: string) => `🩻 ${toolName}`,
    xray: {
      LONG: 'Plenty of time left',
      MEDIUM: 'About halfway',
      SHORT: 'About to blow!',
    },
    xrayHint: 'Only your team sees this',
    shielded: (toolName: string, playerName: string) => `🦺 The ${toolName} saves ${playerName}!`,
    shieldedDetail: (teamName: string) => `The bomb re-arms with a short fuse and goes to the ${teamName}`,
  },

  helpers: {
    roleBadge: '🧰 Role: Backup',
    intro: (holderName: string) => `${holderName} is your defuser and has the bomb. Watch their clues and guess the wire!`,
    categoryLabel: (category: string) => `Category: ${category}`,
    guessAloud: 'GUESS OUT LOUD!',
    guessHint: 'Shout every word that comes to mind until you get it, before the bomb goes off',
    footer: (holderName: string) => `When you get it, ${holderName} will cut the wire and the bomb goes to the saboteurs`,
  },

  saboteurs: {
    roleBadge: '🕵️ Role: Saboteur',
    intro: (holderName: string) =>
      `${holderName} is the rival defuser. Make sure they don't say the word or cheat — you want it to blow up on them.`,
    wireLabel: (category: string) => `🔌 Rival's wire · ${category}`,
    warning: '⚠️ If a clue feels like cheating (saying the word, or something like «place full of dogs» for «doghouse»), call a foul and settle it together.',
    foul: 'FOUL!',
    holdHint: 'Press and hold to call a foul',
  },

  dispute: {
    title: 'FOUL CALLED!',
    subtitle: 'The round has been stopped for review',
    calledBy: 'Called by:',
    hostDecision: "👑 Host's decision",
    awardTo: (teamName: string) => `🏆 Point to the ${teamName}`,
    restart: '🔄 Restart round (no points)',
    restartHint: 'New bomb',
    waiting: (hostName: string) => `Waiting for the host's decision (${hostName})...`,
    waitingHint: 'The game will continue as soon as a decision is made',
  },

  roundOver: {
    titleExplosion: 'BOOM!',
    titleDispute: 'Foul resolved!',
    roundEnded: (round: number) => `End of round ${round}`,
    exploded: (playerName: React.ReactNode, wire?: React.ReactNode) => (
      <>
        The bomb went off in {playerName}'s hands
        {wire && <> on the wire {wire}</>}
      </>
    ),
    disputeResolved: 'The host resolved the dispute in favor of one team',
    pointFor: (teamName: string) => `+1 point for the ${teamName}`,
    myTeamScored: 'Your team moves forward on the board!',
    myTeamDidNotScore: "Your team doesn't score this time",
    starting: 'Starting...',
    nextRound: '💣 Next round',
    waitingNextRound: (hostName: string) => `Waiting for the host (${hostName}) to start the next round...`,
  },

  gameOver: {
    title: 'FINAL VICTORY!',
    winner: (teamName: string) => `Winner: ${teamName}`,
    finalScore: 'Final score',
    points: 'points',
    returning: 'Heading back...',
    backToRoom: '🏠 Back to the room',
    waitingBackToRoom: (hostName: string) => `Waiting for the host (${hostName}) to head back to the room...`,
    leaveRoom: 'Leave the room',
  },

  spectator: {
    badge: '👀 Spectator',
    title: 'Game in progress',
    body: "You arrived mid-game: you'll play in the next one.",
    hint: 'Meanwhile, follow the score from here.',
  },

  endGame: {
    button: '🛑 End game',
    confirmTitle: 'End the game?',
    confirmBody: 'Everyone goes back to the room and the game is recorded in the history as ended early.',
    confirm: 'Yes, end it',
    ending: 'Ending...',
  },

  board: {
    pointsShort: 'pts',
    goal: (target: number) => `Goal: ${target} pts`,
    tiles: {
      NORMAL: 'Normal',
      DOUBLE_TIME: '2x',
      MYSTERY_POWERUP: 'Tool',
      GOAL: 'Goal',
    },
  },
};
