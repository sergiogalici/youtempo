/**
 * CountdownOverlay — overlay full-screen per il count-in.
 *
 * Shadow DOM isolato: nessuna interferenza con il CSS di YouTube. Mostra un
 * numero grande centrato. show(n) / hide().
 */

export class CountdownOverlay {
  private host: HTMLDivElement;
  private numberEl: HTMLDivElement;

  constructor() {
    this.host = document.createElement('div');
    this.host.id = 'youtempo-overlay-host';
    this.host.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;pointer-events:none;display:none;';

    const shadow = this.host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .backdrop {
        position: fixed; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.55);
        font-family: 'YouTube Sans', Roboto, Arial, sans-serif;
      }
      .num {
        color: #fff;
        font-size: clamp(120px, 28vw, 360px);
        font-weight: 800;
        line-height: 1;
        text-shadow: 0 6px 40px rgba(0,0,0,0.6);
        animation: pop 1s ease-out;
      }
      @keyframes pop {
        0%   { transform: scale(0.6); opacity: 0; }
        20%  { transform: scale(1.0); opacity: 1; }
        100% { transform: scale(0.92); opacity: 0.85; }
      }
    `;
    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop';
    this.numberEl = document.createElement('div');
    this.numberEl.className = 'num';
    backdrop.appendChild(this.numberEl);
    shadow.append(style, backdrop);

    document.body.appendChild(this.host);
  }

  show(n: number): void {
    this.numberEl.textContent = String(n);
    // re-trigger dell'animazione
    this.numberEl.style.animation = 'none';
    void this.numberEl.offsetWidth;
    this.numberEl.style.animation = '';
    this.host.style.display = 'block';
  }

  hide(): void {
    this.host.style.display = 'none';
  }

  destroy(): void {
    this.host.remove();
  }
}
