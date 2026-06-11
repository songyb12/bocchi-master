/**
 * GpTabPanel — sidebar section for Guitar Pro tab import.
 *
 * Upload (.gp/.gp3-7/.gpx) → POST /api/parse/tab on the optional bocchi
 * backend (:8081) → normalized Track → localStorage library → playable in
 * TabView. The backend is optional, so a refused connection gets an explicit
 * "server is down, run this" message instead of a generic failure.
 */

import { useRef, useState } from 'react'
import {
  loadGpLibrary,
  saveGpEntry,
  removeGpEntry,
  normalizeParsedTrack,
  type GpLibraryEntry,
  type GpParsedFileTrack,
} from './gpLibrary'

const TAB_PARSER_URL = (import.meta.env.VITE_TAB_PARSER_URL as string | undefined) || 'http://localhost:8081'
const GP_EXTENSIONS = ['.gp', '.gp3', '.gp4', '.gp5', '.gpx', '.gp7']

type Phase = 'idle' | 'uploading' | 'done' | 'error'

interface Props {
  activeTrackId: string | null
  onSelect: (entry: GpLibraryEntry) => void
}

export function GpTabPanel({ activeTrackId, onSelect }: Props) {
  const [library, setLibrary] = useState<GpLibraryEntry[]>(() => loadGpLibrary())
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileTracks, setFileTracks] = useState<GpParsedFileTrack[]>([])
  const [lastTrackName, setLastTrackName] = useState<string | null>(null)
  const lastFileRef = useRef<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File, trackIndex?: number) => {
    const suffix = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!GP_EXTENSIONS.includes(suffix)) {
      setPhase('error')
      setError(`지원하지 않는 형식(${suffix || '확장자 없음'}) — ${GP_EXTENSIONS.join(' ')}`)
      return
    }

    setPhase('uploading')
    setError(null)

    const fd = new FormData()
    fd.append('file', file)
    const url = `${TAB_PARSER_URL}/api/parse/tab${trackIndex != null ? `?track=${trackIndex}` : ''}`

    let res: Response
    try {
      res = await fetch(url, { method: 'POST', body: fd })
    } catch {
      setPhase('error')
      setError(
        `탭 파서 서버(${TAB_PARSER_URL})에 연결할 수 없습니다 — ` +
        'uvicorn main:app --app-dir server --port 8081 로 백엔드를 먼저 실행하세요.',
      )
      return
    }

    if (!res.ok) {
      let detail = ''
      try {
        const body = await res.json()
        detail = typeof body?.detail === 'string' ? body.detail : ''
      } catch { /* non-JSON error body */ }
      setPhase('error')
      setError(`파싱 실패 (HTTP ${res.status})${detail ? ` — ${detail.slice(0, 140)}` : ''}`)
      return
    }

    const json = await res.json().catch(() => null)
    const norm = json ? normalizeParsedTrack(json) : null
    if (!norm) {
      setPhase('error')
      setError('서버 응답을 Track으로 변환하지 못했습니다 (연주 가능한 노트/마디 없음).')
      return
    }

    const entry: GpLibraryEntry = {
      track: norm.track,
      fileName: file.name,
      artist: norm.artist,
      sourceTrackName: norm.sourceTrackName,
      savedAt: new Date().toISOString(),
    }
    setLibrary(saveGpEntry(entry))
    lastFileRef.current = file
    setFileTracks(norm.allTracks)
    setLastTrackName(norm.sourceTrackName)
    setPhase('done')
    onSelect(entry)
  }

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) void uploadFile(file)
  }

  return (
    <div>
      <div
        className="px-4 py-2"
        style={{
          fontFamily: 'monospace',
          fontSize: '0.6rem',
          color: '#71dcff',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          marginTop: 8,
        }}
      >
        GP Tabs
      </div>

      {/* Stored tabs */}
      {library.map((entry) => {
        const isActive = activeTrackId === entry.track.id
        return (
          <div
            key={entry.track.id}
            className="flex items-center"
            style={{
              background: isActive ? 'rgba(113,220,255,0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid #71dcff' : '3px solid transparent',
            }}
          >
            <button
              onClick={() => onSelect(entry)}
              className="flex-1 text-left transition-all"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px 10px 16px', cursor: 'pointer', minWidth: 0 }}
            >
              <span
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isActive ? '#71dcff' : '#71dcff88', flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#71dcff' : '#f0f0f0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {entry.track.title}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#555', marginTop: 2 }}>
                  {entry.sourceTrackName ?? entry.fileName} · {entry.track.tuning.stringCount}현 · {entry.track.events.length} notes
                </div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: isActive ? '#71dcff' : '#555', flexShrink: 0 }}>
                {entry.track.bpm}<span style={{ opacity: 0.6 }}>bpm</span>
              </div>
            </button>
            <button
              onClick={() => setLibrary(removeGpEntry(entry.track.id))}
              title="라이브러리에서 제거"
              className="transition-all"
              style={{
                padding: '6px 10px', color: '#555', background: 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 12, flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffb2be' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#555' }}
            >
              ✕
            </button>
          </div>
        )
      })}

      {/* Track picker for the file just uploaded (re-parse with ?track=N) */}
      {fileTracks.length > 1 && lastFileRef.current && (
        <div className="px-4 py-2 flex flex-wrap gap-1">
          {fileTracks.map((t) => {
            const isCurrent = t.name === lastTrackName
            return (
              <button
                key={t.index}
                onClick={() => lastFileRef.current && void uploadFile(lastFileRef.current, t.index)}
                disabled={phase === 'uploading'}
                title={`${t.stringCount}현 트랙으로 다시 파싱`}
                style={{
                  fontFamily: 'monospace', fontSize: '0.58rem', padding: '2px 7px', borderRadius: 999,
                  background: isCurrent ? 'rgba(113,220,255,0.15)' : 'rgba(255,255,255,0.04)',
                  color: isCurrent ? '#71dcff' : '#888',
                  border: `1px solid ${isCurrent ? 'rgba(113,220,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: phase === 'uploading' ? 'wait' : 'pointer',
                }}
              >
                {t.name || `Track ${t.index}`}{t.stringCount ? ` · ${t.stringCount}s` : ''}
              </button>
            )
          })}
        </div>
      )}

      {/* Upload drop zone */}
      <div className="px-4 py-2">
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          disabled={phase === 'uploading'}
          className="w-full transition-all"
          style={{
            border: '1px dashed rgba(113,220,255,0.35)',
            borderRadius: 8,
            background: 'rgba(113,220,255,0.05)',
            color: phase === 'uploading' ? '#71dcff' : '#7ab8cc',
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            padding: '8px 6px',
            cursor: phase === 'uploading' ? 'wait' : 'pointer',
          }}
        >
          {phase === 'uploading'
            ? <span className="animate-pulse">● 파싱 중...</span>
            : <>+ GP 탭 업로드 <span style={{ opacity: 0.6 }}>(.gp .gp3-7 .gpx — 클릭/드롭)</span></>}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".gp,.gp3,.gp4,.gp5,.gpx,.gp7"
          style={{ display: 'none' }}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
        />
        {phase === 'error' && error && (
          <div
            className="mt-2"
            style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#ffb2be', lineHeight: 1.5, wordBreak: 'break-all' }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
