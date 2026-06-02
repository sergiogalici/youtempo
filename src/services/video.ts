/**
 * VideoController — astrazione sull'elemento <video> di YouTube.
 *
 * Resilienza: dipende solo da document.querySelector('video') e dalle API
 * standard di HTMLMediaElement, mai da classi CSS interne di YouTube.
 */

export type VideoEvent = 'play' | 'pause' | 'timeupdate' | 'seeked' | 'loadedmetadata';

export class VideoController {
  constructor(private el: HTMLVideoElement) {}

  get element(): HTMLVideoElement {
    return this.el;
  }

  get currentTime(): number {
    return this.el.currentTime;
  }

  get duration(): number {
    return this.el.duration;
  }

  get paused(): boolean {
    return this.el.paused;
  }

  play(): Promise<void> {
    return this.el.play();
  }

  pause(): void {
    this.el.pause();
  }

  seek(time: number): void {
    this.el.currentTime = Math.max(0, time);
  }

  on(event: VideoEvent, cb: () => void): () => void {
    this.el.addEventListener(event, cb);
    return () => this.el.removeEventListener(event, cb);
  }

  /** L'elemento <video> e' ancora attaccato al DOM? */
  get isConnected(): boolean {
    return this.el.isConnected;
  }
}

/**
 * Attende che il tag <video> del player sia presente nel DOM.
 * YouTube monta il player in modo asincrono e lo riusa tra le navigazioni SPA.
 */
export function waitForVideo(timeoutMs = 15000): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLVideoElement>('video');
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector<HTMLVideoElement>('video');
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error('YouTempo: <video> non trovato entro il timeout'));
    }, timeoutMs);
  });
}
