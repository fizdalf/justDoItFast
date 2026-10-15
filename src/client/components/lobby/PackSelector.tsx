import React from 'react';
import {useGame} from '../../context/GameContext.js';
import {useI18n} from '../../i18n/index.js';
import {usePacks} from '../../hooks/usePacks.js';
import {WordPack} from '../../../core/types.js';

/** Mazos de la próxima partida: el anfitrión marca uno o varios; el resto ve cuáles van. */
export const PackSelector: React.FC = () => {
  const { room, isHost, updateSetup } = useGame();
  const { t } = useI18n();
  const packs = usePacks();
  if (!room) return null;

  const selectedIds = room.setup.packIds;
  const selectedPacks = packs.filter((p) => selectedIds.includes(p.id));
  // Las palabras repetidas entre mazos solo cuentan una vez (el servidor las deduplica).
  const totalWords = new Set(selectedPacks.flatMap((p) => p.words ?? []).map((w) => w.toLocaleLowerCase())).size;

  const toggle = (pack: WordPack) => {
    if (!isHost) return;
    const isSelected = selectedIds.includes(pack.id);
    if (isSelected && selectedIds.length <= 1) return;
    const next = isSelected ? selectedIds.filter((id) => id !== pack.id) : [...selectedIds, pack.id];
    void updateSetup({ packIds: next });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.lobby.pack.label}</h3>
        <span className="text-[11px] font-mono font-bold text-amber-300">{t.lobby.pack.total(totalWords)}</span>
      </div>

      {isHost ? (
        <>
          <p className="text-[11px] text-slate-500">{t.lobby.pack.hint}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {packs.map((pack) => {
              const checked = selectedIds.includes(pack.id);
              const isLastOne = checked && selectedIds.length <= 1;
              return (
                <button
                  key={pack.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-disabled={isLastOne}
                  title={isLastOne ? t.lobby.pack.lastOne : pack.description}
                  onClick={() => toggle(pack)}
                  className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-colors ${
                    checked
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  } ${isLastOne ? 'cursor-default' : ''}`}
                >
                  <span
                    className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center text-xs font-black ${
                      checked ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-600'
                    }`}
                  >
                    {checked && '✓'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">{pack.name}</span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      {pack.category} · {t.lobby.pack.words(pack.words?.length || 0)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const pack = packs.find((p) => p.id === id);
            return (
              <span
                key={id}
                className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm font-semibold text-white"
              >
                {pack ? `${pack.name} · ${t.lobby.pack.words(pack.words?.length || 0)}` : id}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
