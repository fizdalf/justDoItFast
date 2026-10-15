import React from 'react';
import type {GameMessages} from '../es/game.js';

export const game: GameMessages = {
  holder: {
    banner: "💣 You've got the bomb!",
    loadingWire: 'LOADING...',
    cutWire: 'WIRE CUT!',
    frozen: (seconds?: number) => (seconds === undefined ? 'JAMMED!' : `JAMMED! ${seconds} s`),
  },

  turn: {
    wireCounter: (current: number, total: number) => `Wire ${current}/${total}`,
    frozenBadge: (seconds?: number) => (seconds === undefined ? '❄️ Jammed' : `❄️ Jammed · ${seconds} s`),
    reversed: 'Order reversed',
  },

  tools: {
    holdToUse: 'Press and hold',
  },

  notices: {
    awarded: (toolName: string) => `🎁 New tool: ${toolName}`,
    activated: (playerName: string, teamName: string, toolName: string) => `${playerName} (${teamName}) uses ${toolName}`,
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
    roleBadge: '🧰 Backup',
    clueGiver: (holderName: string) => `Clues from ${holderName}`,
    guessAloud: 'GUESS!',
  },

  saboteurs: {
    roleBadge: '🕵️ Saboteur',
    clueGiver: (holderName: string) => `${holderName} is giving clues`,
    foul: 'FOUL!',
    holdHint: 'press and hold',
  },

  dispute: {
    title: 'FOUL CALLED!',
    calledBy: 'Called by:',
    hostDecision: "👑 Host's decision",
    awardTo: (teamName: string) => `🏆 Point to the ${teamName}`,
    restart: '🔄 Restart round (no points)',
    restartHint: 'New bomb',
    waiting: (hostName: string) => `Waiting for the host's decision (${hostName})...`,
  },

  roundOver: {
    titleExplosion: 'BOOM!',
    titleDispute: 'Foul resolved!',
    exploded: (playerName: React.ReactNode, wire?: React.ReactNode) => (
      <>
        The bomb went off in {playerName}'s hands
        {wire && <> on the wire {wire}</>}
      </>
    ),
    pointFor: (teamName: string) => `+1 point for the ${teamName}`,
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
    body: "You'll play in the next one.",
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
