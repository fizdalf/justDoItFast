import React, {useEffect, useState} from 'react';
import {GameProvider, useGame} from './context/GameContext.js';
import {errorText, I18nProvider, useI18n} from './i18n/index.js';
import {getRoomCodeFromUrl} from './services/roomSession.js';
import {Header} from './components/Header.js';
import {HomeView} from './components/HomeView.js';
import {RoomView} from './components/RoomView.js';
import {GameBoard} from './components/board/GameBoard.js';
import {ActiveGiverView} from './components/views/ActiveGiverView.js';
import {OpponentRefereeView} from './components/views/OpponentRefereeView.js';
import {TeamMateView} from './components/views/TeamMateView.js';
import {HostDisputeModal} from './components/views/HostDisputeModal.js';
import {GameOverView} from './components/views/GameOverView.js';
import {RoundOverView} from './components/views/RoundOverView.js';
import {SpectatorView} from './components/views/SpectatorView.js';
import {AdminDeckEditor} from './components/admin/AdminDeckEditor.js';
import {NoticeStack} from './components/NoticeStack.js';
import {LocalSoundTest} from './components/LocalSoundTest.js';

const GameContent: React.FC = () => {
  const {
    room,
    game,
    isSpectator,
    isActivePlayer,
    isOpponentReferee,
    currentDispute,
    error,
    clearError,
    restoringRoom,
  } = useGame();
  const { t } = useI18n();

  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(clearError, 4000);
    return () => clearTimeout(timeout);
  }, [error, clearError]);

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      <Header onOpenAdmin={() => setShowAdmin(true)} />

      <main className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-6">
        {!room && restoringRoom ? (
          <div className="my-auto flex flex-col items-center space-y-3 text-slate-300 animate-fadeIn">
            <div className="text-5xl animate-pulse">💣</div>
            <div className="text-sm font-semibold">{t.common.returningToRoom(restoringRoom)}</div>
          </div>
        ) : !room ? (
          <HomeView initialRoomCode={getRoomCodeFromUrl()} />
        ) : !game ? (
          <RoomView />
        ) : isSpectator ? (
          <SpectatorView />
        ) : game.status === 'GAME_OVER' ? (
          <GameOverView />
        ) : game.status === 'ROUND_OVER' ? (
          <div className="w-full max-w-md flex flex-col items-center gap-4">
            <GameBoard />
            <RoundOverView />
          </div>
        ) : (
          <div className="flex-1 w-full max-w-md flex flex-col gap-3">
            <GameBoard compact />

            {/* Asymmetric Role-based views */}
            {isActivePlayer ? (
              <ActiveGiverView />
            ) : isOpponentReferee ? (
              <OpponentRefereeView />
            ) : (
              <TeamMateView />
            )}

            {/* Dispute Mediation Overlay */}
            {(currentDispute || game.status === 'DISPUTE_PAUSED') && <HostDisputeModal />}
          </div>
        )}
      </main>

      {/* Errores durante la partida (el inicio y la sala muestran los suyos) */}
      {error && game && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto p-3 bg-rose-950/95 border border-rose-500/50 rounded-xl text-rose-200 text-sm flex items-center justify-between shadow-2xl animate-fadeIn">
          <span>{errorText(t, error)}</span>
          <button onClick={clearError} aria-label={t.common.dismiss} className="font-bold text-rose-300 ml-2">×</button>
        </div>
      )}

      {/* Avisos de herramientas (bajo la cabecera) */}
      {game && <NoticeStack />}

      {showAdmin && <AdminDeckEditor onClose={() => setShowAdmin(false)} />}
      <LocalSoundTest />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </I18nProvider>
  );
};
