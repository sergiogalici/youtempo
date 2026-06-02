/**
 * Panel — barra controlli in-page (Shadow DOM).
 *
 * Sempre visibile sopra il player, isolata dal CSS di YouTube. Pochi click,
 * pulsanti grandi: pensata per essere usata con lo strumento in mano.
 *
 * Controlli: Practice Start, Set A / Set B, Loop on/off, + Marker, lista chip.
 */

import { MarkerService } from '../services/markers';
import { VideoController } from '../services/video';

export function fmtTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PanelDeps {
  video: VideoController;
  markers: MarkerService;
  onPracticeStart: () => void;
}

const STYLE = `
  :host { all: initial; }
  .bar {
    position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%);
    z-index: 2147483646;
    display: flex; flex-direction: column; gap: 8px;
    background: rgba(20,20,22,0.96);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 10px 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    font-family: 'YouTube Sans', Roboto, Arial, sans-serif;
    color: #fff;
    max-width: min(720px, 92vw);
  }
  .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  button {
    all: unset; cursor: pointer;
    font-size: 13px; font-weight: 600;
    padding: 8px 12px; border-radius: 9px;
    background: #2b2b30; color: #fff;
    transition: background .12s ease, transform .05s ease;
    user-select: none; white-space: nowrap;
  }
  button:hover { background: #3a3a42; }
  button:active { transform: scale(0.96); }
  .primary { background: #ff0033; }
  .primary:hover { background: #e60030; }
  .ab { background: #1f6feb; }
  .ab:hover { background: #2f7ffb; }
  .loop.on { background: #1f9d55; }
  .loop.on:hover { background: #25b061; }
  .muted { color: #aaa; font-size: 12px; }
  .badge {
    font-size: 11px; font-weight: 700; color: #cfe; padding: 2px 6px;
    background: rgba(31,111,235,0.18); border-radius: 6px;
  }
  .chips { display: flex; gap: 6px; flex-wrap: wrap; max-height: 92px; overflow-y: auto; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: #2b2b30; border-radius: 999px; padding: 4px 6px 4px 10px;
    font-size: 12px;
  }
  .chip .t { cursor: pointer; font-variant-numeric: tabular-nums; }
  .chip .t:hover { color: #6cf; }
  .chip .name { color: #ddd; }
  .chip .x {
    cursor: pointer; width: 18px; height: 18px; line-height: 18px;
    text-align: center; border-radius: 50%; background: rgba(255,255,255,0.08);
    font-size: 12px; color: #bbb;
  }
  .chip .x:hover { background: #ff0033; color: #fff; }
  .sep { width: 1px; align-self: stretch; background: rgba(255,255,255,0.1); margin: 0 2px; }
  .name-input {
    all: unset; background: #1a1a1d; border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; padding: 7px 10px; color: #fff; font-size: 13px; min-width: 140px;
  }
  .hidden { display: none !important; }
  .collapse {
    position: absolute; top: -10px; right: -10px;
    width: 22px; height: 22px; border-radius: 50%; background: #2b2b30;
    font-size: 12px; text-align: center; line-height: 22px; cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
  }
`;

export class Panel {
  private host: HTMLDivElement;
  private root: ShadowRoot;
  private chipsEl!: HTMLDivElement;
  private abInfoEl!: HTMLSpanElement;
  private loopBtn!: HTMLButtonElement;
  private nameInput!: HTMLInputElement;
  private unbind: () => void;

  constructor(private deps: PanelDeps) {
    this.host = document.createElement('div');
    this.host.id = 'youtempo-panel-host';
    this.root = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = STYLE;
    this.root.appendChild(style);

    this.build();
    document.body.appendChild(this.host);

    this.unbind = this.deps.markers.onChange(() => this.render());
    this.render();
  }

