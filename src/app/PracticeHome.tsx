import type { CSSProperties } from 'react'

type PracticeView = 'songs' | 'play' | 'curriculum' | 'learn' | 'session' | 'vocal' | 'routine'

interface PracticeHomeProps {
  onQuickStart: () => void
  onOpen: (view: PracticeView) => void
}

const PRIMARY_ACTIONS: Array<{
  id: PracticeView
  title: string
  label: string
  body: string
  metric: string
  accent: string
}> = [
  {
    id: 'routine',
    title: '15분 루틴',
    label: '오늘 시작점',
    body: '워밍업, 손가락 독립, 리듬, 짧은 적용까지 한 번에 훑습니다.',
    metric: '15 min',
    accent: '#fbbc00',
  },
  {
    id: 'songs',
    title: '곡으로 연습',
    label: '코드와 박자',
    body: '곡 목록에서 YouTube, 코드 타임라인, 구간 반복으로 이어집니다.',
    metric: 'Song',
    accent: '#71dcff',
  },
  {
    id: 'curriculum',
    title: '기초 드릴',
    label: '손에 남기는 패턴',
    body: 'CAGED, 루트, 옥타브, 5도 패턴을 느린 템포로 쌓습니다.',
    metric: 'Drill',
    accent: '#ffb2be',
  },
  {
    id: 'session',
    title: '세션 기록',
    label: '오늘 남기기',
    body: '연습한 곡, 템포, 막힌 구간을 기록해서 다음 연습으로 넘깁니다.',
    metric: 'Log',
    accent: '#71dc8f',
  },
]

const FLOW_STEPS = [
  ['1', '루틴', '손 풀기'],
  ['2', '드릴', '패턴 확인'],
  ['3', '곡', '구간 반복'],
  ['4', '기록', '다음 과제'],
]

export function PracticeHome({ onQuickStart, onOpen }: PracticeHomeProps) {
  return (
    <section className="practice-home">
      <div className="practice-hero">
        <div className="practice-hero-copy">
          <p className="practice-eyebrow">Practice Home</p>
          <h1>오늘 연습은 루틴에서 시작합니다.</h1>
          <p>
            짧게는 15분 루틴만 끝내고, 여유가 있으면 드릴과 곡 반복까지 이어가면 됩니다.
          </p>
          <div className="practice-hero-actions">
            <button onClick={() => onOpen('routine')} className="practice-primary">15분 루틴 시작</button>
            <button onClick={onQuickStart} className="practice-ghost">기본 트랙 바로 재생</button>
            <button onClick={() => onOpen('songs')} className="practice-ghost">곡 목록</button>
          </div>
        </div>
        <div className="practice-flow">
          {FLOW_STEPS.map(([step, title, body]) => (
            <div key={step}>
              <span>{step}</span>
              <b>{title}</b>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="practice-action-grid">
        {PRIMARY_ACTIONS.map((item) => (
          <button
            key={item.id}
            onClick={() => onOpen(item.id)}
            className="practice-action-card"
            style={{ '--accent': item.accent } as CSSProperties}
          >
            <span>{item.label}</span>
            <b>{item.title}</b>
            <p>{item.body}</p>
            <em>{item.metric}</em>
          </button>
        ))}
      </div>

      <div className="practice-secondary-grid">
        <button onClick={onQuickStart}>트랙 바로 재생</button>
        <button onClick={() => onOpen('learn')}>베이스 지식</button>
        <button onClick={() => onOpen('vocal')}>보컬 연습</button>
      </div>
    </section>
  )
}
