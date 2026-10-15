export class AudioService {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private readonly sounds = new Map<string, AudioBuffer>();
  private readonly loadingSounds = new Map<string, Promise<void>>();
  private isMuted: boolean = false;

  public enableAudio(): void {
    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (ctx) {
      void this.loadSounds(ctx);
    }
  }

  /** Resume audio and wait for local sound assets before the sound test plays them. */
  public async prepareAudio(): Promise<void> {
    const ctx = this.initContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    await this.loadSounds(ctx);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /** Play the tick asset. Urgency comes from tick spacing, not a rising pitch. */
  public playTick(_frequencyHz = 800, durationMs = 45): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (this.playAsset(ctx, 'tick', 0.8)) return;

    try {
      const now = ctx.currentTime;
      const duration = durationMs / 1000;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1300, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.13, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.output(ctx));
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio playback suppressed by browser policy
    }
  }

  /** Play the explosion asset for timer detonation. */
  public playExplosion(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    if (this.playAsset(ctx, 'explosion')) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.9;
      const osc = ctx.createOscillator();
      const body = ctx.createGain();
      const lowpass = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + duration);
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(900, now);
      lowpass.frequency.exponentialRampToValueAtTime(140, now + duration);
      body.gain.setValueAtTime(0.001, now);
      body.gain.linearRampToValueAtTime(0.28, now + 0.012);
      body.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(lowpass);
      lowpass.connect(body);
      body.connect(this.output(ctx));
      osc.start(now);
      osc.stop(now + duration);

      // A short filtered noise burst gives the detonation a crisp attack.
      const noise = ctx.createBufferSource();
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      noise.buffer = this.getNoiseBuffer(ctx);
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 0.35);
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.output(ctx));
      noise.start(now);
      noise.stop(now + 0.35);
    } catch {
      // Ignored
    }
  }

  /** Synthesize a short success jingle when a round or turn starts. */
  public playSuccess(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Three individually enveloped notes make the arpeggio read clearly.
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const start = now + index * 0.085;
        const duration = index === 2 ? 0.32 : 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(index === 2 ? 0.17 : 0.12, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(this.output(ctx));
        osc.start(start);
        osc.stop(start + duration);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Foul buzzer sound when a foul is triggered.
   */
  public playFoulBuzzer(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'square';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.setValueAtTime(140, now + 0.12);
      osc.frequency.setValueAtTime(190, now + 0.24);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.008);
      gain.gain.setValueAtTime(0.16, now + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.output(ctx));
      osc.start(now);
      osc.stop(now + 0.42);
    } catch {
      // Ignored
    }
  }

  private initContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      try {
        this.ctx = new AudioContextClass();
      } catch {
        this.ctx = null;
      }
    }
    return this.ctx;
  }

  private output(ctx: AudioContext): AudioNode {
    if (!this.master) {
      const compressor = ctx.createDynamicsCompressor();
      this.master = ctx.createGain();
      this.master.gain.value = 0.72;
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.18;
      this.master.connect(compressor);
      compressor.connect(ctx.destination);
    }
    return this.master;
  }

  private loadSounds(ctx: AudioContext): Promise<void> {
    return Promise.all([
      this.loadSound(ctx, 'tick', '/sounds/beep-02.wav'),
      this.loadSound(ctx, 'explosion', '/sounds/boom.mp3'),
    ]).then(() => {});
  }

  private loadSound(ctx: AudioContext, name: string, url: string): Promise<void> {
    if (this.sounds.has(name)) return Promise.resolve();
    const pending = this.loadingSounds.get(name);
    if (pending) return pending;

    const loading = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load sound: ${url}`);
        return response.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => { this.sounds.set(name, buffer); })
      .catch(() => {
        // Keep the procedural effect as a fallback if an asset cannot be loaded.
      })
      .finally(() => this.loadingSounds.delete(name));
    this.loadingSounds.set(name, loading);
    return loading;
  }

  private playAsset(ctx: AudioContext, name: string, playbackRate = 1): boolean {
    const buffer = this.sounds.get(name);
    if (!buffer) return false;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      source.connect(this.output(ctx));
      source.start();
      return true;
    } catch {
      return false;
    }
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }
}

export const audioService = new AudioService();
