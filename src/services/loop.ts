/**
 * LoopEngine — loop A-B preciso via requestAnimationFrame.
 *
 * Polling di currentTime a ~60fps: quando il video supera B, fa seek ad A.
 * Precisione ~16ms, molto migliore dell'evento 'timeupdate' (~250ms).
 */

import { VideoController } from './video';

type TimeGetter = () => number | undefined;

export class LoopEngine {
  private raf = 0;
  private running = false;

  constructor(private video: VideoController) {}

  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Avvia il loop. getA/getB sono letti ad ogni frame, cosi' lo spostamento
   * dei marker A/B ha effetto immediato senza riavviare l'engine.
   */
  start(getA: TimeGetter, getB: TimeGetter): void {
    this.stop();
    this.running = true;

    const tick = () => {
      if (!this.running) return;
      const a = getA();
      const b = getB();
      if (a != null && b != null && b > a && this.video.currentTime >= b) {
        this.video.seek(a);
      }
      this.raf = requestAnimationFrame(tick);
    };

    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }
}
