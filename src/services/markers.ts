/**
 * MarkerService — la primitiva del prodotto.
 *
 * CRUD sui marker sopra lo storage layer. I marker normali ('point') e gli
 * estremi del loop ('loop-a'/'loop-b') condividono lo stesso store per videoId.
 * Loop e count-in leggono da qui: unico modello dati.
 */

import { store } from '../storage/store';
import { Marker, MarkerRole, VideoData } from '../types';

type ChangeListener = (data: VideoData) => void;

function uid(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class MarkerService {
  private listeners = new Set<ChangeListener>();

  private constructor(private data: VideoData) {}

  /** Carica i dati del video dallo storage e crea il service. */
  static async load(videoId: string): Promise<MarkerService> {
    const data = await store.getVideoData(videoId);
    return new MarkerService(data);
  }

  /** Sostituisce il video corrente (navigazione SPA) ricaricando i dati. */
  async switchVideo(videoId: string): Promise<void> {
    this.data = await store.getVideoData(videoId);
    this.emit();
  }

  get videoId(): string {
    return this.data.videoId;
  }

  get loopEnabled(): boolean {
    return this.data.loopEnabled;
  }

  /** Tutti i marker ordinati per timestamp. */
  list(): Marker[] {
    return [...this.data.markers].sort((a, b) => a.time - b.time);
  }

  /** Solo i marker normali, ordinati per timestamp. */
  points(): Marker[] {
    return this.list().filter((m) => m.role === 'point');
  }

  getByRole(role: MarkerRole): Marker | undefined {
    return this.data.markers.find((m) => m.role === role);
  }

  getLoopA(): Marker | undefined {
    return this.getByRole('loop-a');
  }

  getLoopB(): Marker | undefined {
    return this.getByRole('loop-b');
  }

  async addPoint(time: number, name?: string): Promise<Marker> {
    const marker: Marker = {
      id: uid(),
      time,
      name: name?.trim() || undefined,
      role: 'point',
      createdAt: Date.now(),
    };
    this.data.markers.push(marker);
    await this.persist();
    return marker;
  }

  async rename(id: string, name: string): Promise<void> {
    const m = this.data.markers.find((x) => x.id === id);
    if (!m) return;
    m.name = name.trim() || undefined;
    await this.persist();
  }

  async remove(id: string): Promise<void> {
    this.data.markers = this.data.markers.filter((m) => m.id !== id);
    await this.persist();
  }

  async setLoopA(time: number): Promise<void> {
    this.upsertRole('loop-a', time);
    await this.persist();
  }

  async setLoopB(time: number): Promise<void> {
    this.upsertRole('loop-b', time);
    await this.persist();
  }

  /** Loop valido solo se A e B esistono e A < B. */
  canLoop(): boolean {
    const a = this.getLoopA();
    const b = this.getLoopB();
    return !!a && !!b && a.time < b.time;
  }

  /** Inverte lo stato del loop; ritorna lo stato risultante. */
  async toggleLoop(): Promise<boolean> {
    // si puo' accendere solo se A<B esistono; spegnere sempre permesso
    this.data.loopEnabled = this.data.loopEnabled ? false : this.canLoop();
    await this.persist();
    return this.data.loopEnabled;
  }

  async setLoopEnabled(enabled: boolean): Promise<void> {
    this.data.loopEnabled = enabled && this.canLoop();
    await this.persist();
  }

  onChange(cb: ChangeListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private upsertRole(role: MarkerRole, time: number): void {
    const existing = this.data.markers.find((m) => m.role === role);
    if (existing) {
      existing.time = time;
    } else {
      this.data.markers.push({
        id: uid(),
        time,
        role,
        createdAt: Date.now(),
      });
    }
  }

  private async persist(): Promise<void> {
    await store.setVideoData(this.data);
    this.emit();
  }

  private emit(): void {
    for (const cb of this.listeners) cb(this.data);
  }
}
