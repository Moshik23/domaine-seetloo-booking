"use client";

let audioContext: AudioContext | null = null;

/**
 * A short, gentle two-tone chime — deliberately not a harsh buzzer, since
 * staff are often on the phone with the customer when a clash is found.
 * Synthesized rather than an audio file so there's nothing to host or license.
 */
export function playConflictChime() {
  try {
    if (!audioContext) audioContext = new AudioContext();
    const ctx = audioContext;
    void ctx.resume();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.15, now + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };

    playTone(660, 0, 0.15);
    playTone(880, 0.14, 0.2);
  } catch {
    // best-effort only — never let a sound failure disrupt the booking flow
  }
}
