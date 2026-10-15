import React, {useState} from 'react';
import {useGame} from '../context/GameContext.js';
import {useI18n} from '../i18n/index.js';

/** Botón del anfitrión para terminar la partida antes de tiempo, con paso de confirmación. */
export const EndGameControl: React.FC = () => {
  const { game, isHost, endGame } = useGame();
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);

  // En el podio el anfitrión ya tiene su propio botón para volver a la sala.
  if (!isHost || !game || game.status === 'GAME_OVER') return null;

  const labels = t.game.endGame;

  const handleConfirm = async () => {
    if (ending) return;
    setEnding(true);
    await endGame();
    setEnding(false);
    setConfirming(false);
  };

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        title={labels.button}
        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-rose-500/50 rounded-lg text-xs font-bold text-rose-300 transition-colors"
      >
        {labels.button}
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-game-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <h2 id="end-game-title" className="text-xl font-black text-rose-400 uppercase tracking-wide">
              {labels.confirmTitle}
            </h2>
            <p className="text-sm text-slate-300">{labels.confirmBody}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={ending}
                className="w-1/2 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={ending}
                className="w-1/2 py-3 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
              >
                {ending ? labels.ending : labels.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
