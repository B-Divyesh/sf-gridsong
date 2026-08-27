import { decodeSong, encodeSong } from './state';
import type { Gallery, Song } from './types';

export interface TeacherGallery extends Gallery { teacherKey: string; studentKey: string; }

export class GalleryApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

interface WireGallery { id: string; createdAt: number; expiresAt: number; entries: Array<{ id: string; nickname: string; createdAt: number; song: string }>; }

function validGallery(value: unknown): value is WireGallery {
  if (!value || typeof value !== 'object') return false;
  const gallery = value as Partial<WireGallery>;
  return typeof gallery.id === 'string' && typeof gallery.createdAt === 'number' && typeof gallery.expiresAt === 'number' && Array.isArray(gallery.entries);
}

function fromWire(value: unknown): Gallery {
  if (!validGallery(value)) throw new GalleryApiError(502, 'The class gallery sent an unexpected reply. Please try again.');
  try {
    return {
      id: value.id,
      createdAt: value.createdAt,
      expiresAt: value.expiresAt,
      entries: value.entries.map(entry => ({ id: entry.id, nickname: entry.nickname, createdAt: entry.createdAt, song: decodeSong(entry.song) }))
    };
  } catch {
    throw new GalleryApiError(502, 'One class song could not be read safely. Please try again.');
  }
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try { response = await fetch(`/api${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init.headers ?? {}) }, cache: 'no-store' }); }
  catch { throw new GalleryApiError(0, 'The class gallery is offline. Reconnect and try again.'); }
  const data = await response.json().catch(() => ({})) as { error?: unknown };
  if (!response.ok) {
    const fallback = response.status === 410 ? 'This class gallery has closed. Ask your teacher for a new class pass.' : response.status === 429 ? 'That is a lot of tries at once. Wait a minute, then try again.' : 'The class gallery could not finish that. Please try again.';
    throw new GalleryApiError(response.status, typeof data.error === 'string' ? data.error : fallback);
  }
  return data;
}

export async function createGallery(): Promise<TeacherGallery> {
  const value = await request('/galleries', { method: 'POST', body: '{}' }) as Partial<WireGallery & { teacherKey: string; studentKey: string }>;
  const gallery = fromWire(value);
  if (typeof value.teacherKey !== 'string' || typeof value.studentKey !== 'string') throw new GalleryApiError(502, 'The class gallery could not be created. Please try again.');
  return { ...gallery, teacherKey: value.teacherKey, studentKey: value.studentKey };
}

export async function fetchGallery(id: string, teacherKey: string): Promise<Gallery> {
  return fromWire(await request(`/galleries/${encodeURIComponent(id)}`, { headers: { 'x-gridsong-teacher-key': teacherKey } }));
}

export async function submitToGallery(invite: { galleryId: string; submitKey: string }, nickname: string, song: Song): Promise<void> {
  await request(`/galleries/${encodeURIComponent(invite.galleryId)}/submissions`, { method: 'POST', body: JSON.stringify({ submitKey: invite.submitKey, nickname, song: encodeSong(song) }) });
}

export async function removeGalleryEntry(galleryId: string, entryId: string, teacherKey: string): Promise<void> {
  await request(`/galleries/${encodeURIComponent(galleryId)}/submissions/${encodeURIComponent(entryId)}`, { method: 'DELETE', headers: { 'x-gridsong-teacher-key': teacherKey } });
}
