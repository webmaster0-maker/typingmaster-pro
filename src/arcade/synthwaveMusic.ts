export type SynthwavePlaybackState = 'idle' | 'grooving' | 'glitched' | 'stopped';

export interface SynthwaveMusicState {
  playbackState: SynthwavePlaybackState;
  activeLayer: 0 | 1 | 2 | 3;
  cleanWordStreak: number;
  cleanRecoveryChars: number;
  consecutiveErrors: number;
  targetBpm: number;
  targetFilterHz: number;
  detuneCents: number;
}

export const SYNTHWAVE_GROOVE_BPM = 112;
export const SYNTHWAVE_GLITCH_BPM = 78;
export const SYNTHWAVE_GROOVE_FILTER_HZ = 7500;
export const SYNTHWAVE_GLITCH_FILTER_HZ = 460;
export const SYNTHWAVE_RECOVERY_CHARS_REQUIRED = 3;

export function createSynthwaveMusicState(): SynthwaveMusicState {
  return {
    playbackState: 'idle',
    activeLayer: 0,
    cleanWordStreak: 0,
    cleanRecoveryChars: 0,
    consecutiveErrors: 0,
    targetBpm: 0,
    targetFilterHz: 0,
    detuneCents: 0,
  };
}

export function resetSynthwaveMusicState(): SynthwaveMusicState {
  return createSynthwaveMusicState();
}

function layerForCleanStreak(cleanWordStreak: number): 1 | 2 | 3 {
  if (cleanWordStreak >= 4) return 3;
  if (cleanWordStreak >= 2) return 2;
  return 1;
}

/**
 * Pure deterministic transition when the player types a correct character in Synthwave Pulse.
 */
export function onSynthwaveCorrectKey(state: SynthwaveMusicState): SynthwaveMusicState {
  if (state.playbackState === 'idle') {
    return {
      playbackState: 'grooving',
      activeLayer: 1,
      cleanWordStreak: state.cleanWordStreak,
      cleanRecoveryChars: 0,
      consecutiveErrors: 0,
      targetBpm: SYNTHWAVE_GROOVE_BPM,
      targetFilterHz: SYNTHWAVE_GROOVE_FILTER_HZ,
      detuneCents: 0,
    };
  }

  if (state.playbackState === 'glitched' || state.playbackState === 'stopped') {
    const nextRecovery = state.cleanRecoveryChars + 1;
    if (nextRecovery >= SYNTHWAVE_RECOVERY_CHARS_REQUIRED) {
      return {
        playbackState: 'grooving',
        activeLayer: 1,
        cleanWordStreak: 0,
        cleanRecoveryChars: 0,
        consecutiveErrors: 0,
        targetBpm: SYNTHWAVE_GROOVE_BPM,
        targetFilterHz: SYNTHWAVE_GROOVE_FILTER_HZ,
        detuneCents: 0,
      };
    }
    return {
      ...state,
      cleanRecoveryChars: nextRecovery,
    };
  }

  return {
    ...state,
    playbackState: 'grooving',
    activeLayer: Math.max(1, state.activeLayer) as 1 | 2 | 3,
    consecutiveErrors: 0,
    targetBpm: SYNTHWAVE_GROOVE_BPM,
    targetFilterHz: SYNTHWAVE_GROOVE_FILTER_HZ,
    detuneCents: 0,
  };
}

/**
 * Pure deterministic transition when the player completes a word in Synthwave Pulse.
 * Clean words build musical layers (1: Bass -> 2: +Drums -> 3: +Neon Arpeggio & Pad)
 * and immediately recover the groove if the track was muffled or stopped.
 */
export function onSynthwaveWordClear(
  state: SynthwaveMusicState,
  wordHadError: boolean = false
): SynthwaveMusicState {
  const nextStreak = wordHadError ? 0 : state.cleanWordStreak + 1;
  return {
    playbackState: 'grooving',
    activeLayer: layerForCleanStreak(nextStreak),
    cleanWordStreak: nextStreak,
    cleanRecoveryChars: 0,
    consecutiveErrors: 0,
    targetBpm: SYNTHWAVE_GROOVE_BPM,
    targetFilterHz: SYNTHWAVE_GROOVE_FILTER_HZ,
    detuneCents: 0,
  };
}

