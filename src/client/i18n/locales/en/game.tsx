import React from 'react';
import type {GameMessages} from '../es/game.js';

export const game: GameMessages = {
  holder: {
    banner: "You're the defuser: you've got the bomb!",
    wireLabel: (category: string) => `🔌 Your wire · ${category}`,
    loadingWire: 'LOADING...',
    hint: "Anything goes: words, mime, sounds... except saying the word or one from its family (for «doghouse», no «dog»). When your backup gets it, cut the wire!",
    cutWire: 'WIRE CUT!',
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
    warning: '⚠️ Anything goes (words, mime, sounds...) except saying the word, part of it, or one from its family (for «doghouse», no «dog»): foul!',
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
