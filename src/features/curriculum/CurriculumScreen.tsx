/**
 * Curriculum browser — levels, lessons, drills.
 * Allows users to pick a drill to load into the tab view.
 */

import { useState } from 'react'
import { GUITAR_CURRICULUM, BASS_CURRICULUM, type Level, type Lesson, type Drill } from '@/data/curriculum'

interface Props {
  onSelectDrill: (drill: Drill, lesson: Lesson) => void
}

export function CurriculumScreen({ onSelectDrill }: Props) {
  const [instrument, setInstrument] = useState<'guitar' | 'bass'>('guitar')
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)

  const curriculum = instrument === 'guitar' ? GUITAR_CURRICULUM : BASS_CURRICULUM

  return (
    <div className="flex flex-col gap-4">
      {/* Instrument Toggle */}
      <div className="flex gap-2">
        {(['guitar', 'bass'] as const).map(inst => (
          <button
            key={inst}
            onClick={() => setInstrument(inst)}
            className="px-4 py-2 rounded-lg text-sm capitalize transition-all"
            style={{
              background: instrument === inst ? 'var(--neon-cyan)15' : 'var(--bg-surface)',
              color: instrument === inst ? 'var(--neon-cyan)' : 'var(--text-secondary)',
              border: instrument === inst ? '1px solid var(--neon-cyan)40' : '1px solid transparent',
            }}
          >
            {inst}
          </button>
        ))}
      </div>

      {/* Level List */}
      <div className="flex flex-col gap-2">
        {curriculum.levels.map(level => (
          <LevelCard
            key={level.id}
            level={level}
            isExpanded={expandedLevel === level.id}
            expandedLesson={expandedLesson}
            onToggle={() => setExpandedLevel(expandedLevel === level.id ? null : level.id)}
            onToggleLesson={(id) => setExpandedLesson(expandedLesson === id ? null : id)}
            onSelectDrill={onSelectDrill}
          />
        ))}
      </div>
    </div>
  )
}

function LevelCard({
  level,
  isExpanded,
  expandedLesson,
  onToggle,
  onToggleLesson,
  onSelectDrill,
}: {
  level: Level
  isExpanded: boolean
  expandedLesson: string | null
  onToggle: () => void
  onToggleLesson: (id: string) => void
  onSelectDrill: (drill: Drill, lesson: Lesson) => void
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-hover)' }}
    >
      {/* Level Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
      >
        <span className="text-xl">{level.icon}</span>
        <div className="flex-1">
          <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
            {level.name} <span style={{ color: 'var(--text-muted)' }}>— {level.nameEn}</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{level.subtitle}</div>
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--neon-cyan)' }}>
          {level.lessons.length} lessons
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      {/* Lessons */}
      {isExpanded && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {level.lessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              isExpanded={expandedLesson === lesson.id}
              onToggle={() => onToggleLesson(lesson.id)}
              onSelectDrill={onSelectDrill}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LessonCard({
  lesson,
  isExpanded,
  onToggle,
  onSelectDrill,
}: {
  lesson: Lesson
  isExpanded: boolean
  onToggle: () => void
  onSelectDrill: (drill: Drill, lesson: Lesson) => void
}) {
  return (
    <div
      className="rounded-lg"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bg-surface)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {lesson.title}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {lesson.objectives[0]}
          </div>
        </div>
        <span className="text-xs" style={{ color: 'var(--neon-purple)' }}>
          {lesson.drills.length} drills
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 flex flex-col gap-1">
          {/* Theory */}
          {lesson.theory && (
            <div className="text-xs px-2 py-1 rounded"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            >
              {lesson.theory.markdown.slice(0, 200)}...
            </div>
          )}

          {/* Drills */}
          {lesson.drills.map(drill => (
            <button
              key={drill.id}
              onClick={() => onSelectDrill(drill, lesson)}
              className="flex items-center gap-2 px-3 py-2 rounded text-left hover:opacity-80 transition-all text-sm"
              style={{
                background: 'var(--bg-surface-hover)',
                color: 'var(--text-primary)',
              }}
            >
              <DrillTypeIcon type={drill.type} />
              <div className="flex-1">
                <div>{drill.title}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {drill.description.slice(0, 80)}
                </div>
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--neon-green)' }}>
                {drill.xpReward} XP
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DrillTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    'chord-change': '\u{1F3B8}',
    'strum-pattern': '\u{1F3B5}',
    'arpeggio': '\u{1F3B6}',
    'scale-run': '\u{1F3BC}',
    'fretboard-quiz': '\u{2753}',
    'rhythm': '\u{1F941}',
    'ear-training': '\u{1F442}',
    'song-section': '\u{1F3A4}',
    'voicing-match': '\u{1F3AF}',
    'progression-play': '\u{1F504}',
  }
  return <span className="text-lg">{icons[type] ?? '\u{1F3B5}'}</span>
}
