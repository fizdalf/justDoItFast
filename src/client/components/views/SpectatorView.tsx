import React from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {GameBoard} from '../board/GameBoard.js';
import {GameOverView} from './GameOverView.js';
import {RoundOverView} from './RoundOverView.js';
import {HostDisputeModal} from './HostDisputeModal.js';

/**
 * Para quien entró en la sala con la partida empezada: ve el tablero pero nunca el cable.
 * Si es el anfitrión, sigue pudiendo pasar de ronda, resolver disputas y cerrar el podio.
 */
export const SpectatorView: React.FC = () => {
  const { game, currentDispute } = useGame();
  const { t } = useI18n();
  if (!game) return null;

  const labels = t.game.spectator;

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-700 rounded-2xl p-4 text-center space-y-1.5 shadow-xl">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-600">
          {labels.badge}
        </div>
        <h2 className="text-lg font-black text-amber-400 uppercase tracking-wide">{labels.title}</h2>
        <p className="text-sm text-slate-300">{labels.body}</p>
      </div>

      {game.status === 'GAME_OVER' ? (
        <GameOverView />
      ) : (
        <>
          <GameBoard />
          {game.status === 'ROUND_OVER' && <RoundOverView />}
          {(currentDispute || game.status === 'DISPUTE_PAUSED') && <HostDisputeModal />}
        </>
      )}
    </div>
  );
};
