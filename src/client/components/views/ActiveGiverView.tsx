import React, {useState} from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {PowerUp} from '../../../core/types.js';

export const ActiveGiverView: React.FC = () => {
  const { currentTurn, game, guessSuccess, usePowerUp, inventory, myPlayer, lastTick } = useGame();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [activePowerUpId, setActivePowerUpId] = useState<string | null>(null);

  const word = currentTurn?.currentWord || game?.currentTurn?.currentWord || t.game.holder.loadingWire;
  const category = currentTurn?.category || game?.currentTurn?.category || '';
  const myTeam = myPlayer?.team || 'A';
  const myTeamInventory = inventory[myTeam] || [];

  const handleGuessSuccess = async () => {
    if (submitting) return;
    setSubmitting(true);
    await guessSuccess();
    setSubmitting(false);
  };

  const handleUsePowerUp = async (p: PowerUp) => {
    if (activePowerUpId) return;
    setActivePowerUpId(p.id);
    await usePowerUp(p.id);
    setActivePowerUpId(null);
  };

  const isFastPulsing = (lastTick?.intervalMs ?? 1000) <= 400;

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] w-full max-w-md mx-auto space-y-6">
      
      {/* Urgency indicator */}
      <div className="w-full text-center">
        <div className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-lg ${
          isFastPulsing
            ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }`}>
          <span className="text-base">💣</span>
          <span>{t.game.holder.banner}</span>
        </div>
      </div>

      {/* Main Word Card */}
      <div className={`w-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 rounded-3xl p-8 sm:p-10 text-center shadow-2xl transition-all duration-300 flex flex-col justify-center items-center min-h-[220px] ${
        isFastPulsing
          ? 'border-rose-500 shadow-rose-500/20 ring-4 ring-rose-500/20'
          : 'border-amber-500/60 shadow-amber-500/10'
      }`}>
        <span className="text-xs font-bold font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-4">
          {t.game.holder.wireLabel(category)}
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-wide break-words select-none uppercase">
          {word}
        </h2>
        <p className="text-xs text-slate-400 mt-4">
          {t.game.holder.hint}
        </p>
      </div>

      {/* Team Power-ups inventory */}
      {myTeamInventory.length > 0 && (
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
            {t.common.yourTeamTools}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {myTeamInventory.map((p: PowerUp) => (
              <button
                key={p.id}
                onClick={() => handleUsePowerUp(p)}
                title={t.common.powerUps[p.type].description}
                disabled={!!activePowerUpId}
                className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 transition-colors flex items-center space-x-1"
              >
                <span>⚡</span>
                <span>{t.common.powerUps[p.type].name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Big Action Button */}
      <div className="w-full pt-2">
        <button
          onClick={handleGuessSuccess}
          disabled={submitting}
          className="w-full py-5 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-black text-xl rounded-2xl shadow-xl shadow-emerald-500/30 border border-emerald-400/50 transition-all uppercase tracking-wide flex items-center justify-center space-x-3 select-none"
        >
          <span className="text-2xl">✂️</span>
          <span>{t.game.holder.cutWire}</span>
        </button>
      </div>

    </div>
  );
};
