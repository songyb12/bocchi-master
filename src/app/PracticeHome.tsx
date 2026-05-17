type PracticeView = 'songs' | 'play' | 'curriculum' | 'learn' | 'session' | 'vocal' | 'routine'

interface PracticeHomeProps {
  onQuickStart: () => void
  onOpen: (view: PracticeView) => void
}

const QUICK_ACTIONS: Array<{
  id: PracticeView | 'quick'
  title: string
  subtitle: string
  body: string
  accent: string
}> = [
  {
    id: 'quick',
    title: '바로 15분',
    subtitle: '베이스 워밍업',
    body: '기본 트랙을 열고 바로 손을 풀기 시작합니다.',
    accent: '#fbbc00',
  },
  {
    id: 'routine',
    title: '오늘 루틴',
    subtitle: '체크리스트',
    body: '워밍업, 테크닉, 곡 적용 순서로 연습 시간을 잡습니다.',
    accent: '#71dc8f',
  },
  {
    id: 'songs',
    title: '곡으로 연습',
    subtitle: 'YouTube sync',
    body: '곡 목록, 코드 타임라인, 스템 분리 흐름으로 들어갑니다.',
    accent: '#71dcff',
  },
  {
    id: 'curriculum',
    title: '기초 드릴',
    subtitle: '단계별 훈련',
    body: 'CAGED, 루트, 옥타브, 5도 패턴을 천천히 쌓습니다.',
    accent: '#ffb2be',
  },
]

export function PracticeHome({ onQuickStart, onOpen }: PracticeHomeProps) {
  return (
    <section style={{
      display: 'grid',
      gap: 18,
      color: '#f0f0f0',
    }}>
      <div style={{
        minHeight: 190,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 240px',
        gap: 16,
        padding: 22,
        borderRadius: 8,
        border: '1px solid rgba(251,188,0,0.22)',
        background: '#131313',
        boxShadow: 'inset 4px 0 0 #fbbc00',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 8px', color: '#888', fontSize: 12, fontWeight: 700 }}>Practice Home</p>
            <h1 style={{ margin: 0, fontFamily: 'serif', fontStyle: 'italic', fontSize: 34, lineHeight: 1.12 }}>
              오늘은 어디서 시작할까요?
            </h1>
            <p style={{ margin: '12px 0 0', maxWidth: 680, color: '#aaa', lineHeight: 1.55 }}>
              루틴으로 몸을 풀고, 곡 연습에서 코드와 베이스 라인을 확인한 뒤, 세션으로 저장하는 흐름에 맞췄습니다.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={onQuickStart} style={primaryButton('#fbbc00')}>기본 트랙 시작</button>
            <button onClick={() => onOpen('songs')} style={ghostButton()}>곡 목록</button>
            <button onClick={() => onOpen('routine')} style={ghostButton()}>루틴</button>
          </div>
        </div>
        <div style={{
          display: 'grid',
          alignContent: 'end',
          gap: 6,
          padding: 16,
          borderRadius: 8,
          background: '#1c1b1b',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ color: '#777', fontSize: 12 }}>추천 순서</span>
          <b style={{ color: '#fbbc00' }}>루틴 → 곡 → 세션</b>
          <p style={{ margin: 0, color: '#999', fontSize: 13, lineHeight: 1.45 }}>
            짧게 할 때는 15분 루틴만, 길게 할 때는 곡 연습까지 이어가면 됩니다.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 12,
      }}>
        {QUICK_ACTIONS.map((item) => (
          <button
            key={item.id}
            onClick={() => item.id === 'quick' ? onQuickStart() : onOpen(item.id)}
            style={{
              minHeight: 150,
              display: 'grid',
              alignContent: 'space-between',
              gap: 12,
              padding: 16,
              textAlign: 'left',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#1c1b1b',
              color: '#f0f0f0',
              boxShadow: `inset 3px 0 0 ${item.accent}`,
              cursor: 'pointer',
            }}
          >
            <span style={{ color: item.accent, fontSize: 12, fontWeight: 700 }}>{item.subtitle}</span>
            <strong style={{ fontSize: 20 }}>{item.title}</strong>
            <p style={{ margin: 0, color: '#aaa', lineHeight: 1.45 }}>{item.body}</p>
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
      }}>
        <button onClick={() => onOpen('session')} style={secondaryTile()}>세션 기록</button>
        <button onClick={() => onOpen('learn')} style={secondaryTile()}>베이스 지식</button>
        <button onClick={() => onOpen('vocal')} style={secondaryTile()}>보컬 연습</button>
      </div>
    </section>
  )
}

function primaryButton(background: string) {
  return {
    minHeight: 38,
    padding: '0 14px',
    borderRadius: 8,
    border: `1px solid ${background}`,
    background,
    color: '#0a0a0a',
    fontWeight: 800,
    cursor: 'pointer',
  }
}

function ghostButton() {
  return {
    minHeight: 38,
    padding: '0 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#1c1b1b',
    color: '#f0f0f0',
    fontWeight: 700,
    cursor: 'pointer',
  }
}

function secondaryTile() {
  return {
    minHeight: 58,
    padding: '0 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#131313',
    color: '#ddd',
    fontWeight: 700,
    textAlign: 'left' as const,
    cursor: 'pointer',
  }
}
