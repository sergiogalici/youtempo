/**
 * CountIn — il "Practice Start".
 *
 * Mette in pausa il video, esegue un countdown configurabile sull'overlay,
 * poi fa partire la riproduzione. Pensato per dare al musicista il tempo di
 * tornare allo strumento.
 */

import { CountInSeconds } from '../types';
import { CountdownOverlay } from '../content/overlay';
import { VideoController } from './video';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class CountIn {
  private active = false;

  constructor(
    private video: VideoController,
    private overlay: CountdownOverlay,
  ) {}

  get isActive(): boolean {
    return this.active;
  }

  /** Esegue il count-in. Se gia' attivo, ignora (no doppio avvio). */
  async run(seconds: CountInSeconds): Promise<void> {
    if (this.active) return;
    this.active = true;
    try {
      this.video.pause();
      for (let n = seconds; n > 0; n--) {
        this.overlay.show(n);
        await sleep(1000);
      }
      this.overlay.hide();
      await this.video.play();
    } finally {
      this.overlay.hide();
      this.active = false;
    }
  }
}
