/**
 * Curriculum browser — Amplified Underground theme.
 *
 * Mirrors the Learn tab visual language: serif italic display + monospace data
 * + amber accents. Each lesson exposes its full theory.markdown, every objective
 * as a checklist row, and every drill with type icon + estimated time + XP.
 */

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  GUITAR_CURRICULUM,
  BASS_CURRICULUM,
  type Level,
  type Lesson,
  type Drill,
} from '@/data/curriculum'
import { loadProgress } from './progressStore'

interface Props {
  /** instrument = the curriculum the drill belongs to (guitar/bass tuning). */
  onSelectDrill: (drill: Drill, lesson: Lesson, instrument: 'guitar' | 'bass') => void
}

const DRILL_TYPE_LABEL: Record<string, string> = {
  'chord-change':     '코드 전환',
  'strum-pattern':    '스트럼 패턴',
  'arpeggio':         '아르페지오',
  'scale-run':        '스케일 런',
  'fretboard-quiz':   '지판 퀴즈',
  'rhythm':           '리듬 정확도',
  'ear-training':     '음정 훈련',
  'song-section':     '곡 구간',
  'voicing-match':    '보이싱 매치',
  'progression-play': '진행 연주',
}

const DRILL_TYPE_ICON: Record<string, string> = {
  'chord-change':     '\u{1F3B8}',
  'strum-pattern':    '\u{1F3B5}',
  'arpeggio':         '\u{1F3B6}',
  'scale-run':        '\u{1F3BC}',
  'fretboard-quiz':   '\u{2753}',
  'rhythm':           '\u{1F941}',
  'ear-training':     '\u{1F442}',
  'song-section':     '\u{1F3A4}',
  'voicing-match':    '\u{1F3AF}',
  'progression-play': '\u{1F504}',
}

// Progress is read from progressStore (`bocchi.progress.{instrument}`).
// Drill completion is written by App on natural play-through end
// (TRACK_ENDED → markDrillComplete); session minutes XP by sessionEngine.