/**
 * Pure deterministic transition when the player mistypes in Synthwave Pulse.
 * First error muffles & glitches the rhythm; repeated errors stop the music completely.
 */
export function onSynthwaveError(state: SynthwaveMusicState): SynthwaveMusicState {
  const nextErrors = state.consecutiveErrors + 1;
  const shouldStop =
    state.playbackState === 'glitched' ||
    state.playbackState === 'stopped' ||
    nextErrors >= 2;

  if (shouldStop) {
    return {
      playbackState: 'stopped',
      activeLayer: 0,
      cleanWordStreak: 0,
      cleanRecoveryChars: 0,
      consecutiveErrors: nextErrors,
      targetBpm: 0,
      targetFilterHz: 0,
      detuneCents: -60,
    };
  }

  // First error: drop arpeggio (cap at layer 2), plunge filter cutoff, drag tempo & detune
  const degradedLayer = Math.max(1, Math.min(state.activeLayer, 2)) as 1 | 2;
  return {
    playbackState: 'glitched',
    activeLayer: degradedLayer,
    cleanWordStreak: 0,
    cleanRecoveryChars: 0,
    consecutiveErrors: nextErrors,
    targetBpm: SYNTHWAVE_GLITCH_BPM,
    targetFilterHz: SYNTHWAVE_GLITCH_FILTER_HZ,
    detuneCents: -38,
  };
}

// 4-bar A-minor outrun chord progression: Am -> F -> C -> G
interface SynthBarHarmony {
  bassHz: number;
  arpHz: [number, number, number, number];
  padHz: [number, number, number];
}

const PROGRESSION: SynthBarHarmony[] = [
  // Bar 0: Am
  {
    bassHz: 55.0, // A1
    arpHz: [220.0, 261.63, 329.63, 440.0], // A3, C4, E4, A4
    padHz: [220.0, 261.63, 329.63],
  },
  // Bar 1: F
  {
    bassHz: 43.65, // F1
    arpHz: [174.61, 220.0, 261.63, 349.23], // F3, A3, C4, F4
    padHz: [174.61, 220.0, 261.63],
  },
  // Bar 2: C
  {
    bassHz: 65.41, // C2
    arpHz: [261.63, 329.63, 392.0, 523.25], // C4, E4, G4, C5
    padHz: [261.63, 329.63, 392.0],
  },
  // Bar 3: G
  {
    bassHz: 49.0, // G1
    arpHz: [196.0, 246.94, 293.66, 392.0], // G3, B3, D4, G4
    padHz: [196.0, 246.94, 293.66],
  },
];

// Up-and-down 16-step arpeggio index pattern across the 4 chord tones
const ARP_PATTERN = [0, 1, 2, 3, 2, 1, 0, 2, 1, 2, 3, 2, 3, 2, 1, 0];

class SynthwaveMusicPlayer {
  private ctx: AudioContext | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private currentStep = 0;
  private state: SynthwaveMusicState = createSynthwaveMusicState();
  private muted = false;

  private ensureAudioGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (!this.masterFilter || !this.masterGain) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = SYNTHWAVE_GROOVE_FILTER_HZ;
        filter.Q.value = 1.1;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.0001;

        filter.connect(gain);
        gain.connect(this.ctx.destination);

