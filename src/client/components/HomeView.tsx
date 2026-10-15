import React, {useState} from 'react';
import {errorText, useI18n} from '../i18n/index.js';
import {useGame} from '../context/GameContext.js';

interface HomeViewProps {
  initialRoomCode?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({ initialRoomCode }) => {
  const { createRoom, joinRoom, error, clearError } = useGame();
  const { t } = useI18n();
  
  const [playerName, setPlayerName] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('expresion_player_name') || '';
    }
    return '';
  });
  
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [mode, setMode] = useState<'CHOICE' | 'JOIN'>(initialRoomCode ? 'JOIN' : 'CHOICE');
  const [loading, setLoading] = useState(false);

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('expresion_player_name', val);
    }
  };

  // Crear sala solo pide el nombre: mazos y ajustes se eligen ya dentro de la sala.
  const handleCreate = async () => {
    if (!playerName.trim() || loading) return;
    setLoading(true);
    clearError();
    await createRoom(playerName.trim());
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    setLoading(true);
    clearError();
    await joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] p-4 max-w-md mx-auto w-full">
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        
        {/* Title & Tagline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-4xl mb-3 shadow-inner">
            💣
          </div>
          <h1 className="text-3xl font-black text-amber-400 tracking-tight">{t.common.gameName}</h1>
          <p className="text-sm text-slate-400 mt-1">{t.common.tagline}</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center justify-between">
            <span>{errorText(t, error)}</span>
            <button onClick={clearError} aria-label={t.common.dismiss} className="font-bold text-rose-300 ml-2">×</button>
          </div>
        )}

        {/* Player Name Field */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.home.nameLabel}
          </label>
          <input
            type="text"
            required
            maxLength={20}
            value={playerName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t.home.namePlaceholder}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Mode Selector */}
        {mode === 'CHOICE' && (
          <div className="space-y-3">
            <button
              onClick={handleCreate}
              disabled={loading || !playerName.trim()}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 text-base"
            >
              <span>{loading ? t.home.creating : t.home.createRoom}</span>
            </button>

            <button
              onClick={() => setMode('JOIN')}
              disabled={!playerName.trim()}
              className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-2 text-base"
            >
              <span>{t.home.joinWithCode}</span>
            </button>
          </div>
        )}

        {/* Join Room Form */}
        {mode === 'JOIN' && (
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t.home.roomCodeLabel}
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder={t.home.roomCodePlaceholder}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center text-2xl font-bold tracking-widest placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent uppercase transition-all"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('CHOICE')}
                className="w-1/3 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-all"
              >
                {t.common.back}
              </button>
              <button
                type="submit"
                disabled={loading || !playerName.trim() || roomCode.length < 4}
                className="w-2/3 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {loading ? t.home.joining : t.home.joinRoom}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
