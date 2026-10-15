import React from 'react';
import type {GameMessages} from '../es/game.js';

export const game: GameMessages = {
  holder: {
    banner: "You're the defuser: you've got the bomb!",
    wireLabel: (category: string) => `🔌 Your wire · ${category}`,
    loadingWire: 'LOADING...',
    hint: "Describe the word without saying it or any part of it. When your backup gets it, cut the wire!",
    cutWire: 'WIRE CUT!',
  },

  helpers: {
    roleBadge: '🧰 Role: Backup',
    intro: (holderName: string) => `${holderName} is your defuser and has the bomb. Listen and guess the wire!`,
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
    warning: '⚠️ If the rival defuser says the word, part of it, or translates it: foul!',
    foul: 'FOUL!',
    reasonTitle: 'Pick the reason for the foul:',
    reasons: [
      '1. Said the exact word or its root',
      '2. Used a translation or spelled it out',
      '3. Mimed or used gestures',
    ],
    defaultReason: 'Rule violation',
  },

  dispute: {
    title: 'FOUL CALLED!',
    subtitle: 'The round has been stopped for review',
    calledBy: 'Called by:',
    reason: 'Reason:',
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
    preparing: 'Getting ready...',
    playAgain: '🔄 Play again',
    waitingRematch: (hostName: string) => `Waiting for the host (${hostName}) to set up a new game...`,
    exitToMenu: 'Back to main menu',
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
