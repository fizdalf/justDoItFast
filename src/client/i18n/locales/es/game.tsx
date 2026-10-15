import React from 'react';
import type {PowerUpType, TileType, XrayReading} from '../../../../core/types.js';

export const game = {
  // Vista del artificiero (tiene la bomba)
  holder: {
    banner: '💣 ¡Tienes la bomba!',
    loadingWire: 'CARGANDO...',
    cutWire: '¡CABLE CORTADO!',
    frozen: (seconds?: number) => (seconds === undefined ? '¡INHIBIDO!' : `¡INHIBIDO! ${seconds} s`),
  },

  // Estado del turno visible para todos los que juegan
  turn: {
    wireCounter: (current: number, total: number) => `Cable ${current}/${total}`,
    frozenBadge: (seconds?: number) => (seconds === undefined ? '❄️ Inhibido' : `❄️ Inhibido · ${seconds} s`),
    reversed: 'Sentido invertido',
  },

  // Barra de herramientas del propio equipo (solo aparecen las que se pueden usar ahora)
  tools: {
    holdToUse: 'Mantén pulsado',
  },

  // Avisos que aparecen arriba durante la partida
  notices: {
    awarded: (toolName: string) => `🎁 Nueva herramienta: ${toolName}`,
    activated: (playerName: string, teamName: string, toolName: string) => `${playerName} (${teamName}) usa ${toolName}`,
    doubleRevealed: {
      ours: '¡Doble detonador! Otro cable más',
      theirs: (teamName: string) => `El ${teamName} ha descubierto el doble detonador`,
      bouncedToUs: '¡Te han devuelto el doble detonador!',
      bounced: (teamName: string) => `¡El doble detonador vuelve al ${teamName}!`,
      wires: (n: number) => `Hay que cortar ${n} cables`,
    },
    xrayTitle: (toolName: string) => `🩻 ${toolName}`,
    xray: {
      LONG: 'Le queda bastante',
      MEDIUM: 'A medio camino',
      SHORT: '¡Está a punto!',
    } as Record<XrayReading, string>,
    xrayHint: 'Solo lo ve tu equipo',
    shielded: (toolName: string, playerName: string) => `🦺 ¡El ${toolName} salva a ${playerName}!`,
    shieldedDetail: (teamName: string) => `La bomba se rearma con mecha corta y pasa al ${teamName}`,
  },

  // Vista de los ayudantes (compañeros del artificiero)
  helpers: {
    roleBadge: '🧰 Ayudante',
    clueGiver: (holderName: string) => `Pistas de ${holderName}`,
    guessAloud: '¡ADIVINA!',
  },

  // Vista de los saboteadores (equipo rival del artificiero)
  saboteurs: {
    roleBadge: '🕵️ Saboteador',
    clueGiver: (holderName: string) => `${holderName} da las pistas`,
    foul: '¡FALTA!',
    holdHint: 'mantén pulsado',
  },

  dispute: {
    title: '¡FALTA CANTADA!',
    calledBy: 'Reclamada por:',
    hostDecision: '👑 Decisión del anfitrión',
    awardTo: (teamName: string) => `🏆 Dar punto al ${teamName}`,
    restart: '🔄 Reiniciar ronda (sin puntos)',
    restartHint: 'Bomba nueva',
    waiting: (hostName: string) => `Esperando la decisión del anfitrión (${hostName})...`,
  },

  roundOver: {
    titleExplosion: '¡BOOM!',
    titleDispute: '¡Falta resuelta!',
    exploded: (playerName: React.ReactNode, wire?: React.ReactNode) => (
      <>
        La bomba explotó en manos de {playerName}
        {wire && <> con el cable {wire}</>}
      </>
    ),
    pointFor: (teamName: string) => `+1 punto para el ${teamName}`,
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
    body: 'Jugarás en la siguiente.',
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
