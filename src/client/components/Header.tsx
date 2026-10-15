import React, {useState} from 'react';
import {useGame} from '../context/GameContext.js';
import {audioService} from '../services/audioService.js';
import {Language, LANGUAGES, useI18n} from '../i18n/index.js';
import {EndGameControl} from './EndGameControl.js';

interface HeaderProps {
  onOpenAdmin?: () => void;
}

// Pensada para móvil: solo título, estado de conexión y un menú (⋮) con el resto de controles.
export const Header: React.FC<HeaderProps> = ({ onOpenAdmin }) => {
  const { socketStatus, room, leaveRoom } = useGame();
  const { t, lang, setLang } = useI18n();
  const [isMuted, setIsMuted] = useState(audioService.getIsMuted());
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const labels = t.common.header;

  const toggleMute = () => {
    const next = !isMuted;
    audioService.setMuted(next);
    setIsMuted(next);
  };

  const copyRoomCode = () => {
    if (room?.roomCode && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isConnected = socketStatus === 'CONNECTED';
  const statusColor = isConnected
    ? 'bg-emerald-500'
    : socketStatus === 'CONNECTING' || socketStatus === 'RECONNECTING'
      ? 'bg-amber-500 animate-pulse'
      : 'bg-rose-500';

  const menuItem =
    'w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 active:bg-slate-700 transition-colors';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white select-none pt-[env(safe-area-inset-top)]">
      <div className="h-14 px-3 sm:px-4 flex items-center gap-2 max-w-5xl mx-auto">
        <span className="text-2xl shrink-0" role="img" aria-label={labels.bombAlt}>💣</span>
        <span className="flex-1 min-w-0 truncate font-extrabold text-base sm:text-lg tracking-wide text-amber-400">
          {t.common.gameName}
        </span>

        {/* El estado solo ocupa sitio con texto cuando hay un problema de conexión */}
        <span
          role="status"
          title={t.common.connection[socketStatus]}
          className={`shrink-0 flex items-center gap-1.5 rounded-full text-xs font-medium ${
            isConnected ? 'p-1' : 'bg-slate-800/80 border border-slate-700/50 px-2 py-1'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          {isConnected ? (
            <span className="sr-only">{t.common.connection[socketStatus]}</span>
          ) : (
            <span className="text-slate-300">{t.common.connection[socketStatus]}</span>
          )}
        </span>

        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={labels.menu}
          className="shrink-0 w-11 h-11 -mr-1 flex items-center justify-center rounded-xl text-2xl leading-none text-slate-200 hover:bg-slate-800 active:bg-slate-700"
        >
          ⋮
        </button>
      </div>

      {menuOpen && (
        <>
          <button
            aria-label={t.common.close}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-2 sm:right-4 top-full mt-1 z-50 w-72 max-w-[calc(100vw-1rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
          >
            {room && (
              <button role="menuitem" onClick={copyRoomCode} title={labels.copyRoomCode} className={menuItem}>
                <span>{labels.roomCode}</span>
                <span className="font-mono font-black tracking-widest text-amber-300">
                  {room.roomCode} <span className="text-xs text-slate-400">{copied ? '✓' : '📋'}</span>
                </span>
              </button>
            )}

            <div className="px-4 py-3 flex items-center justify-between gap-3 border-t border-slate-800">
              <span className="text-sm font-semibold text-slate-200">{labels.language}</span>
              <div className="flex rounded-lg border border-slate-700 overflow-hidden" role="group" aria-label={labels.language}>
                {(Object.keys(LANGUAGES) as Language[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    title={LANGUAGES[code].label}
                    className={`px-3 py-1.5 text-xs font-bold uppercase ${
                      lang === code ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <button role="menuitem" onClick={toggleMute} className={`${menuItem} border-t border-slate-800`}>
              <span>{isMuted ? labels.unmute : labels.mute}</span>
              <span>{isMuted ? '🔇' : '🔊'}</span>
            </button>

            {onOpenAdmin && !room && (
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAdmin();
                }}
                title={labels.adminTitle}
                className={`${menuItem} border-t border-slate-800`}
              >
                <span>{labels.admin}</span>
              </button>
            )}

            <EndGameControl className={`${menuItem} border-t border-slate-800 text-rose-300`} />

            {room && (
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  void leaveRoom();
                }}
                title={labels.leaveTitle}
                className={`${menuItem} border-t border-slate-800 text-rose-400`}
              >
                <span>{labels.leaveTitle}</span>
                <span>🚪</span>
              </button>
            )}
          </div>
        </>
      )}
    </header>
  );
};
