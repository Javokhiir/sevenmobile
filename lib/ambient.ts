/**
 * Ambient bed for the experience. Everything is synthesised in the browser —
 * a slow detuned drone, a filtered noise wash and an occasional ping — so the
 * page ships no audio files and can start the moment the user hits INITIATE.
 */
export class Ambient {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioScheduledSourceNode[] = [];
  private pingTimer: number | null = null;

  private get Ctor() {
    return (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    );
  }

  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = new this.Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    // Drone: three detuned voices through a low shelf.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    filter.connect(master);

    [55, 82.5, 110].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? "triangle" : "sine";
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 6;

      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.05 : 0.12;

      // Slow amplitude drift so the bed never sits still.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.04;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();

      osc.connect(g).connect(filter);
      osc.start();
      this.nodes.push(osc, lfo);
    });

    // Noise wash — the "atmosphere".
    const len = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.value = 620;
    nf.Q.value = 0.6;
    const ng = ctx.createGain();
    ng.gain.value = 0.06;
    noise.connect(nf).connect(ng).connect(master);
    noise.start();
    this.nodes.push(noise);

    this.schedulePing();
    this.fade(0.5, 4);
  }

  /** Sparse telemetry blips, loosely timed. */
  private schedulePing() {
    const tick = () => {
      const ctx = this.ctx;
      const master = this.master;
      if (!ctx || !master) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880 + Math.random() * 660;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
      osc.connect(g).connect(master);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
      this.pingTimer = window.setTimeout(tick, 6000 + Math.random() * 9000);
    };
    this.pingTimer = window.setTimeout(tick, 5000);
  }

  private fade(to: number, seconds: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(to, ctx.currentTime + seconds);
  }

  setEnabled(on: boolean) {
    if (!this.ctx) {
      if (on) this.start();
      return;
    }
    void this.ctx.resume();
    this.fade(on ? 0.5 : 0, on ? 1.5 : 0.8);
  }

  dispose() {
    if (this.pingTimer) window.clearTimeout(this.pingTimer);
    this.nodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* already stopped */
      }
    });
    this.nodes = [];
    void this.ctx?.close();
    this.ctx = null;
  }
}
