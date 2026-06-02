/**
 * Storage layer — unico punto di accesso a chrome.storage.local.
 *
 * Chiavi:
 *   yt:settings            -> Settings (globale)
 *   yt:video:<videoId>     -> VideoData (per video; videoId + markerData)
 */

import {
  DEFAULT_SETTINGS,
  Settings,
  VideoData,
  emptyVideoData,
} from '../types';

const SETTINGS_KEY = 'yt:settings';
const videoKey = (videoId: string) => `yt:video:${videoId}`;

function get<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (res) => resolve(res[key] as T | undefined));
  });
}

function set(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

export const store = {
  async getSettings(): Promise<Settings> {
    const s = await get<Partial<Settings>>(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...s };
  },

  async setSettings(settings: Settings): Promise<void> {
    await set(SETTINGS_KEY, settings);
  },

  async getVideoData(videoId: string): Promise<VideoData> {
    const data = await get<VideoData>(videoKey(videoId));
    if (!data) return emptyVideoData(videoId);
    // default-merge difensivo
    return {
      videoId,
      markers: data.markers ?? [],
      loopEnabled: data.loopEnabled ?? false,
    };
  },

  async setVideoData(data: VideoData): Promise<void> {
    await set(videoKey(data.videoId), data);
  },

  /** Notifica i cambi di Settings (es. popup aggiorna durata count-in). */
  onSettingsChange(cb: (settings: Settings) => void): () => void {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'local' || !changes[SETTINGS_KEY]) return;
      cb({ ...DEFAULT_SETTINGS, ...(changes[SETTINGS_KEY].newValue as Settings) });
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },
};
