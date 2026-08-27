import { noteMidi, STEPS_PER_BAR } from './state';
import type { Song } from './types';

function varInt(value: number): number[] {
  const bytes = [value & 0x7f];
  while ((value >>= 7)) bytes.unshift((value & 0x7f) | 0x80);
  return bytes;
}

function u32(value: number): number[] {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}

export function midiBytes(song: Song): Uint8Array {
  const ticksPerQuarter = 480;
  const ticksPerStep = ticksPerQuarter / 4;
  const events: { tick: number; bytes: number[]; order: number }[] = [];
  const programs = { lantern: 10, reed: 71, bell: 14, pluck: 45 } as const;
  const channels = { lantern: 0, reed: 1, bell: 2, pluck: 3 } as const;
  Object.entries(programs).forEach(([voice, program]) => events.push({ tick: 0, bytes: [0xc0 | channels[voice as keyof typeof channels], program], order: 0 }));
  song.notes.forEach(note => {
    const drum = note.voice === 'kick' || note.voice === 'clap';
    const channel = drum ? 9 : channels[note.voice as keyof typeof channels];
    const pitch = drum ? (note.voice === 'kick' ? 36 : 39) : noteMidi(song, note.row);
    const tick = note.step * ticksPerStep;
    events.push({ tick, bytes: [0x90 | channel, pitch, 100], order: 1 });
    events.push({ tick: tick + ticksPerStep, bytes: [0x80 | channel, pitch, 0], order: 0 });
  });
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const micros = Math.round(60_000_000 / song.tempo);
  const track: number[] = [0, 0xff, 0x51, 3, (micros >> 16) & 255, (micros >> 8) & 255, micros & 255];
  let previous = 0;
  events.forEach(event => {
    track.push(...varInt(event.tick - previous), ...event.bytes);
    previous = event.tick;
  });
  const endTick = song.bars * STEPS_PER_BAR * ticksPerStep;
  track.push(...varInt(Math.max(0, endTick - previous)), 0xff, 0x2f, 0);
  return new Uint8Array([
    ...Array.from(new TextEncoder().encode('MThd')), ...u32(6), 0, 0, 0, 1, (ticksPerQuarter >> 8) & 255, ticksPerQuarter & 255,
    ...Array.from(new TextEncoder().encode('MTrk')), ...u32(track.length), ...track
  ]);
}

export function midiBlob(song: Song): Blob {
  const bytes = midiBytes(song);
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/midi' });
}