export function CurriculumScreen({ onSelectDrill }: Props) {
  const [instrument, setInstrument] = useState<'guitar' | 'bass'>('guitar')
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [progress, setProgress] = useState(() => loadProgress('guitar'))

  useEffect(() => {
    setProgress(loadProgress(instrument))
  }, [instrument])

  const curriculum = instrument === 'guitar' ? GUITAR_CURRICULUM : BASS_CURRICULUM
  const totalXpAvailable = curriculum.levels.reduce(
    (s, l) => s + l.lessons.reduce((ls, lesson) => ls + lesson.xpReward + lesson.drills.reduce((ds, d) => ds + d.xpReward, 0), 0),
    0,
  )

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#0a0a0a' }}>
      <div className="mx-auto px-6 py-8 flex flex-col gap-8" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
            BOCCHI · CURRICULUM
          </div>
          <h1
            className="font-serif italic"
            style={{ color: '#fff', fontSize: 38, fontWeight: 400, lineHeight: 1.1 }}
          >
            {curriculum.name}
          </h1>
          <p style={{ color: '#999', fontSize: 14, maxWidth: 720, lineHeight: 1.6 }}>
            {curriculum.description}
          </p>

          {/* R19 — XP progress strip */}
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-[10px]" style={{ color: '#7eff8b' }}>
              XP {progress.xp} / {totalXpAvailable}
            </span>
            <div
              className="rounded-full overflow-hidden flex-1 max-w-xs"
              style={{ height: 4, background: '#1c1c1c' }}
            >
              <div
                style={{
                  width: `${
                    totalXpAvailable === 0
                      ? 0
                      : Math.min(100, (progress.xp / totalXpAvailable) * 100)
                  }%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #7eff8b 0%, #fbbc00 100%)',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <span className="font-mono text-[9px]" style={{ color: '#666' }}>
              {progress.completedLessons.length} lessons · {progress.completedDrills.length} drills
            </span>
          </div>
        </header>

        {/* Instrument toggle */}
        <div className="flex gap-2">
          {(['guitar', 'bass'] as const).map((inst) => {
            const isActive = instrument === inst
            return (
              <button
                key={inst}
                onClick={() => {
                  setInstrument(inst)
                  setExpandedLevel(null)
                  setExpandedLesson(null)
                }}
                className="px-4 py-2 rounded-md text-xs font-mono transition-all capitalize"
                style={{
                  background: isActive ? 'rgba(251,188,0,0.15)' : '#141414',
                  color: isActive ? '#fbbc00' : '#888',
                  border: `1px solid ${isActive ? 'rgba(251,188,0,0.5)' : '#222'}`,
                  cursor: 'pointer',
                }}
              >
                {inst}
              </button>
            )
          })}
        </div>

        {/* Levels — XP-gated: a level opens once cumulative XP reaches requiredXP */}
        <div className="flex flex-col gap-3">
          {curriculum.levels.map((level, i) => {
            const unlocked = progress.xp >= level.requiredXP
            return (
              <LevelCard
                key={level.id}
                level={level}
                index={i}
                unlocked={unlocked}
                completedDrills={progress.completedDrills}
                completedLessons={progress.completedLessons}
                isExpanded={unlocked && expandedLevel === level.id}
                expandedLesson={expandedLesson}
                onToggle={() =>
                  setExpandedLevel(expandedLevel === level.id ? null : level.id)
                }
                onToggleLesson={(id) =>
                  setExpandedLesson(expandedLesson === id ? null : id)
                }
                onSelectDrill={(drill, lesson) => onSelectDrill(drill, lesson, instrument)}
              />
            )
          })}
        </div>

        <footer className="pt-6 pb-12" style={{ borderTop: '1px solid #1a1a1a' }}>
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            J-Pop 곡 연주를 위한 단계별 학습 — Lesson → Drill → Song → Challenge 사이클
          </div>
        </footer>
      </div>
    </div>
  )
}

interface LevelCardProps {
  level: Level
  index: number
  unlocked: boolean
  completedDrills: string[]
  completedLessons: string[]
  isExpanded: boolean
  expandedLesson: string | null
  onToggle: () => void
  onToggleLesson: (id: string) => void
  onSelectDrill: (drill: Drill, lesson: Lesson) => void
}

function LevelCard({
  level,
  index,
  unlocked,
  completedDrills,
  completedLessons,
  isExpanded,
  expandedLesson,
  onToggle,
  onToggleLesson,
  onSelectDrill,
}: LevelCardProps) {
  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{
        background: '#101010',
        border: `1px solid ${isExpanded ? 'rgba(251,188,0,0.4)' : '#222'}`,
        boxShadow: isExpanded ? '0 0 16px rgba(251,188,0,0.15)' : 'none',
      }}
    >
      {/* Level header — locked levels are not expandable */}
      <button
        onClick={unlocked ? onToggle : undefined}
        disabled={!unlocked}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
        style={{ cursor: unlocked ? 'pointer' : 'default', opacity: unlocked ? 1 : 0.55 }}
      >
        <span style={{ fontSize: 28 }}>{level.icon}</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-[10px]"
              style={{ color: '#fbbc0099' }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              className="font-serif italic"
              style={{ color: '#fff', fontSize: 22, fontWeight: 400 }}
            >
              {level.name}
            </span>
            <span style={{ color: '#666', fontSize: 13 }}>— {level.nameEn}</span>
          </div>
          <div className="font-mono text-[11px] mt-1" style={{ color: '#888' }}>
            {level.subtitle}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
            {level.lessons.length} LESSONS
          </span>
          <span className="font-mono text-[9px]" style={{ color: unlocked ? '#666' : '#a8821f' }}>
            {unlocked ? 'unlocked' : `${level.requiredXP} XP req`}
          </span>
        </div>
        <span
          style={{
            color: isExpanded ? '#fbbc00' : '#444',
            fontSize: 14,
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(180deg)' : 'none',
          }}
        >
          {unlocked ? '▾' : '🔒'}
        </span>
      </button>

      {/* Level body — description + lessons */}
      {isExpanded && (
        <div className="px-5 pb-5 flex flex-col gap-3">
          <p
            className="text-sm pl-12"
            style={{ color: '#bbb', lineHeight: 1.6, marginTop: -4 }}
          >
            {level.description}
          </p>
          <div className="flex flex-col gap-2">
            {level.lessons.map((lesson, li) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                index={li}
                completedDrills={completedDrills}
                lessonCompleted={completedLessons.includes(lesson.id)}
                isExpanded={expandedLesson === lesson.id}
                onToggle={() => onToggleLesson(lesson.id)}
                onSelectDrill={onSelectDrill}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface LessonCardProps {
  lesson: Lesson
  index: number
  completedDrills: string[]
  lessonCompleted: boolean
  isExpanded: boolean
  onToggle: () => void
  onSelectDrill: (drill: Drill, lesson: Lesson) => void
}

function LessonCard({
  lesson,
  index,
  completedDrills,
  lessonCompleted,
  isExpanded,
  onToggle,
  onSelectDrill,
}: LessonCardProps) {
  // Try to extract the first heading from the markdown for a quick concept hint
  const firstHeading = (() => {
    if (!lesson.theory?.markdown) return null
    const m = lesson.theory.markdown.match(/^##\s+(.+)$/m)
    return m ? m[1].trim() : null
  })()

  const totalMinutes = lesson.drills.reduce((s, d) => s + (d.estimatedMinutes ?? 0), 0)
  const doneCount = lesson.drills.filter((d) => completedDrills.includes(d.id)).length

  return (
    <div
      className="rounded-lg transition-all"
      style={{
        background: '#0d0d0d',
        border: `1px solid ${isExpanded ? 'rgba(251,188,0,0.3)' : '#1c1c1c'}`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-baseline gap-3 px-4 py-3 text-left"
        style={{ cursor: 'pointer' }}
      >
        <span className="font-mono text-[10px]" style={{ color: '#fbbc0088' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1">
          <div
            className="font-serif italic"
            style={{ color: '#fbbc00', fontSize: 15, fontWeight: 400 }}
          >
            {lessonCompleted && <span style={{ color: '#7eff8b' }}>✓ </span>}
            {lesson.title}
          </div>
          {firstHeading && (
            <div className="font-mono text-[10px] mt-0.5" style={{ color: '#777' }}>
              {firstHeading}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[9px]" style={{ color: '#fbbc0099' }}>
            {doneCount > 0 ? `${doneCount}/${lesson.drills.length}` : lesson.drills.length} drills · {totalMinutes}min
          </span>
          <span className="font-mono text-[9px]" style={{ color: '#7eff8b' }}>
            +{lesson.xpReward} XP
          </span>
        </div>
        <span
          style={{
            color: isExpanded ? '#fbbc00' : '#444',
            fontSize: 12,
            marginLeft: 4,
          }}
        >
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          {/* Objectives */}
          {lesson.objectives.length > 0 && (
            <section>
              <div
                className="font-mono text-[10px] mb-2"
                style={{ color: '#fbbc00' }}
              >
                OBJECTIVES
              </div>
              <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
                {lesson.objectives.map((obj, oi) => (
                  <li
                    key={oi}
                    className="flex items-baseline gap-2"
                    style={{ color: '#ccc', fontSize: 12, lineHeight: 1.5 }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        color: '#fbbc0066',
                        fontSize: 10,
                        flexShrink: 0,
                        width: 14,
                      }}
                    >
                      ◇
                    </span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Theory */}
          {lesson.theory?.markdown && (
            <section
              className="rounded-md p-4"
              style={{
                background: 'rgba(251,188,0,0.04)',
                border: '1px solid rgba(251,188,0,0.15)',
              }}
            >
              <div
                className="font-mono text-[10px] mb-3"
                style={{ color: '#fbbc00' }}
              >
                THEORY
              </div>
              <TheoryMarkdown source={lesson.theory.markdown} />
            </section>
          )}

          {/* Drills */}
          {lesson.drills.length > 0 && (
            <section>
              <div
                className="font-mono text-[10px] mb-2"
                style={{ color: '#fbbc00' }}
              >
                DRILLS
              </div>
              <div className="flex flex-col gap-2">
                {lesson.drills.map((drill) => (
                  <DrillRow
                    key={drill.id}
                    drill={drill}
                    completed={completedDrills.includes(drill.id)}
                    onSelect={() => onSelectDrill(drill, lesson)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function DrillRow({
  drill,
  completed,
  onSelect,
}: {
  drill: Drill
  completed: boolean
  onSelect: () => void
}) {
  const restingBorder = completed ? 'rgba(126,255,139,0.35)' : '#222'
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all"
      style={{
        background: '#141414',
        border: `1px solid ${restingBorder}`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(251,188,0,0.5)'
        e.currentTarget.style.background = '#181818'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = restingBorder
        e.currentTarget.style.background = '#141414'
      }}
    >
      <span style={{ fontSize: 18 }}>{DRILL_TYPE_ICON[drill.type] ?? '🎵'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            style={{
              color: '#eee',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {drill.title}
          </span>
          <span
            className="font-mono text-[9px]"
            style={{ color: '#666' }}
          >
            {DRILL_TYPE_LABEL[drill.type] ?? drill.type}
          </span>
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: '#999', lineHeight: 1.4 }}
        >
          {drill.description}
        </div>
        {drill.passCriteria && (
          <div
            className="font-mono text-[9px] mt-1"
            style={{ color: '#666' }}
          >
            {formatPassCriteria(drill.passCriteria)}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="font-mono text-[10px]" style={{ color: '#7eff8b' }}>
          {completed ? '✓ done' : `+${drill.xpReward} XP`}
        </span>
        <span className="font-mono text-[9px]" style={{ color: '#888' }}>
          ~{drill.estimatedMinutes}min
        </span>
      </div>
    </button>
  )
}

export function formatPassCriteria(p: {
  minAccuracy?: number
  minBpm?: number
  minCorrectStreak?: number
  minCompletions?: number
  maxTimeSeconds?: number
}): string {
  const parts: string[] = []
  if (p.minAccuracy != null) parts.push(`accuracy ≥${p.minAccuracy}%`)
  if (p.minBpm != null) parts.push(`bpm ≥${p.minBpm}`)
  if (p.minCorrectStreak != null) parts.push(`streak ≥${p.minCorrectStreak}`)
  if (p.minCompletions != null) parts.push(`×${p.minCompletions} reps`)
  if (p.maxTimeSeconds != null) parts.push(`≤${p.maxTimeSeconds}s`)
  return parts.length > 0 ? `pass · ${parts.join(' · ')}` : ''
}

// Lightweight markdown styling for theory blocks. Restricts to the
// constructs actually used in curriculum.ts (h2/h3 + ul/ol + strong + p).
function TheoryMarkdown({ source }: { source: string }) {
  return (
    <div className="theory-md" style={{ color: '#ddd', fontSize: 13, lineHeight: 1.7 }}>
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h3
              className="font-serif italic mt-1 mb-2"
              style={{ color: '#fbbc00', fontSize: 17, fontWeight: 400 }}
            >
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4
              className="font-mono mt-3 mb-1"
              style={{ color: '#fbbc00cc', fontSize: 11, letterSpacing: '0.1em' }}
            >
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p style={{ marginBottom: 8 }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul
              className="list-none p-0"
              style={{ margin: '4px 0 8px 0' }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className="list-decimal pl-5"
              style={{ margin: '4px 0 8px 0' }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              className="flex items-baseline gap-2"
              style={{ marginBottom: 3 }}
            >
              <span
                className="font-mono"
                style={{
                  color: '#fbbc0066',
                  fontSize: 10,
                  flexShrink: 0,
                  width: 14,
                }}
              >
                ▸
              </span>
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong style={{ color: '#fbbc00', fontWeight: 600 }}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="font-serif italic" style={{ color: '#fff' }}>
              {children}
            </em>
          ),
          code: ({ children }) => (
            <code
              className="font-mono"
              style={{
                background: '#0a0a0a',
                color: '#fbbc00',
                padding: '1px 5px',
                borderRadius: 3,
                fontSize: 11,
              }}
            >
              {children}
            </code>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
