// SoundManager — procedural Web Audio SFX with a concurrency cap + per-sound throttle (docs/60-implementation/
// sound-manager, docs/50-art-ux/sound-design). Each sound is synthesised from an oscillator (or short noise)
// + a fast gain envelope — no audio asset files. Sounds are a side effect (render-like): they never feed the
// simulation. Numbers come from balance.json(`sound`); the in-code DEFAULTS are the resilient fallback.
import balance from './data/balance.json';

export type SoundId =
  | 'uiPress' | 'toggle' | 'play' | 'popupOpen' | 'popupClose'
  | 'launch' | 'wall' | 'ballHit' | 'merge' | 'comboMilestone' | 'unlock';

interface SoundDef {
  type: 'sine' | 'triangle' | 'square' | 'sawtooth' | 'noise';
  freq: number;
  freq2?: number; // glide target over `dur` (rising/falling)
  dur: number; // seconds
  gain: number; // peak gain (0..1)
  throttleMs: number; // min interval between retriggers of this id
  priority: number; // higher = kept; low-priority voices are preempted/skipped first
}

interface SoundCfg {
  master: number;
  maxVoices: number;
  sounds: Record<SoundId, SoundDef>;
}

const DEFAULTS: SoundCfg = {
  master: 0.5,
  maxVoices: 6,
  sounds: {
    uiPress: { type: 'triangle', freq: 420, freq2: 540, dur: 0.07, gain: 0.18, throttleMs: 40, priority: 3 },
    toggle: { type: 'square', freq: 300, freq2: 380, dur: 0.05, gain: 0.12, throttleMs: 40, priority: 3 },
    play: { type: 'sawtooth', freq: 300, freq2: 720, dur: 0.22, gain: 0.2, throttleMs: 120, priority: 6 },
    popupOpen: { type: 'sine', freq: 520, freq2: 880, dur: 0.18, gain: 0.18, throttleMs: 100, priority: 6 },
    popupClose: { type: 'sine', freq: 720, freq2: 400, dur: 0.1, gain: 0.13, throttleMs: 80, priority: 4 },
    launch: { type: 'sawtooth', freq: 220, freq2: 540, dur: 0.14, gain: 0.17, throttleMs: 50, priority: 4 },
    wall: { type: 'noise', freq: 1200, dur: 0.05, gain: 0.16, throttleMs: 70, priority: 1 },
    ballHit: { type: 'noise', freq: 760, dur: 0.08, gain: 0.2, throttleMs: 55, priority: 1 },
    merge: { type: 'triangle', freq: 440, freq2: 660, dur: 0.16, gain: 0.22, throttleMs: 25, priority: 5 },
    comboMilestone: { type: 'square', freq: 660, freq2: 1320, dur: 0.3, gain: 0.2, throttleMs: 150, priority: 6 },
    unlock: { type: 'sine', freq: 523, freq2: 1046, dur: 0.4, gain: 0.24, throttleMs: 200, priority: 7 },
  },
};

// shallow-merge balance.json(`sound`) over the defaults so a partial/absent JSON block can't break audio.
const RAW = (balance as { sound?: Partial<SoundCfg> }).sound;
const CFG: SoundCfg = {
  master: RAW?.master ?? DEFAULTS.master,
  maxVoices: RAW?.maxVoices ?? DEFAULTS.maxVoices,
  sounds: { ...DEFAULTS.sounds, ...(RAW?.sounds as Record<SoundId, SoundDef> | undefined) },
};

const MUTE_KEY = 'ppm.muted';

interface Voice {
  priority: number;
  stop: () => void;
}

class SoundManager {
  private ctx?: AudioContext;
  private master?: GainNode;
  private noise?: AudioBuffer;
  private muted: boolean;
  private active = new Set<Voice>();
  private lastAt = new Map<SoundId, number>();
  private dbg: Record<string, { req: number; played: number; throttled: number; capped: number }> = {};

  constructor() {
    this.muted = (() => {
      try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
    })();
    // Browser autoplay policy: the AudioContext must be created/resumed from a user gesture.
    const unlock = () => this.ensureCtx();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    // Verification hook (not player-facing): per-sound disposition counters + context state.
    (window as unknown as { __sound: unknown }).__sound = {
      stats: () => this.dbg,
      muted: () => this.muted,
      ctxState: () => this.ctx?.state ?? 'none',
      active: () => this.active.size,
    };
  }

  private bump(id: SoundId, k: 'req' | 'played' | 'throttled' | 'capped') {
    (this.dbg[id] ??= { req: 0, played: 0, throttled: 0, capped: 0 })[k]++;
  }

  private ensureCtx() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : CFG.master;
      this.master.connect(this.ctx.destination);
    } catch {
      /* Web Audio unavailable — game runs silently */
    }
  }

  // Play a sound. `pitch` multiplies frequency (merge tier↑, launch power↑). Throttled + voice-capped.
  play(id: SoundId, opts?: { pitch?: number }) {
    if (this.muted) return;
    this.ensureCtx();
    if (!this.ctx || !this.master) return;
    const def = CFG.sounds[id];
    if (!def) return;
    this.bump(id, 'req');

    const now = performance.now();
    if (now - (this.lastAt.get(id) ?? -1e9) < def.throttleMs) { this.bump(id, 'throttled'); return; } // per-sound throttle

    if (this.active.size >= CFG.maxVoices) {
      // preempt the lowest-priority active voice that is STRICTLY below this sound; else skip.
      let victim: Voice | null = null;
      for (const v of this.active) if (v.priority < def.priority && (!victim || v.priority < victim.priority)) victim = v;
      if (victim) victim.stop();
      else { this.bump(id, 'capped'); return; }
    }

    this.lastAt.set(id, now);
    this.bump(id, 'played');
    this.spawn(def, opts?.pitch ?? 1);
  }

  private spawn(def: SoundDef, pitch: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.connect(this.master!);
    // fast attack → exponential decay to silence over `dur`
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(def.gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + def.dur);

    let src: AudioScheduledSourceNode;
    if (def.type === 'noise') {
      const n = ctx.createBufferSource();
      n.buffer = this.noiseBuffer(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = def.freq * pitch;
      bp.Q.value = 1.2;
      n.connect(bp);
      bp.connect(g);
      src = n;
    } else {
      const osc = ctx.createOscillator();
      osc.type = def.type;
      osc.frequency.setValueAtTime(def.freq * pitch, t);
      if (def.freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, def.freq2 * pitch), t + def.dur);
      osc.connect(g);
      src = osc;
    }

    const voice: Voice = { priority: def.priority, stop: () => { try { src.stop(); } catch { /* already stopped */ } } };
    this.active.add(voice);
    src.onended = () => this.active.delete(voice);
    src.start(t);
    src.stop(t + def.dur + 0.02);
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.3), ctx.sampleRate);
    const data = buf.getChannelData(0);
    let s = 22222;
    for (let i = 0; i < data.length; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff; // deterministic white noise
      data[i] = (s / 0x3fffffff) - 1;
    }
    this.noise = buf;
    return buf;
  }

  get isMuted() { return this.muted; }

  setMuted(b: boolean) {
    this.muted = b;
    try { localStorage.setItem(MUTE_KEY, b ? '1' : '0'); } catch { /* storage off */ }
    if (this.master) this.master.gain.value = b ? 0 : CFG.master;
  }

  toggleMuted() { this.setMuted(!this.muted); }
}

export const sound = new SoundManager();
