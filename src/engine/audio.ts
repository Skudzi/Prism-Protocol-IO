import { WeaponId } from '../game/types';

class SynthAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;
  public volume = 0.7;

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;
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
    return this.ctx;
  }

  public playLaser(weaponId: WeaponId) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pitchJitter = 0.94 + Math.random() * 0.12;

    if (weaponId === 'helios_rail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(980 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.24);
      gain.gain.setValueAtTime(0.22 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.27);
    } else if (weaponId === 'volt_scatter') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(420 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.16);
      gain.gain.setValueAtTime(0.18 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (weaponId === 'arc_repeater') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(760 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.065);
      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.075);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(640 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.1);
      gain.gain.setValueAtTime(0.14 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  }

  public playHitMarker(isElimination = false, isHeadshot = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isHeadshot ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 1480 : isElimination ? 1320 : 880, now);
    if (isHeadshot || isElimination) {
      osc.frequency.setValueAtTime(isHeadshot ? 2093 : 1760, now + 0.055);
    }
    gain.gain.setValueAtTime((isHeadshot || isElimination ? 0.22 : 0.12) * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isElimination ? 0.18 : 0.1));
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (isElimination ? 0.19 : 0.11));
  }

  public playJumpPad() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.22);
    gain.gain.setValueAtTime(0.16 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playEasterEggChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t0 = now + idx * 0.09;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.18 * this.volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.46);
    });
  }

  public playDash() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
    gain.gain.setValueAtTime(0.11 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playHealPickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t0 = now + idx * 0.06;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.15 * this.volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.26);
    });
  }

  public playReload() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Two-stage magazine eject + chamber lock click
    [
      { t: 0, f0: 280, f1: 140, d: 0.08 },
      { t: 0.22, f0: 420, f1: 680, d: 0.09 },
    ].forEach((stage) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t0 = now + stage.t;
      osc.frequency.setValueAtTime(stage.f0, t0);
      osc.frequency.exponentialRampToValueAtTime(stage.f1, t0 + stage.d);
      gain.gain.setValueAtTime(0.14 * this.volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + stage.d + 0.01);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + stage.d + 0.02);
    });
  }
}

export const soundEngine = new SynthAudioEngine();
