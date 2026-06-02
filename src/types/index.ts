/**
 * Modello dati unificato di YouTempo.
 *
 * Il Marker e' la primitiva fondamentale del prodotto: i marker normali
 * ('point') e gli estremi del loop ('loop-a' / 'loop-b') vivono nello stesso
 * store. Count-in, loop e future funzioni ruotano attorno a questo modello.
 */

export type MarkerRole = 'point' | 'loop-a' | 'loop-b';

export interface Marker {
  /** id univoco del marker */
  id: string;
  /** posizione nel video, in secondi */
  time: number;
  /** etichetta opzionale: "Intro", "Solo", "Difficult lick", ... */
  name?: string;
  /** 'point' = marker normale; 'loop-a'/'loop-b' = estremi del loop A-B */
  role: MarkerRole;
  /** timestamp di creazione (ms epoch) */
  createdAt: number;
}

export interface VideoData {
  /** id del video YouTube (parametro ?v=) */
  videoId: string;
  /** include sia i 'point' sia 'loop-a'/'loop-b' (modello unificato) */
  markers: Marker[];
  /** se true e A<B esistono, il loop e' attivo */
  loopEnabled: boolean;
}

export type CountInSeconds = 3 | 5 | 10;

export interface Settings {
  countInSeconds: CountInSeconds;
}

export const DEFAULT_SETTINGS: Settings = { countInSeconds: 5 };

export const COUNT_IN_OPTIONS: CountInSeconds[] = [3, 5, 10];

export function emptyVideoData(videoId: string): VideoData {
  return { videoId, markers: [], loopEnabled: false };
}
