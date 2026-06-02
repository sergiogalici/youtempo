/**
 * Service worker (MV3) — placeholder minimo.
 *
 * Nell'MVP non serve logica in background: i marker sono per-tab e persistiti
 * via chrome.storage. Questo file e' il punto di estensione per funzioni future
 * (es. sync, comandi globali, detection BPM offload).
 */

chrome.runtime.onInstalled.addListener(() => {
  console.info('[YouTempo] installato.');
});

export {};
