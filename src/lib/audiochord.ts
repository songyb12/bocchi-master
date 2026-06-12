// audiochord — thin type-safe client over generated OpenAPI types.
//
// Vite proxy forwards `/api/v1/*` to AudioChord :8220 (see vite.config.ts).
// Use these helpers from React components instead of hand-rolled fetch.
//
// Note: AudioChord endpoints accept multipart/form-data (analysis, separate, pitch)
// or application/x-www-form-urlencoded (ingest), not JSON. Helpers below build the
// right form payload from typed input objects.

import type { components } from "./audiochord.types";

// Re-export schema types for ergonomic imports.
export type BeatAnalysis = components["schemas"]["BeatAnalysis"];
export type ChordAnalysis = components["schemas"]["ChordAnalysis"];
export type SeparationResult = components["schemas"]["SeparationResult"];
export type PitchMidi = components["schemas"]["PitchMidi"];
export type LibraryEntry = components["schemas"]["LibraryEntry"];
export type LibraryList = components["schemas"]["LibraryList"];
export type IngestResponse = components["schemas"]["IngestResponse"];
export type EnergyPeak = components["schemas"]["EnergyPeak"];
export type ChordSegment = components["schemas"]["ChordSegment"];
export type DeleteResponse = components["schemas"]["DeleteResponse"];

const BASE = "/api/v1";

// API key header (AudioChord 0.3.1+). Empty/undefined → no header sent → AudioChord
// falls back to no-auth mode (backward-compat). Set VITE_AC_API_KEY in .env after
// admin issues `setx /M AC_API_KEY <value>` on Herta + restarts AudioChord Servy.
const AC_API_KEY = (import.meta.env.VITE_AC_API_KEY as string | undefined) || "";

export function withAuth(headers: HeadersInit = {}): HeadersInit {
  if (!AC_API_KEY) return headers;
  return { ...headers, "X-AC-Key": AC_API_KEY };
}

export class AudioChordError extends Error {
  status: number;
  op: string;
  detail?: unknown;
  constructor(status: number, op: string, detail?: unknown) {
    super(`AudioChord ${op} failed: HTTP ${status}`);
    this.status = status;
    this.op = op;
    this.detail = detail;
  }
}

// ─── Classified fetch ────────────────────────────────────────────────────────
// Opaque failures (TypeError / AbortError / 401) all looked the same to the
// UI, so server-down vs auth vs timeout got collapsed into one state. acFetch
// classifies them; other HTTP statuses (e.g. 404 = not ingested) pass through.

export type ACFailureKind = "server-down" | "auth" | "timeout" | "aborted";

export const AC_FAILURE_MESSAGES: Record<ACFailureKind, string> = {
  "server-down": "AudioChord 서버(:8220)에 연결할 수 없습니다 — Servy에서 AudioChord 서비스 상태를 확인하세요.",
  auth: "인증 실패(401/403) — .env의 VITE_AC_API_KEY 확인 후 재빌드(npm run build)하세요.",
  timeout: "응답 시간 초과 — 서버나 GPU 워커가 바쁘거나 멈췄을 수 있습니다. 잠시 후 재시도하세요.",
  aborted: "취소됨",
};

export class ACRequestError extends Error {
  kind: ACFailureKind;
  userMessage: string;
  constructor(kind: ACFailureKind, userMessage = AC_FAILURE_MESSAGES[kind]) {
    super(userMessage);
    this.kind = kind;
    this.userMessage = userMessage;
  }
}

/**
 * fetch + withAuth with a deadline and caller-cancellation. Throws
 * ACRequestError('server-down' | 'auth' | 'timeout' | 'aborted'); any other
 * response (including 4xx/5xx) is returned for the caller to interpret.
 */
export async function acFetch(
  input: string,
  init: RequestInit = {},
  opts: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<Response> {
  const { timeoutMs = 15_000, signal } = opts;
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeoutMs);
  const onOuterAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener("abort", onOuterAbort);
  }

  let res: Response;
  try {
    res = await fetch(input, { ...init, headers: withAuth(init.headers ?? {}), signal: ctrl.signal });
  } catch {
    if (signal?.aborted) throw new ACRequestError("aborted");
    if (timedOut) throw new ACRequestError("timeout");
    throw new ACRequestError("server-down");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onOuterAbort);
  }

  if (res.status === 401 || res.status === 403) throw new ACRequestError("auth");
  return res;
}

function toFormData(obj: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (v instanceof Blob) fd.append(k, v);
    else fd.append(k, String(v));
  }
  return fd;
}

function toUrlEncoded(obj: Record<string, unknown>): URLSearchParams {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    u.append(k, String(v));
  }
  return u;
}

async function postForm<T>(path: string, fd: FormData | URLSearchParams, op: string): Promise<T> {
  const baseHeaders: HeadersInit =
    fd instanceof URLSearchParams
      ? { "Content-Type": "application/x-www-form-urlencoded" }
      : {}; // FormData: browser sets multipart boundary
  const r = await fetch(`${BASE}${path}`, { method: "POST", headers: withAuth(baseHeaders), body: fd });
  if (!r.ok) {
    let detail: unknown;
    try { detail = await r.json(); } catch { /* ignore */ }
    throw new AudioChordError(r.status, op, detail);
  }
  return (await r.json()) as T;
}

