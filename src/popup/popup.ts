/**
 * Popup — configurazione globale. Nell'MVP gestisce solo la durata del
 * count-in (3/5/10s), persistita in chrome.storage.local.
 */

import { store } from '../storage/store';
import { COUNT_IN_OPTIONS, CountInSeconds } from '../types';

const container = document.getElementById('countin-opts') as HTMLDivElement;

async function render(): Promise<void> {
  const settings = await store.getSettings();
  container.replaceChildren();

  for (const sec of COUNT_IN_OPTIONS) {
    const opt = document.createElement('div');
    opt.className = 'opt' + (settings.countInSeconds === sec ? ' active' : '');
    opt.innerHTML = `${sec}<span>secondi</span>`;
    opt.onclick = async () => {
      await store.setSettings({ countInSeconds: sec as CountInSeconds });
      await render();
    };
    container.appendChild(opt);
  }
}

void render();
