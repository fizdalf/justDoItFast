import React from 'react';
import type {TileType} from '../../../../core/types.js';

export const game = {
  // Vista del artificiero (tiene la bomba)
  holder: {
    banner: 'Eres el artificiero: ¡tienes la bomba!',
    wireLabel: (category: string) => `🔌 Tu cable · ${category}`,
    loadingWire: 'CARGANDO...',
    hint: 'Vale todo: palabras, mímica, sonidos... menos decir la palabra o una de su familia (para «perrera», nada de «perro»). Cuando tus ayudantes la acierten, ¡corta el cable!',
    cutWire: '¡CABLE CORTADO!',
  },

  // Vista de los ayudantes (compañeros del artificiero)
  helpers: {
    roleBadge: '🧰 Rol: Ayudante',
    intro: (holderName: string) => `${holderName} es vuestro artificiero y tiene la bomba. ¡Atento a sus pistas y adivina el cable!`,
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
    warning: '⚠️ Vale todo (palabras, mímica, sonidos...) menos decir la palabra, una parte de ella o una de su familia (para «perrera», nada de «perro»): ¡falta!',
    foul: '¡FALTA!',
    holdHint: 'Mantén pulsado para cantar falta',
  },

  dispute: {
    title: '¡FALTA CANTADA!',
    subtitle: 'La ronda se ha detenido para revisión arbitral',
    calledBy: 'Reclamada por:',
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
    returning: 'Volviendo...',
    backToRoom: '🏠 Volver a la sala',
    waitingBackToRoom: (hostName: string) => `Esperando a que el anfitrión (${hostName}) vuelva a la sala...`,
    leaveRoom: 'Salir de la sala',
  },

  // Quien entró en la sala con la partida ya empezada
  spectator: {
    badge: '👀 Espectador',
    title: 'Partida en curso',
    body: 'Has llegado con la partida empezada: jugarás en la siguiente.',
    hint: 'Mientras tanto, sigue el marcador desde aquí.',
  },

  // El anfitrión termina la partida antes de tiempo
  endGame: {
    button: '🛑 Terminar partida',
    confirmTitle: '¿Terminar la partida?',
    confirmBody: 'Todos volveréis a la sala y la partida quedará en el historial como terminada antes de tiempo.',
    confirm: 'Sí, terminar',
    ending: 'Terminando...',
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
