import React from 'react';
import type {PowerUpType, TileType, XrayReading} from '../../../../core/types.js';
import type {PowerUpUsage} from '../../../../core/powerUpRules.js';

export const game = {
  // Vista del artificiero (tiene la bomba)
  holder: {
    banner: 'Eres el artificiero: ¡tienes la bomba!',
    wireLabel: (category: string) => `🔌 Tu cable · ${category}`,
    loadingWire: 'CARGANDO...',
    hint: 'Vale todo: palabras, mímica, sonidos... Pero si dices la palabra o algo demasiado obvio (como «lugar donde hay perros» para «perrera»), te pueden cantar falta. Cuando tus ayudantes la acierten, ¡corta el cable!',
    cutWire: '¡CABLE CORTADO!',
    frozen: (seconds?: number) => (seconds === undefined ? '¡INHIBIDO!' : `¡INHIBIDO! ${seconds} s`),
  },

  // Estado del turno visible para todos los que juegan
  turn: {
    wireCounter: (current: number, total: number) => `Cable ${current}/${total}`,
    frozenBadge: (seconds?: number) => (seconds === undefined ? '❄️ Inhibido' : `❄️ Inhibido · ${seconds} s`),
    reversed: 'Sentido invertido',
  },

  // Barra de herramientas del propio equipo
  tools: {
    /** Cuándo se puede usar cada herramienta (se muestra en las que aún no se pueden usar). */
    usageHints: {
      HOLDER: 'Solo el artificiero',
      RIVALS: 'Cuando el rival tiene la bomba',
      TEAM: 'Durante la ronda',
      PASSIVE: 'Se activa sola si os explota',
    } as Record<PowerUpUsage, string>,
    notPlaying: 'Con la ronda en marcha',
    holdHint: 'Mantén pulsada una herramienta para usarla',
  },

  // Avisos que aparecen arriba durante la partida
  notices: {
    awarded: (toolName: string) => `🎁 Nueva herramienta: ${toolName}`,
    awardedSource: {
      FAST_GUESS: 'Por cortar el cable rápido',
      TILE: 'Por la casilla sorpresa',
    } as Record<'FAST_GUESS' | 'TILE', string>,
    activated: (playerName: string, teamName: string, toolName: string) => `${playerName} (${teamName}) usa ${toolName}`,
    /** Qué hace cada herramienta al usarse (segunda línea del aviso). */
    effects: {
      REVERSE: 'La bomba vuelve a quien la pasó y cambia el sentido de los pases',
      SKIP: 'Cable nuevo, pero este turno ya no gana herramientas',
      DOUBLE_BURDEN: 'El artificiero rival tendrá que cortar un cable más (aún no lo sabe)',
      FREEZE: 'El botón del artificiero queda bloqueado unos segundos',
      SHIELD: 'El traje antiexplosivos está listo',
      XRAY: 'Ha mirado cuánto le queda a la bomba',
      REWIRE: 'El temporizador se ha reprogramado: nadie sabe cuánto queda',
    } as Record<PowerUpType, string>,
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
    warning: '⚠️ Si os parece que una pista se pasa (decir la palabra, o algo como «lugar donde hay perros» para «perrera»), cantad falta y lo decidís entre todos.',
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
