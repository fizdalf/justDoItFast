import React from 'react';
import type {TileType} from '../../../../core/types.js';

export const game = {
  // Vista del artificiero (tiene la bomba)
  holder: {
    banner: 'Eres el artificiero: ¡tienes la bomba!',
    wireLabel: (category: string) => `🔌 Tu cable · ${category}`,
    loadingWire: 'CARGANDO...',
    hint: 'Describe la palabra sin decirla ni usar su raíz. Cuando tus ayudantes la acierten, ¡corta el cable!',
    cutWire: '¡CABLE CORTADO!',
  },

  // Vista de los ayudantes (compañeros del artificiero)
  helpers: {
    roleBadge: '🧰 Rol: Ayudante',
    intro: (holderName: string) => `${holderName} es vuestro artificiero y tiene la bomba. ¡Escucha y adivina el cable!`,
    categoryLabel: (category: string) => `Categoría: ${category}`,
    guessAloud: '¡ADIVINA EN VOZ ALTA!',
    guessHint: 'Di todas las palabras que se te ocurran hasta acertar, antes de que la bomba explote',
    footer: (holderName: string) =>
      `Cuando aciertes, ${holderName} cortará el cable y la bomba pasará a los saboteadores`,
  },

  // Vista de los saboteadores (equipo rival del artificiero)
  saboteurs: {
    roleBadge: '🕵️ Rol: Saboteador',
    intro: (holderName: string) =>
      `${holderName} es el artificiero rival. Vigila que no diga la palabra ni haga trampas: queréis que le explote.`,
    wireLabel: (category: string) => `🔌 Cable del rival · ${category}`,
    warning: '⚠️ Si el artificiero rival dice la palabra, una parte de ella o la traduce: ¡falta!',
    foul: '¡FALTA!',
    reasonTitle: 'Selecciona el motivo de la falta:',
    reasons: [
      '1. Dijo la palabra exacta o su raíz',
      '2. Usó una traducción o deletreó',
      '3. Hizo mímica o gestos',
    ],
    defaultReason: 'Infracción de reglas',
  },

  dispute: {
    title: '¡FALTA CANTADA!',
    subtitle: 'La ronda se ha detenido para revisión arbitral',
    calledBy: 'Reclamada por:',
    reason: 'Motivo:',
    hostDecision: '👑 Decisión del anfitrión',
    awardTo: (teamName: string) => `🏆 Dar punto al ${teamName}`,
    restart: '🔄 Reiniciar ronda (sin puntos)',
    restartHint: 'Bomba nueva',
    waiting: (hostName: string) => `Esperando la decisión del anfitrión (${hostName})...`,
    waitingHint: 'El juego seguirá en cuanto se tome una decisión',
  },

  roundOver: {
    titleExplosion: '¡BOOM!',
    titleDispute: '¡Falta resuelta!',
    roundEnded: (round: number) => `Fin de la ronda ${round}`,
    exploded: (playerName: React.ReactNode, wire?: React.ReactNode) => (
      <>
        La bomba explotó en manos de {playerName}
        {wire && <> con el cable {wire}</>}
      </>
    ),
    disputeResolved: 'El anfitrión ha resuelto la disputa a favor de un equipo',
    pointFor: (teamName: string) => `+1 punto para el ${teamName}`,
    myTeamScored: '¡Tu equipo avanza en el tablero!',
    myTeamDidNotScore: 'Tu equipo no suma esta vez',
    starting: 'Iniciando...',
    nextRound: '💣 Siguiente ronda',
    waitingNextRound: (hostName: string) => `Esperando a que el anfitrión (${hostName}) inicie la siguiente ronda...`,
  },

  gameOver: {
    title: '¡VICTORIA FINAL!',
    winner: (teamName: string) => `Ganador: ${teamName}`,
    finalScore: 'Marcador final',
    points: 'puntos',
    preparing: 'Preparando...',
    playAgain: '🔄 Jugar otra partida',
    waitingRematch: (hostName: string) => `Esperando a que el anfitrión (${hostName}) prepare una nueva partida...`,
    exitToMenu: 'Salir al menú principal',
  },

  board: {
    pointsShort: 'pts',
    goal: (target: number) => `Meta: ${target} pts`,
    tiles: {
      NORMAL: 'Normal',
      DOUBLE_TIME: '2x',
      MYSTERY_POWERUP: 'Herramienta',
      GOAL: 'Meta',
    } as Record<TileType, string>,
  },
};

export type GameMessages = typeof game;
