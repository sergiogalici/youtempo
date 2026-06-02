/**
 * Content script entry — bootstrap e wiring.
 *
 * Flusso:
 * 1. un watcher unico osserva la navigazione SPA di YouTube
 * 2. la prima volta che troviamo una pagina video, montiamo servizi + UI
 * 3. alle navigazioni successive ricarichiamo solo i dati del nuovo videoId
 *
 * Resilienza: dipende solo da <video>, URL e API browser standard.
 */

import { store } from '../storage/store';
import { MarkerService } from '../services/markers';
import { LoopEngine } from '../services/loop';
import { CountIn } from '../services/countin';
import { VideoController, waitForVideo } from '../services/video';
import { CountdownOverlay } from './overlay';
import { Panel } from './panel';
import { Settings } from '../types';

function getVideoId(): string | null {
  const url = new URL(location.href);
  if (url.pathname === '/watch') return url.searchParams.get('v');
  const shorts = url.pathname.match(/^\/shorts\/([^/]+)/);
  return shorts ? shorts[1] : null;
}

/** Servizi montati una sola volta; ri-targettati al cambio video. */
interface App {
  video: VideoController;
  markers: MarkerService;
  loop: LoopEngine;
  countIn: CountIn;
  panel: Panel;
  settings: Settings;
  videoId: string;
}

let app: App | null = null;
let mounting = false;

async function mount(videoId: string): Promise<void> {
  if (app || mounting) return;
  mounting = true;
  try {
    const el = await waitForVideo().catch(() => null);
    if (!el) return;

    const video = new VideoController(el);
    const overlay = new CountdownOverlay();
    const markers = await MarkerService.load(videoId);
    const loop = new LoopEngine(video);
    const countIn = new CountIn(video, overlay);

    const settings = await store.getSettings();

    const panel = new Panel({
      video,
      markers,
      onPracticeStart: () => void countIn.run(app!.settings.countInSeconds),
    });

    app = { video, markers, loop, countIn, panel, settings, videoId };

    store.onSettingsChange((s) => {
      if (app) app.settings = s;
    });

    // loop reattivo allo stato dei marker
    const syncLoop = () => {
      if (markers.loopEnabled && !loop.isRunning) {
        loop.start(
          () => markers.getLoopA()?.time,
          () => markers.getLoopB()?.time,
        );
      } else if (!markers.loopEnabled) {
        loop.stop();
      }
    };
    markers.onChange(syncLoop);
    syncLoop();

    // debug manuale in console
    (window as unknown as { __youtempo?: unknown }).__youtempo = app;
  } finally {
    mounting = false;
  }
}

async function onNavigate(): Promise<void> {
  const next = getVideoId();
  if (!next) return;

  if (!app) {
    await mount(next);
    return;
  }
  if (next === app.videoId) return;

  // cambio video: ricarica solo i dati
  app.videoId = next;
  app.loop.stop();
  await app.markers.switchVideo(next);

  // YouTube di norma riusa lo stesso <video>; se sostituito, ri-aggancia
  if (!app.video.isConnected) {
    const fresh = await waitForVideo().catch(() => null);
    if (fresh) (app.video as unknown as { el: HTMLVideoElement }).el = fresh;
  }
}

function watchNavigation(): void {
  let lastHref = '';
  const fire = () => {
    if (location.href === lastHref) return;
    lastHref = location.href;
    void onNavigate();
  };
  document.addEventListener('yt-navigate-finish', fire);
  window.addEventListener('popstate', fire);
  setInterval(fire, 1000);
  fire(); // bootstrap iniziale
}

watchNavigation();
