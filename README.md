# 🎸 YouTempo

YouTube come ambiente di studio musicale. Estensione Chrome (MV3) per musicisti:
**count-in**, **loop A-B preciso**, **markers** cliccabili — usabili con lo strumento in mano.

## Funzioni MVP

- **▶ Practice Start** — pausa, countdown configurabile (3/5/10s), poi play.
- **Loop A-B** — `Set A` / `Set B`, toggle loop. Rewind preciso via `requestAnimationFrame`.
- **Markers** — punti temporali nominabili, cliccabili, persistiti per `videoId`.

I marker sono la primitiva: A e B sono marker con `role` speciale (`loop-a`/`loop-b`).

## Sviluppo

```bash
npm install
npm run dev      # HMR
npm run build    # genera dist/
```

## Installazione in Chrome

1. `npm run build`
2. `chrome://extensions` → attiva **Developer mode**
3. **Load unpacked** → seleziona la cartella `dist/`
4. Apri un video YouTube: la barra YouTempo appare in basso al centro.
   La durata del count-in si imposta dal popup dell'estensione.

## Architettura

```
src/
 ├─ types/      modello dati (Marker primitiva, VideoData, Settings)
 ├─ storage/    chrome.storage.local wrapper
 ├─ services/   video · markers · loop (RAF) · countin
 ├─ content/    panel (Shadow DOM) · overlay · entry+SPA nav
 ├─ popup/      config globale count-in
 └─ background/ service worker (placeholder estensioni future)
```

Resiliente al frontend di YouTube: interagisce solo con `<video>`, URL e API
browser standard; UI in Shadow DOM (CSS isolato). Vedi il piano in
`~/.claude/plans/` per la sezione **Futuro** (metronomo Web Audio, BPM detection
con essentia.js / Meyda).
# youtempo