        this.masterFilter = filter;
        this.masterGain = gain;
      }
      if (!this.noiseBuffer) {
        const sampleRate = this.ctx.sampleRate;
        const length = Math.floor(sampleRate * 0.4);
        const buf = this.ctx.createBuffer(1, length, sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buf;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Synchronize live audio synthesis with the reactive music state and mute preference.
   */
  sync(nextState: SynthwaveMusicState, muted: boolean): void {
    this.state = nextState;
    this.muted = muted;

    const shouldPlay =
      !muted &&
      (nextState.playbackState === 'grooving' || nextState.playbackState === 'glitched') &&
      nextState.activeLayer > 0;

    if (!shouldPlay) {
      this.haltScheduler(false);
      return;
    }

    const ctx = this.ensureAudioGraph();
    if (!ctx || !this.masterFilter || !this.masterGain) return;

    const now = ctx.currentTime;
    const targetCutoff =
      nextState.playbackState === 'glitched'
        ? SYNTHWAVE_GLITCH_FILTER_HZ
        : SYNTHWAVE_GROOVE_FILTER_HZ;
    const targetGain = nextState.playbackState === 'glitched' ? 0.2 : 0.26;

    this.masterFilter.frequency.cancelScheduledValues(now);
    this.masterFilter.frequency.setTargetAtTime(targetCutoff, now, 0.045);

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(targetGain, now, 0.04);

    if (!this.schedulerTimer) {
      this.nextStepTime = now + 0.025;
      this.schedulerTimer = setInterval(() => this.scheduleAhead(), 25);
    }
  }

  /**
   * Short digital stutter / vinyl glitch burst when the first error warps the groove.
   */
  triggerGlitchFx(muted: boolean): void {
    if (muted) return;
    const ctx = this.ensureAudioGraph();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(195, now);
      osc.frequency.setValueAtTime(132, now + 0.045);
      osc.frequency.exponentialRampToValueAtTime(86, now + 0.14);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Non-fatal audio error
    }
  }

  /**
   * Cassette / turntable power-down pitch drop when repeated errors halt the music.
   */
  triggerTapeStopFx(muted: boolean): void {
    this.haltScheduler(true);
    if (muted) return;
    const ctx = this.ensureAudioGraph();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.34);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.34);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      // Non-fatal audio error
    }
  }

  /**
   * Cleanly stop all scheduled playback and reset step position (pause, finish, exit, unmount).
   */
  stop(): void {
    this.state = resetSynthwaveMusicState();
    this.haltScheduler(true);
  }

  private haltScheduler(resetStep: boolean): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (resetStep) {
      this.currentStep = 0;
    }
    if (this.ctx && this.masterGain) {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(0.0001, now, 0.03);
      } catch {
        // Ignore
      }
    }
  }

  private scheduleAhead(): void {
    if (!this.ctx || !this.masterFilter || this.muted) return;
    const isGlitched = this.state.playbackState === 'glitched';
    const isGrooving = this.state.playbackState === 'grooving';
    if (!isGrooving && !isGlitched) return;

    const bpm = Math.max(60, this.state.targetBpm || SYNTHWAVE_GROOVE_BPM);
    const sixteenthSec = 60 / bpm / 4;
    const lookaheadSec = 0.11;

    while (this.nextStepTime < this.ctx.currentTime + lookaheadSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime, sixteenthSec);
      this.nextStepTime += sixteenthSec;
      this.currentStep = (this.currentStep + 1) % 64;
    }
  }

  private scheduleStep(step: number, time: number, sixteenthSec: number): void {
    if (!this.ctx || !this.masterFilter) return;

    const barIdx = Math.floor(step / 16) % PROGRESSION.length;
    const stepInBar = step % 16;
    const bar = PROGRESSION[barIdx];
    const isGlitched = this.state.playbackState === 'glitched';
    const detune = this.state.detuneCents;
    const layer = this.state.activeLayer;

    // Glitch stutter: drop selected steps and introduce slight rhythmic drag
    if (isGlitched && (stepInBar === 6 || stepInBar === 11 || stepInBar === 14)) {
      return;
    }
    const swingOffset = isGlitched && stepInBar % 2 === 1 ? sixteenthSec * 0.24 : 0;
    const t = time + swingOffset;

    // LAYER 1: Rolling 8th-note analog bassline
    if (layer >= 1 && stepInBar % 2 === 0) {
      const octaveBoost = stepInBar % 4 === 2 ? 2 : 1;
      const freq = bar.bassHz * octaveBoost;
      this.playBassNote(t, freq, sixteenthSec * 1.75, detune, isGlitched);
    }

    // LAYER 2: 80s Drum Machine (Kick + Gated Snare + 16th Hi-Hat)
    if (layer >= 2) {
      if (stepInBar % 4 === 0) {
        this.playKick(t, isGlitched);
      }
      if (stepInBar === 4 || stepInBar === 12) {
        this.playSnare(t, isGlitched);
      }
      if (!isGlitched || stepInBar % 2 === 0) {
        this.playHiHat(t, stepInBar % 2 === 1);
      }
    }

    // LAYER 3: Neon 16th-note Synth Arpeggio + Warm Bar Pad
    if (layer >= 3 && !isGlitched) {
      const arpFreq = bar.arpHz[ARP_PATTERN[stepInBar]];
      this.playArpNote(t, arpFreq, sixteenthSec * 0.88, detune);
      if (stepInBar === 0) {
        this.playWarmPad(t, bar.padHz, sixteenthSec * 15.2);
      }
    }
  }

  private playBassNote(
    time: number,
    freq: number,
    duration: number,
    detuneCents: number,
    isGlitched: boolean
  ): void {
    if (!this.ctx || !this.masterFilter) return;

    const saw = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    saw.type = 'sawtooth';
    saw.frequency.setValueAtTime(freq, time);
    saw.detune.setValueAtTime(detuneCents, time);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq, time);
    sub.detune.setValueAtTime(detuneCents, time);

    filter.type = 'lowpass';
    filter.Q.value = 3.2;
    filter.frequency.setValueAtTime(isGlitched ? 360 : 980, time);
    filter.frequency.exponentialRampToValueAtTime(isGlitched ? 150 : 240, time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.32, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    saw.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterFilter);

    saw.start(time);
    sub.start(time);
    saw.stop(time + duration + 0.02);
    sub.stop(time + duration + 0.02);
  }

  private playKick(time: number, isGlitched: boolean): void {
    if (!this.ctx || !this.masterFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGlitched ? 115 : 148, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.13);

    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playSnare(time: number, isGlitched: boolean): void {
    if (!this.ctx || !this.masterFilter || !this.noiseBuffer) return;

    // Gated noise burst
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isGlitched ? 900 : 1850, time);
    filter.Q.value = 0.85;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.24, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterFilter);

    noise.start(time);
    noise.stop(time + 0.17);

    // Body thump
    const body = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(195, time);
    body.frequency.exponentialRampToValueAtTime(95, time + 0.08);
    bodyGain.gain.setValueAtTime(0.18, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    body.connect(bodyGain);
    bodyGain.connect(this.masterFilter);
    body.start(time);
    body.stop(time + 0.1);
  }

  private playHiHat(time: number, accent: boolean): void {
    if (!this.ctx || !this.masterFilter || !this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(6800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(accent ? 0.095 : 0.045, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.masterFilter);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  private playArpNote(
    time: number,
    freq: number,
    duration: number,
    detuneCents: number
  ): void {
    if (!this.ctx || !this.masterFilter) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    osc1.detune.setValueAtTime(detuneCents - 5, time);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 2, time);
    osc2.detune.setValueAtTime(detuneCents + 6, time);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.value = 0.25;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.13, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(gain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gain);
    gain.connect(this.masterFilter);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.02);
    osc2.stop(time + duration + 0.02);
  }

  private playWarmPad(time: number, chordHz: [number, number, number], duration: number): void {
    if (!this.ctx || !this.masterFilter) return;

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.001, time);
    padGain.gain.linearRampToValueAtTime(0.055, time + 0.28);
    padGain.gain.setValueAtTime(0.055, time + Math.max(0.35, duration - 0.35));
    padGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(1600, time);

    padFilter.connect(padGain);
    padGain.connect(this.masterFilter);

    chordHz.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      osc.detune.setValueAtTime(idx === 1 ? 7 : -6, time);
      osc.connect(padFilter);
      osc.start(time);
      osc.stop(time + duration + 0.04);
    });
  }
}

export const synthwaveMusic = new SynthwaveMusicPlayer();
