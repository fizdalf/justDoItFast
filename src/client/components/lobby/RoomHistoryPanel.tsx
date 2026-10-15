import React from 'react';
import {useGame} from '../../context/GameContext.js';
import {useI18n} from '../../i18n/index.js';
import {usePacks} from '../../hooks/usePacks.js';
import {GameSummary} from '../../../core/types.js';

/** Historial sencillo de las partidas jugadas en la sala, la más reciente primero. */
export const RoomHistoryPanel: React.FC = () => {
  const { room } = useGame();
  const { t } = useI18n();
  const packs = usePacks();
  if (!room) return null;

  const labels = t.lobby.history;
  const history = [...room.history].sort((a, b) => b.gameNumber - a.gameNumber);
  const packName = (id: string) => packs.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{labels.title}</h3>

      {history.length === 0 ? (
        <div className="text-xs text-slate-500 italic">{labels.empty}</div>
      ) : (
        <ul className="space-y-2">
          {history.map((summary: GameSummary) => (
            <li
              key={summary.gameNumber}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-bold text-white">{labels.gameLabel(summary.gameNumber)}</div>
                <div className="text-[11px] text-slate-400 truncate">
                  {summary.packIds.map(packName).join(' · ')} · {labels.rounds(summary.roundsPlayed)}
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className="font-mono font-black text-sm">
                  <span className="text-rose-400">{summary.scores.A ?? 0}</span>
                  <span className="text-slate-500"> – </span>
                  <span className="text-sky-400">{summary.scores.B ?? 0}</span>
                </span>
                {summary.finished && summary.winningTeam ? (
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      summary.winningTeam === 'A'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                        : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                    }`}
                  >
                    🏆 {labels.winner(t.common.teams[summary.winningTeam])}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 italic">{labels.abandoned}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