async function getJson<T>(path: string, op: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { cache: "no-store", headers: withAuth() });
  if (!r.ok) throw new AudioChordError(r.status, op);
  return (await r.json()) as T;
}

// --- ingest ---
export interface IngestYoutubeInput { url: string }
export function ingestYoutube(body: IngestYoutubeInput) {
  return postForm<IngestResponse>("/ingest/youtube", toUrlEncoded(body as unknown as Record<string, unknown>), "ingest/youtube");
}

// --- analysis ---
// audio: blob/file (optional) | file_id: existing library entry (optional). Provide one.
export interface BeatsInput { audio?: Blob; file_id?: string; hop_length?: number }
export function analyzeBeats(input: BeatsInput) {
  const fd = toFormData({ ...input, hop_length: input.hop_length ?? 512 } as unknown as Record<string, unknown>);
  return postForm<BeatAnalysis>("/analyze/beats", fd, "analyze/beats");
}

export interface ChordsInput { audio?: Blob; file_id?: string; pre_separate?: boolean }
export function analyzeChords(input: ChordsInput) {
  const fd = toFormData({ ...input, pre_separate: input.pre_separate ?? false } as unknown as Record<string, unknown>);
  return postForm<ChordAnalysis>("/analyze/chords", fd, "analyze/chords");
}

export interface PitchInput { audio?: Blob; file_id?: string; instrument_hint?: string; pre_separate?: boolean }
export function analyzePitchToMidi(input: PitchInput) {
  const fd = toFormData({
    ...input,
    instrument_hint: input.instrument_hint ?? "auto",
    pre_separate: input.pre_separate ?? false,
  } as unknown as Record<string, unknown>);
  return postForm<PitchMidi>("/analyze/pitch-to-midi", fd, "analyze/pitch-to-midi");
}

// --- separation ---
export interface SeparateInput { audio?: Blob; file_id?: string; model?: string }
export function separate(input: SeparateInput) {
  const fd = toFormData({ ...input, model: input.model ?? "htdemucs" } as unknown as Record<string, unknown>);
  return postForm<SeparationResult>("/separate", fd, "separate");
}

// --- transcription (lead sheet) ---
// Hand-written mirror of spec/openapi.json `LeadSheetResult` — the generated
// audiochord.types.ts predates /transcribe/*; fold into codegen on next refresh.
export interface LeadSheetResult {
  file_id?: string | null;
  /** MIDI slot used for the melody staff, e.g. 'vocal', 'auto' */
  instrument_hint: string;
  elapsed_sec: number;
  /** Tempo derived from the beat grid (median beat interval) */
  song_bpm: number;
  /** Estimated or provided key, e.g. 'C major' */
  key?: string | null;
  time_signature: string;
  subdivision: number;
  measure_count: number;
  note_count: number;
  chord_count: number;
  /** Library URL of the lead sheet MusicXML (melody + <harmony>) */
  musicxml_url: string;
  /** Library URL of the rendered SVG, if produced */
  svg_url?: string | null;
}

export interface LeadSheetInput {
  file_id: string;
  instrument_hint?: string;
  subdivision?: number;
  key?: string;
  time_signature?: string;
}

/**
 * POST /transcribe/leadsheet — Real Book-style melody + chord symbols.
 * Requires pitch-to-midi to have run for the track; cached beats/chords are
 * reused, chords go to the GPU worker on a miss (503 if down).
 *
 * Uses acFetch so server-down/auth/timeout surface as ACRequestError; other
 * HTTP errors (404 = melody MIDI missing, 503 = GPU worker down) throw
 * AudioChordError with the response detail.
 */
export async function transcribeLeadsheet(
  input: LeadSheetInput,
  opts: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<LeadSheetResult> {
  const body = toUrlEncoded(input as unknown as Record<string, unknown>);
  const r = await acFetch(`${BASE}/transcribe/leadsheet`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }, { timeoutMs: opts.timeoutMs ?? 180_000, signal: opts.signal });
  if (!r.ok) {
    let detail: unknown;
    try { detail = await r.json(); } catch { /* ignore */ }
    throw new AudioChordError(r.status, "transcribe/leadsheet", detail);
  }
  return (await r.json()) as LeadSheetResult;
}

// --- library ---
export function listLibrary() {
  return getJson<LibraryList>("/library", "library");
}

export function getLibraryEntry(fileId: string) {
  return getJson<LibraryEntry>(`/library/${encodeURIComponent(fileId)}`, "library entry");
}

export function libraryFileUrl(fileId: string, path: string): string {
  return `${BASE}/library/${encodeURIComponent(fileId)}/file/${encodeURIComponent(path)}`;
}

export function libraryAudioUrl(fileId: string): string {
  return `${BASE}/library/${encodeURIComponent(fileId)}/audio`;
}

export async function fetchLibraryFile<T = unknown>(fileId: string, path: string): Promise<T | null> {
  const r = await fetch(libraryFileUrl(fileId, path), { cache: "no-store", headers: withAuth() });
  if (r.status === 404) return null;
  if (!r.ok) throw new AudioChordError(r.status, "library file");
  return (await r.json()) as T;
}

export async function deleteLibraryEntry(fileId: string): Promise<DeleteResponse> {
  const r = await fetch(`${BASE}/library/${encodeURIComponent(fileId)}`, { method: "DELETE", headers: withAuth() });
  if (!r.ok) throw new AudioChordError(r.status, "library delete");
  return (await r.json()) as DeleteResponse;
}
