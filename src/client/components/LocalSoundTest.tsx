import React, {useEffect, useRef, useState} from 'react';
import {audioService} from '../services/audioService.js';

const isLocalHost = (): boolean => {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
};

export const LocalSoundTest: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [playingSequence, setPlayingSequence] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopSequence = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setPlayingSequence(false);
  };

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  if (!isLocalHost()) return null;

  const play = async (effect: () => void) => {
    audioService.enableAudio();
    await audioService.prepareAudio();
    effect();
  };

  const startSequence = async () => {
    stopSequence();
    audioService.enableAudio();
    await audioService.prepareAudio();
    setPlayingSequence(true);
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= 9000) {
        setPlayingSequence(false);
        timeoutRef.current = null;
        return;
      }

      const interval = elapsed < 3000 ? 1500 : elapsed < 6000 ? 750 : 400;
      audioService.playTick();
      timeoutRef.current = setTimeout(tick, interval);
    };

    tick();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70]">
      {open ? (
        <section
          aria-label="Prueba local de sonidos"
          className="w-72 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-amber-300">Prueba de sonidos</h2>
            <button onClick={() => { stopSequence(); setOpen(false); }} aria-label="Cerrar" className="px-2 text-xl text-slate-300">×</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => void play(() => audioService.playTick())} className="rounded-xl bg-slate-800 px-3 py-3 text-sm font-semibold hover:bg-slate-700">Pitido</button>
            <button onClick={() => void play(() => audioService.playSuccess())} className="rounded-xl bg-slate-800 px-3 py-3 text-sm font-semibold hover:bg-slate-700">Éxito</button>
            <button onClick={() => void play(() => audioService.playFoulBuzzer())} className="rounded-xl bg-slate-800 px-3 py-3 text-sm font-semibold hover:bg-slate-700">Falta</button>
            <button onClick={() => void play(() => audioService.playExplosion())} className="rounded-xl bg-slate-800 px-3 py-3 text-sm font-semibold hover:bg-slate-700">Explosión</button>
          </div>
          <button
            onClick={() => playingSequence ? stopSequence() : void startSequence()}
            className="mt-2 w-full rounded-xl bg-amber-400 px-3 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"
          >
            {playingSequence ? 'Detener secuencia' : 'Probar ritmo por etapas'}
          </button>
          <p className="mt-2 text-xs text-slate-400">1,5 s → 0,75 s → 0,4 s</p>
        </section>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-amber-300 shadow-xl hover:bg-slate-800"
        >
          🔊 Probar sonidos
        </button>
      )}
    </div>
  );
};
