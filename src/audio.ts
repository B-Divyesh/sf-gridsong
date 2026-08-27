import { melodicRows, noteMidi, STEPS_PER_BAR } from './state';
import type { Song, SongNote, VoiceName } from './types';

type AudioContextLike = AudioContext | OfflineAudioContext;

const VOICE_GAIN: Record<VoiceName, number> = { lantern: 0.16, reed: 0.1, bell: 0.13, pluck: 0.11 };

function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function scheduleMelody(ctx: AudioContextLike, destination: AudioNode, time: number, duration: number, midi: number, voice: VoiceName): void {
  const gain = ctx.createGain();
  const oscillator = ctx.createOscillator();
  const hz = frequency(midi);
  oscillator.frequency.setValueAtTime(hz, time);
  oscillator.type = voice === 'lantern' ? 'sine' : voice === 'reed' ? 'square' : voice === 'bell' ? 'sine' : 'sawtooth';
  const level = VOICE_GAIN[voice];
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(level, time + (voice === 'bell' ? 0.008 : 0.025));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.08, duration * (voice === 'pluck' ? 0.55 : 0.9)));
  if (voice === 'bell') {
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(hz * 2.01, time);
    shimmerGain.gain.setValueAtTime(0.04, time);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.7);
    shimmer.connect(shimmerGain).connect(destination);
    shimmer.start(time);
    shimmer.stop(time + duration);
  }
  oscillator.connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + duration);
}

function scheduleKick(ctx: AudioContextLike, destination: AudioNode, time: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(135, time);
  oscillator.frequency.exponentialRampToValueAtTime(44, time + 0.13);
  gain.gain.setValueAtTime(0.32, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
  oscillator.connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + 0.21);
}

function scheduleClap(ctx: AudioContextLike, destination: AudioNode, time: number): void {
  const frameCount = Math.max(1, Math.round(ctx.sampleRate * 0.08));
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = 1100;
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  source.connect(filter).connect(gain).connect(destination);
  source.start(time);
}

export function scheduleNote(ctx: AudioContextLike, destination: AudioNode, song: Song, note: SongNote, time: number, stepDuration: number): void {
  if (note.voice === 'kick') scheduleKick(ctx, destination, time);
  else if (note.voice === 'clap') scheduleClap(ctx, destination, time);
  else scheduleMelody(ctx, destination, time, stepDuration, noteMidi(song, note.row), note.voice);
}

export class Player {
  private context: AudioContext | null = null;
  private timer = 0;
  private nextTime = 0;
  private currentStep = 0;
  private playing = false;
  private song: Song | null = null;
  private onStep: (step: number) => void = () => undefined;

  async start(song: Song, onStep: (step: number) => void, fromStep = 0): Promise<void> {
    this.stop();
    this.context ??= new AudioContext();
    await this.context.resume();
    this.song = structuredClone(song);
    this.onStep = onStep;
    this.currentStep = fromStep;
    this.nextTime = this.context.currentTime + 0.06;
    this.playing = true;
    this.scheduler();
    this.timer = window.setInterval(() => this.scheduler(), 25);
  }

  private scheduler(): void {
    if (!this.context || !this.song || !this.playing) return;
    const duration = 60 / this.song.tempo / 4;
    while (this.nextTime < this.context.currentTime + 0.12) {
      const step = this.currentStep;
      this.song.notes.filter(note => note.step === step).forEach(note => scheduleNote(this.context!, this.context!.destination, this.song!, note, this.nextTime, duration));
      const wait = Math.max(0, (this.nextTime - this.context.currentTime) * 1000);
      window.setTimeout(() => this.onStep(step), wait);
      this.nextTime += duration;
      this.currentStep = (this.currentStep + 1) % (this.song.bars * STEPS_PER_BAR);
    }
  }

  stop(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
    this.playing = false;
  }

  get isPlaying(): boolean { return this.playing; }
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
}

export async function renderWav(song: Song): Promise<Blob> {
  const stepDuration = 60 / song.tempo / 4;
  const seconds = song.bars * STEPS_PER_BAR * stepDuration + 0.5;
  const sampleRate = 44100;
  const context = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  const master = context.createGain();
  master.gain.value = 0.72;
  master.connect(context.destination);
  song.notes.forEach(note => scheduleNote(context, master, song, note, note.step * stepDuration, stepDuration));
  const rendered = await context.startRendering();
  const length = rendered.length;
  const buffer = new ArrayBuffer(44 + length * 4);
  const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + length * 4, true);
  writeAscii(view, 8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, length * 4, true);
  const left = rendered.getChannelData(0);
  const right = rendered.getChannelData(1);
  let offset = 44;
  for (let i = 0; i < length; i++) {
    view.setInt16(offset, Math.max(-1, Math.min(1, left[i])) * 0x7fff, true);
    view.setInt16(offset + 2, Math.max(-1, Math.min(1, right[i])) * 0x7fff, true);
    offset += 4;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export function songDuration(song: Song): number {
  return song.bars * 4 * 60 / song.tempo;
}

export function noteName(song: Song, row: number): string {
  if (row === melodicRows(song)) return 'Kick drum';
  if (row === melodicRows(song) + 1) return 'Clap';
  const names = ['C', 'C sharp', 'D', 'D sharp', 'E', 'F', 'F sharp', 'G', 'G sharp', 'A', 'A sharp', 'B'];
  const midi = noteMidi(song, row);
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}