  private build(): void {
    const bar = document.createElement('div');
    bar.className = 'bar';

    // --- riga azioni principali ---
    const row1 = document.createElement('div');
    row1.className = 'row';

    const practice = btn('▶ Practice Start', 'primary');
    practice.onclick = () => this.deps.onPracticeStart();

    const setA = btn('Set A', 'ab');
    setA.onclick = () => this.deps.markers.setLoopA(this.deps.video.currentTime);

    const setB = btn('Set B', 'ab');
    setB.onclick = () => this.deps.markers.setLoopB(this.deps.video.currentTime);

    this.loopBtn = btn('⟳ Loop', 'loop');
    this.loopBtn.onclick = () => this.deps.markers.toggleLoop();

    this.abInfoEl = document.createElement('span');
    this.abInfoEl.className = 'muted';

    const sep = document.createElement('div');
    sep.className = 'sep';

    const addMarker = btn('+ Marker', '');
    addMarker.onclick = () => this.startAddMarker();

    row1.append(practice, sep.cloneNode(), setA, setB, this.loopBtn, this.abInfoEl, sep, addMarker);

    // --- input nome marker (nascosto finche' non si aggiunge) ---
    const row2 = document.createElement('div');
    row2.className = 'row hidden';
    this.nameInput = document.createElement('input');
    this.nameInput.className = 'name-input';
    this.nameInput.placeholder = 'Nome marker (Enter per salvare, Esc annulla)';
    row2.appendChild(this.nameInput);

    // --- chip dei marker ---
    this.chipsEl = document.createElement('div');
    this.chipsEl.className = 'chips';

    // --- bottone collapse ---
    const collapse = document.createElement('div');
    collapse.className = 'collapse';
    collapse.textContent = '–';
    collapse.title = 'Comprimi/Espandi';
    collapse.onclick = () => {
      const hidden = row1.classList.toggle('hidden');
      row2.classList.add('hidden');
      this.chipsEl.classList.toggle('hidden', hidden);
      collapse.textContent = hidden ? '+' : '–';
    };

    bar.append(collapse, row1, row2, this.chipsEl);
    this.row2 = row2;
    this.root.appendChild(bar);
  }

  private row2!: HTMLDivElement;

  private startAddMarker(): void {
    const time = this.deps.video.currentTime;
    this.row2.classList.remove('hidden');
    this.nameInput.value = '';
    this.nameInput.focus();

    const commit = async (save: boolean) => {
      this.nameInput.onkeydown = null;
      this.nameInput.onblur = null;
      this.row2.classList.add('hidden');
      if (save) await this.deps.markers.addPoint(time, this.nameInput.value);
    };

    this.nameInput.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void commit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        void commit(false);
      }
    };
    // blur salva comunque il marker (con eventuale nome digitato)
    this.nameInput.onblur = () => void commit(true);
  }

  private render(): void {
    const m = this.deps.markers;
    const a = m.getLoopA();
    const b = m.getLoopB();

    // info A/B
    const aTxt = a ? `A ${fmtTime(a.time)}` : 'A —';
    const bTxt = b ? `B ${fmtTime(b.time)}` : 'B —';
    this.abInfoEl.textContent = `${aTxt}  ·  ${bTxt}`;

    // stato loop
    this.loopBtn.classList.toggle('on', m.loopEnabled);
    this.loopBtn.textContent = m.loopEnabled ? '⟳ Loop ON' : '⟳ Loop';
    this.loopBtn.style.opacity = m.canLoop() || m.loopEnabled ? '1' : '0.5';

    // chip marker
    this.chipsEl.replaceChildren();
    const points = m.points();
    if (points.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'muted';
      empty.textContent = 'Nessun marker. Usa "+ Marker" per aggiungerne.';
      this.chipsEl.appendChild(empty);
    } else {
      for (const marker of points) {
        const chip = document.createElement('div');
        chip.className = 'chip';

        const t = document.createElement('span');
        t.className = 't';
        t.textContent = fmtTime(marker.time);
        t.title = 'Vai a questo punto';
        t.onclick = () => this.deps.video.seek(marker.time);

        chip.appendChild(t);

        if (marker.name) {
          const name = document.createElement('span');
          name.className = 'name';
          name.textContent = marker.name;
          name.onclick = () => this.deps.video.seek(marker.time);
          name.style.cursor = 'pointer';
          chip.appendChild(name);
        }

        const x = document.createElement('span');
        x.className = 'x';
        x.textContent = '×';
        x.title = 'Rimuovi';
        x.onclick = () => this.deps.markers.remove(marker.id);
        chip.appendChild(x);

        this.chipsEl.appendChild(chip);
      }
    }
  }

  destroy(): void {
    this.unbind();
    this.host.remove();
  }
}

function btn(label: string, extra: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = label;
  if (extra) b.className = extra;
  return b;
}
