import { ArcadeModeId, SoundPackId } from './arcadeTypes';

class ArcadeAudioEngine {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playKeystroke(soundPack: SoundPackId, correct: boolean, mode: ArcadeModeId = 'classic', combo: number = 0) {
    if (soundPack === 'sound_muted') return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      if (!correct) {
        // Mode-flavored miss / shield impact crunch
        osc.type = 'sawtooth';
        const startFreq = mode === 'accuracy_master' ? 175 : 140;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(62, now + 0.09);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
      } else if (mode === 'accuracy_master') {
        // Precision emerald laser zap
        osc.type = soundPack === 'sound_thock' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.045);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      } else if (mode === 'challenge') {
        // Punchy railgun shot into Dreadnought hull
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + 0.055);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      } else if (mode === 'rhythm') {
        // Pentatonic synth pulse cycling cleanly with combo
        const pentatonic = [329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
        const freq = pentatonic[combo % pentatonic.length];
        osc.type = soundPack === 'sound_crystal' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      } else if (mode === 'speed_rush') {
        // Pitch climbs slightly with combo streak for exhilarating acceleration
        const boost = Math.min(240, combo * 5);
        osc.type = soundPack === 'sound_thock' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(420 + boost, now);
        osc.frequency.exponentialRampToValueAtTime(160 + boost * 0.4, now + 0.036);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      } else if (soundPack === 'sound_thock') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(85, now + 0.045);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      } else if (soundPack === 'sound_crystal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(760, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.038);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(490, now);
        osc.frequency.exponentialRampToValueAtTime(135, now + 0.036);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Non-fatal
    }
  }

  playWordClear(soundPack: SoundPackId, mode: ArcadeModeId) {
    if (soundPack === 'sound_muted') return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (mode === 'accuracy_master' || mode === 'challenge') {
        // Compact plasma detonation / hull crack boom
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      } else if (mode === 'speed_rush') {
        // Turbo gear-shift upsweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.11);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      } else {
        // Crisp vault / harmonic chord confirm
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }

  playCountdownTick(soundPack: SoundPackId, finalGo: boolean = false) {
    if (soundPack === 'sound_muted') return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(finalGo ? 880 : 440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (finalGo ? 0.16 : 0.08));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore
    }
  }

  playVictory(soundPack: SoundPackId) {
    if (soundPack === 'sound_muted') return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.065;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.11, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.27);
      });
    } catch {
      // Ignore
    }
  }

  playFightHit(soundPack: SoundPackId, isSpecial: boolean = false) {
    if (soundPack === 'sound_muted') return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Low punchy impact thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isSpecial ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(isSpecial ? 240 : 185, now);
      osc.frequency.exponentialRampToValueAtTime(46, now + (isSpecial ? 0.19 : 0.11));
      gain.gain.setValueAtTime(isSpecial ? 0.2 : 0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isSpecial ? 0.2 : 0.12));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);

      // Crisp upper snap for special combo attacks
      if (isSpecial) {
        const chime = ctx.createOscillator();
        const cg = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(660, now + 0.03);
        chime.frequency.exponentialRampToValueAtTime(1180, now + 0.16);
        cg.gain.setValueAtTime(0.09, now + 0.03);
        cg.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        chime.connect(cg);
        cg.connect(ctx.destination);
        chime.start(now + 0.03);
        chime.stop(now + 0.19);
      }
    } catch {
      // Ignore
    }
  }

  playFightBlock(soundPack: SoundPackId) {
    if (soundPack === 'sound_muted') return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.07);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }

  playFightCounter(soundPack: SoundPackId, isHeavy: boolean = false) {
    if (soundPack === 'sound_muted') return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isHeavy ? 145 : 175, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + (isHeavy ? 0.2 : 0.12));
      gain.gain.setValueAtTime(isHeavy ? 0.2 : 0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.22 : 0.13));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Ignore
    }
  }

  playFightKO(soundPack: SoundPackId, playerWon: boolean) {
    if (soundPack === 'sound_muted') return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = playerWon
        ? [440, 554.37, 659.25, 880]
        : [311.13, 277.18, 233.08, 174.61];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.085;
        osc.type = playerWon ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch {
      // Ignore
    }
  }
}

export const arcadeAudio = new ArcadeAudioEngine();
