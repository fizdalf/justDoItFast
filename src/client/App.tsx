import React, {useEffect, useState} from 'react';
import {GameProvider, useGame} from './context/GameContext.js';
import {errorText, I18nProvider, useI18n} from './i18n/index.js';
import {Header} from './components/Header.js';
import {HomeView} from './components/HomeView.js';
import {LobbyView} from './components/LobbyView.js';
import {GameBoard} from './components/board/GameBoard.js';
import {ActiveGiverView} from './components/views/ActiveGiverView.js';
import {OpponentRefereeView} from './components/views/OpponentRefereeView.js';
import {TeamMateView} from './components/views/TeamMateView.js';
import {HostDisputeModal} from './components/views/HostDisputeModal.js';
import {GameOverView} from './components/views/GameOverView.js';
import {RoundOverView} from './components/views/RoundOverView.js';
import {AdminDeckEditor} from './components/admin/AdminDeckEditor.js';

const GameContent: React.FC = () => {
  const {
    gameState,
    isActivePlayer,
    isOpponentReferee,
    currentDispute,
    error,
    clearError,
  } = useGame();
  const { t } = useI18n();

  const [showAdmin, setShowAdmin] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(clearError, 4000);
    return () => clearTimeout(timeout);
  }, [error, clearError]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInitialRoomCode(roomParam.toUpperCase());
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      <Header onOpenAdmin={() => setShowAdmin(true)} />

      <main className="flex-1 flex flex-col justify-center items-center p-3 sm:p-6 w-full max-w-5xl mx-auto">
        {!gameState ? (
          <HomeView initialRoomCode={initialRoomCode} />
        ) : gameState.status === 'LOBBY' ? (
          <LobbyView />
        ) : gameState.status === 'GAME_OVER' ? (
          <GameOverView />
        ) : gameState.status === 'ROUND_OVER' ? (
          <div className="w-full flex flex-col items-center space-y-6">
            <GameBoard />
            <RoundOverView />
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-6">
            <GameBoard />

            {/* Asymmetric Role-based views */}
            {isActivePlayer ? (
              <ActiveGiverView />
            ) : isOpponentReferee ? (
              <OpponentRefereeView />
            ) : (
              <TeamMateView />
            )}

            {/* Dispute Mediation Overlay */}
            {(currentDispute || gameState.status === 'DISPUTE_PAUSED') && <HostDisputeModal />}
          </div>
        )}
      </main>

      {/* In-game errors (Home and Lobby render their own) */}
      {error && gameState && gameState.status !== 'LOBBY' && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto p-3 bg-rose-950/95 border border-rose-500/50 rounded-xl text-rose-200 text-sm flex items-center justify-between shadow-2xl animate-fadeIn">
          <span>{errorText(t, error)}</span>
          <button onClick={clearError} aria-label={t.common.dismiss} className="font-bold text-rose-300 ml-2">×</button>
        </div>
      )}

      {showAdmin && <AdminDeckEditor onClose={() => setShowAdmin(false)} />}
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
