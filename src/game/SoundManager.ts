export class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private running = false;

  init(): void {
    try {
      this.ctx = new AudioContext();
    } catch {
      // no audio available
    }
  }

  private ensureResumed(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startEngine(): void {
    if (!this.ctx || this.running) return;
    this.ensureResumed();
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
    this.engineGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();
    this.running = true;
  }

  updateEngine(rpm: number): void {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const freq = 60 + (rpm / 100) * 200;
    const vol = 0.02 + (rpm / 100) * 0.04;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
  }

  stopEngine(): void {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    try {
      this.engineGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      this.engineOsc.stop(this.ctx.currentTime + 0.3);
    } catch {}
    this.running = false;
    this.engineOsc = null;
    this.engineGain = null;
  }

  playBoost(): void {
    if (!this.ctx) return;
    this.ensureResumed();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playTrap(): void {
    if (!this.ctx) return;
    this.ensureResumed();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playShield(): void {
    if (!this.ctx) return;
    this.ensureResumed();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playOverheat(): void {
    if (!this.ctx) return;
    this.ensureResumed();
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      const t = this.ctx.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(200, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  playLapComplete(): void {
    if (!this.ctx) return;
    this.ensureResumed();
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      const t = this.ctx!.currentTime + i * 0.12;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  playWin(): void {
    if (!this.ctx) return;
    this.ensureResumed();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      const t = this.ctx!.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }
}
