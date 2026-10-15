import React from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {BoardTile} from '../../../core/types.js';

export const GameBoard: React.FC = () => {
  const { game } = useGame();
  const { t } = useI18n();

  if (!game) return null;

  const { scores, targetScore, boardTiles } = game;
  const scoreA = scores.A ?? 0;
  const scoreB = scores.B ?? 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
          <span className="text-sm font-bold text-rose-400">{t.common.teams.A}: <span className="text-lg font-black">{scoreA}</span> {t.game.board.pointsShort}</span>
        </div>
        
        <div className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          {t.game.board.goal(targetScore)}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-sky-400">{t.common.teams.B}: <span className="text-lg font-black">{scoreB}</span> {t.game.board.pointsShort}</span>
          <span className="w-3 h-3 rounded-full bg-sky-500 shadow-sm" />
        </div>
      </div>

      {/* Visual Track */}
      <div className="relative pt-2 pb-1">
        <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
          {(boardTiles || []).map((tile: BoardTile) => {
            const hasTeamA = scoreA === tile.index;
            const hasTeamB = scoreB === tile.index;

            return (
              <div
                key={tile.index}
                className={`relative flex flex-col items-center justify-between p-2 rounded-xl border min-h-[75px] transition-all ${
                  tile.type === 'GOAL'
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-inner'
                    : tile.type === 'DOUBLE_TIME'
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : tile.type === 'MYSTERY_POWERUP'
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                  <span>#{tile.index}</span>
                  {tile.type === 'GOAL' && <span>🏆</span>}
                  {tile.type === 'DOUBLE_TIME' && <span>⚡</span>}
                  {tile.type === 'MYSTERY_POWERUP' && <span>🎁</span>}
                </div>

                {/* Team markers */}
                <div className="flex items-center justify-center space-x-1.5 my-auto">
                  {hasTeamA && (
                    <span
                      title={t.common.teams.A}
                      className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black text-white animate-bounce"
                    >
                      A
                    </span>
                  )}
                  {hasTeamB && (
                    <span
                      title={t.common.teams.B}
                      className="w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black text-white animate-bounce"
                    >
                      B
                    </span>
                  )}
                </div>

                <div className="text-[9px] font-bold tracking-tighter text-slate-400 uppercase text-center truncate w-full">
                  {t.game.board.tiles[tile.type]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
