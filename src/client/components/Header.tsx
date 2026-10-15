import React, {useState} from 'react';
import {useGame} from '../context/GameContext.js';
import {audioService} from '../services/audioService.js';
import {Language, LANGUAGES, useI18n} from '../i18n/index.js';
import {EndGameControl} from './EndGameControl.js';

interface HeaderProps {
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin }) => {
  const { socketStatus, room, leaveRoom } = useGame();
  const { t, lang, setLang } = useI18n();
  const [isMuted, setIsMuted] = useState(audioService.getIsMuted());
  const [copied, setCopied] = useState(false);

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

  const getStatusColor = () => {
    switch (socketStatus) {
      case 'CONNECTED':
        return 'bg-emerald-500';
      case 'CONNECTING':
      case 'RECONNECTING':
        return 'bg-amber-500 animate-pulse';
      default:
        return 'bg-rose-500';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 select-none shadow-md">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl" role="img" aria-label={t.common.header.bombAlt}>💣</span>
          <span className="font-extrabold text-lg tracking-wide text-amber-400 truncate">{t.common.gameName}</span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2 py-1 rounded-full text-xs font-medium border border-slate-700/50">
          <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-slate-300 capitalize">{t.common.connection[socketStatus]}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
          title={t.common.header.language}
          aria-label={t.common.header.language}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 px-2 py-1.5 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {(Object.keys(LANGUAGES) as Language[]).map((code) => (
            <option key={code} value={code}>
              {code.toUpperCase()} · {LANGUAGES[code].label}
            </option>
          ))}
        </select>

        {room && (
          <button
            onClick={copyRoomCode}
            title={t.common.header.copyRoomCode}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-sm font-mono font-bold text-amber-300 transition-colors"
          >
            <span>{room.roomCode}</span>
            <span className="text-xs text-slate-400">{copied ? '✓' : '📋'}</span>
          </button>
        )}

        <button
          onClick={toggleMute}
          title={isMuted ? t.common.header.unmute : t.common.header.mute}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {onOpenAdmin && !room && (
          <button
            onClick={onOpenAdmin}
            title={t.common.header.adminTitle}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-semibold transition-colors"
          >
            {t.common.header.admin}
          </button>
        )}

        <EndGameControl />

        {room && (
          <button
            onClick={() => leaveRoom()}
            title={t.common.header.leaveTitle}
            className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 border border-rose-500 rounded-lg text-xs font-bold text-white transition-colors"
          >
            {t.common.header.leave}
          </button>
        )}
      </div>
    </header>
  );
};
