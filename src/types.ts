export type ScaleName = 'major' | 'minor' | 'pentatonic' | 'chromatic';
export type VoiceName = 'lantern' | 'reed' | 'bell' | 'pluck';

export interface SongNote {
  step: number;
  row: number;
  voice: VoiceName | 'kick' | 'clap';
}

export interface Song {
  v: 1;
  title: string;
  tempo: number;
  bars: number;
  octaves: number;
  scale: ScaleName;
  notes: SongNote[];
}

export interface GalleryEntry {
  id: string;
  nickname: string;
  createdAt: number;
  song: Song;
}

export interface Gallery {
  code: string;
  createdAt: number;
  entries: GalleryEntry[];
}
