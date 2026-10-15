import React, {useState} from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {PlayLayout} from './PlayLayout.js';
import {ToolsBar} from './ToolsBar.js';
import {WireCounter} from './TurnStatus.js';
import {useFreezeCountdown} from '../../hooks/useFreezeCountdown.js';

export const ActiveGiverView: React.FC = () => {
  const { currentTurn, game, guessSuccess, lastTick } = useGame();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);

  const turn = currentTurn ?? game?.currentTurn;
  const word = turn?.currentWord || t.game.holder.loadingWire;
  const { frozen, secondsLeft } = useFreezeCountdown(turn);

  const handleGuessSuccess = async () => {
    if (submitting || frozen) return;
    setSubmitting(true);
    await guessSuccess();
    setSubmitting(false);
  };

  const isFastPulsing = (lastTick?.intervalMs ?? 1000) <= 400;

  return (
    <PlayLayout
      banner={
        <span
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wide border ${
            isFastPulsing
              ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
        >
          {t.game.holder.banner}
        </span>
      }
      footer={
        <>
          <ToolsBar />
          {frozen ? (
            // Inhibidor: el botón se ve congelado y no responde
            <button
              disabled
              aria-disabled
              className="w-full min-h-[72px] px-6 bg-gradient-to-br from-cyan-100 via-sky-200 to-cyan-300 text-sky-900 font-black text-xl rounded-2xl shadow-xl shadow-cyan-300/30 border-2 border-white/80 ring-4 ring-cyan-200/30 uppercase tracking-wide flex items-center justify-center gap-3 select-none cursor-not-allowed"
            >
              <span className="text-2xl animate-pulse" aria-hidden>❄️</span>
              <span className="tabular-nums">{t.game.holder.frozen(secondsLeft)}</span>
            </button>
          ) : (
            <button
              onClick={handleGuessSuccess}
              disabled={submitting}
              className="w-full min-h-[72px] px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 active:from-emerald-400 active:to-emerald-500 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-black text-xl rounded-2xl shadow-xl shadow-emerald-500/30 border border-emerald-400/50 transition-all uppercase tracking-wide flex items-center justify-center gap-3 select-none"
            >
              <span className="text-2xl">✂️</span>
              <span>{t.game.holder.cutWire}</span>
            </button>
          )}
        </>
      }
    >
      <WordCard word={word} category={turn?.category} urgent={isFastPulsing} tone="amber">
        <WireCounter turn={turn} />
      </WordCard>
    </PlayLayout>
  );
};

const TONE = {
  amber: 'border-amber-500/60',
  sky: 'border-sky-500/50',
} as const;

/** El cable en grande, con la categoría pequeña debajo. Lo usan artificiero y saboteadores. */
export const WordCard: React.FC<{
  word: string;
  category?: string;
  urgent?: boolean;
  tone: keyof typeof TONE;
  children?: React.ReactNode;
}> = ({ word, category, urgent = false, tone, children }) => (
  <div
    className={`w-full bg-slate-900 border-2 rounded-3xl px-5 py-10 text-center flex flex-col items-center gap-3 transition-colors duration-300 ${
      urgent ? 'border-rose-500 ring-4 ring-rose-500/20' : TONE[tone]
    }`}
  >
    {children}
    <h2 className="text-[clamp(2rem,11vw,3.5rem)] leading-tight font-black text-white tracking-wide break-words select-none uppercase w-full">
      {word}
    </h2>
    {category && <span className="text-sm font-semibold text-slate-400">{category}</span>}
  </div>
);
