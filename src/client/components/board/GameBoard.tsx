import React from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {BoardTile, TeamId, TileType} from '../../../core/types.js';

const TILE_ICON: Partial<Record<TileType, string>> = {
  DOUBLE_TIME: '⚡',
  MYSTERY_POWERUP: '🎁',
  GOAL: '🏆',
};

const TEAM_STYLE: Record<TeamId, { text: string; dot: string; fill: string }> = {
  A: { text: 'text-rose-400', dot: 'bg-rose-500', fill: 'bg-rose-500' },
  B: { text: 'text-sky-400', dot: 'bg-sky-500', fill: 'bg-sky-500' },
};

/**
 * Marcador y tablero. `compact` es una sola línea para la pantalla de juego (deja sitio al
 * cable y al botón); el tablero completo son dos carriles de casillas, uno por equipo.
 */
export const GameBoard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { game } = useGame();
  const { t } = useI18n();
  if (!game) return null;

  const { scores, targetScore, boardTiles } = game;
  // Casillas a recorrer: de la 1 a la meta (la 0 es la salida).
  const track = (boardTiles ?? []).filter((tile) => tile.index > 0);

  if (compact) {
    // Devolver al remitente invierte el sentido de los pases
    const reversed = game.currentTurn?.direction === -1;
    return (
      <div className="w-full flex items-center justify-between gap-2 px-2 py-1">
        <TeamScore team="A" name={t.common.teams.A} score={scores.A ?? 0} hideName />
        <span className="flex flex-col items-center leading-tight">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-400 whitespace-nowrap">
            {t.game.board.goal(targetScore)}
          </span>
          {reversed && (
            <span className="text-[10px] font-bold text-purple-300 whitespace-nowrap">↺ {t.game.turn.reversed}</span>
          )}
        </span>
        <TeamScore team="B" name={t.common.teams.B} score={scores.B ?? 0} alignRight hideName />
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <TeamScore team="A" name={t.common.teams.A} score={scores.A ?? 0} large />
        <span className="text-[11px] font-mono font-bold uppercase text-slate-400 whitespace-nowrap">
          {t.game.board.goal(targetScore)}
        </span>
        <TeamScore team="B" name={t.common.teams.B} score={scores.B ?? 0} large alignRight />
      </div>

      {/* Casillas especiales, alineadas con los carriles */}
      <div className="flex gap-1" aria-hidden>
        {track.map((tile) => (
          <div key={tile.index} className="flex-1 text-center text-xs leading-none h-4">
            {TILE_ICON[tile.type] ?? ''}
          </div>
        ))}
      </div>
      <TeamLane team="A" score={scores.A ?? 0} track={track} label={t.common.teams.A} tileLabels={t.game.board.tiles} />
      <TeamLane team="B" score={scores.B ?? 0} track={track} label={t.common.teams.B} tileLabels={t.game.board.tiles} />
    </div>
  );
};

const TeamScore: React.FC<{
  team: TeamId;
  name: string;
  score: number;
  large?: boolean;
  alignRight?: boolean;
  /** Solo el punto de color (el nombre queda para lectores de pantalla). */
  hideName?: boolean;
}> = ({ team, name, score, large, alignRight, hideName }) => (
  <div className={`flex items-center gap-1.5 min-w-0 ${alignRight ? 'flex-row-reverse text-right' : ''}`}>
    <span className={`w-2.5 h-2.5 shrink-0 rounded-full ${TEAM_STYLE[team].dot}`} />
    <span className={hideName ? 'sr-only' : `truncate text-xs font-bold ${TEAM_STYLE[team].text}`}>{name}</span>
    <span className={`font-black text-white tabular-nums ${large ? 'text-2xl' : 'text-lg'}`}>{score}</span>
  </div>
);

const TeamLane: React.FC<{
  team: TeamId;
  score: number;
  track: BoardTile[];
  label: string;
  tileLabels: Record<TileType, string>;
}> = ({ team, score, track, label, tileLabels }) => (
  <div className="flex gap-1" role="img" aria-label={`${label}: ${score}/${track.length}`}>
    {track.map((tile) => {
      const reached = tile.index <= score;
      const isCurrent = tile.index === score;
      return (
        <div
          key={tile.index}
          title={tileLabels[tile.type]}
          className={`flex-1 h-3 rounded-full transition-colors duration-500 ${
            reached ? TEAM_STYLE[team].fill : tile.type === 'GOAL' ? 'bg-amber-500/25' : 'bg-slate-800'
          } ${isCurrent ? 'ring-2 ring-white/70' : ''}`}
        />
      );
    })}
  </div>
);
