// VocalView — 보컬 학습 가이드. Learn 탭과 같은 Amplified Underground 톤.

import { BreathingDiagram } from './BreathingDiagram'
import { VocalRangeMap } from './VocalRangeMap'
import { WarmupExercises } from './WarmupExercises'

interface SectionProps {
  number: string
  title: string
  subtitle?: string
  children: React.ReactNode
}

function Section({ number, title, subtitle, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs" style={{ color: '#fbbc0099' }}>
          {number}
        </span>
        <h2
          className="font-serif italic"
          style={{ color: '#fff', fontSize: 22, fontWeight: 400 }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="font-mono text-[11px]" style={{ color: '#888', marginTop: -8 }}>
          {subtitle}
        </p>
      )}
      {children}
    </section>
  )
}

const TONE_BY_GENRE: Array<{ genre: string; tone: string; tip: string }> = [
  { genre: 'J-Pop / 시티팝',     tone: '맑고 가볍게, 고음에서 mix 활용',  tip: '가성/mix 비중 높음. 호흡 길게, vibrato 자제' },
  { genre: 'R&B / Soul',          tone: '풍부 + 멜리스마 + 다이내믹',     tip: 'mix-head 자유 전환. runs/riffs 연습 필수' },
  { genre: 'Rock / Pop-Rock',     tone: '강한 chest + 짧은 결정적 음',    tip: '복식 호흡 + 마이크 조절로 음량 유지. 무리 X' },
  { genre: 'Indie / Folk',        tone: '말하듯 자연스럽게 + 약간 낮게',  tip: 'breathy tone 의식적. 마이크 가깝게' },
  { genre: 'Ballad',              tone: '풍부한 chest → mix 자연 이동',  tip: '단어 하나하나 의도, 모음 길이가 90%' },
]

const POSTURE_TIPS = [
  '발은 어깨 너비, 무릎 살짝 풀고 체중은 중앙 → 앞쪽',
  '척추는 곧게, 어깨는 자연스럽게 떨어짐. 턱 들지 않기',
  '얼굴 중심선과 마이크가 일직선 (마이크는 입에서 1-2 손가락 거리)',
  '복근에 가벼운 텐션 유지 (호흡 지지). 어깨/목은 풀어짐',
]

const DAILY_CARE = [
  { ko: '수분',         tip: '하루 2L 물. 노래 30분 전부터 미지근한 물 천천히' },
  { ko: '카페인 회피', tip: '커피 / 차는 가창 4시간 전 멈춤 (점막 건조)' },
  { ko: '잠',           tip: '7시간 이상. 수면 부족 시 음역대 1-2 반음 줄어듦' },
  { ko: '목 사용',      tip: '큰 소리로 말하기 / 헛기침 회피. 속삭임도 무리' },
  { ko: '온도/습도',   tip: '실내 50-60% 습도. 마른 공기는 점막 자극' },
  { ko: '스트레칭',    tip: '목 좌우 회전, 어깨 돌리기, 입/턱 풀기 5분' },
]

const SELF_EVAL = [
  '폰 / 컴퓨터로 한 곡 녹음 (반주 없이 순 vocal 한 번)',
  '재생: 음정 / 박자 / 발음 / 호흡 4가지로 분리 평가',
  '음정: 음치 앱 (Vocal Pitch Monitor 등)으로 시각 확인',
  '문제 부분 표시 → 다음 워밍업에 그 음정으로 사이렌 + lip trill',
  '주 1회 같은 곡 녹음 → 변화 추적',
]

export function VocalView() {
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#0a0a0a' }}>
      <div className="mx-auto px-6 py-8 flex flex-col gap-12" style={{ maxWidth: 1100 }}>
        <header className="flex flex-col gap-2">
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
            BOCCHI · VOCAL
          </div>
          <h1
            className="font-serif italic"
            style={{ color: '#fff', fontSize: 38, fontWeight: 400, lineHeight: 1.1 }}
          >
            Vocal Workshop
          </h1>
          <p style={{ color: '#999', fontSize: 14, maxWidth: 720, lineHeight: 1.6 }}>
            보컬을 잘하기 위한 evidence-based 가이드. 호흡 → 워밍업 → 음역대 → 발성 → 자세 → 톤 →
            관리 → 자기 평가의 8단계. 매일 15분 루틴이 주 2시간 몰아 연습보다 강함.
          </p>
        </header>

        <Section number="00" title="호흡 — 모든 것의 시작" subtitle="diaphragmatic vs clavicular breathing">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            보컬의 90%는 호흡. 흉식(어깨 위로)은 일상 호흡엔 OK이나 가창엔 부족 — 짧고 얕음.
            복식(배 앞으로)이 정답: 횡격막이 아래로 내려가며 폐 아래쪽까지 채움. 토글로 비교.
          </p>
          <BreathingDiagram />
        </Section>

        <Section number="01" title="워밍업 — 매일 14분" subtitle="warmup · SOVT + scales + humming">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            노래 전에 항상. 5종 운동 — lip trill / siren / straw / humming / vowel scales.
            Lip trill + straw는 SOVT (Semi-Occluded Vocal Tract)로 성대 부담 ↓ + 효율 ↑. 의학적 검증.
          </p>
          <WarmupExercises />
        </Section>

        <Section number="02" title="음역대 — Chest / Mix / Head / Falsetto" subtitle="voice types · passaggio">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            음역대는 단순 high/low가 아니라 4가지 영역. passaggio (E4, A4 부근)에서 영역 전환되며
            끊김 없이 통과시키는 게 핵심. 사이렌 워밍업이 이 통과를 훈련.
          </p>
          <VocalRangeMap />
        </Section>

        <Section number="03" title="발성 — 모음 + 자음" subtitle="phonation · vowels lead the tone">
          <div
            className="rounded-lg p-4 grid gap-3"
            style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
          >
            {[
              { vowel: 'AH', ko: '아', mouth: '입을 동그랗게 크게', use: '큰 음량 / 강조' },
              { vowel: 'EH', ko: '에', mouth: '입꼬리 살짝 옆으로', use: '말하듯 자연스러움' },
              { vowel: 'EE', ko: '이', mouth: '입꼬리 옆으로 + 좁게', use: '고음에서 안정' },
              { vowel: 'OH', ko: '오', mouth: '입을 동그랗게 작게', use: '풍부한 톤' },
              { vowel: 'OO', ko: '우', mouth: '입술 앞으로 동그랗게 작게', use: '가성 / mix' },
            ].map((v) => (
              <div key={v.vowel} className="rounded-md p-3" style={{ background: '#141414', border: '1px solid #222' }}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-serif italic" style={{ color: '#fbbc00', fontSize: 18 }}>
                    {v.vowel}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: '#888' }}>
                    {v.ko}
                  </span>
                </div>
                <div className="font-mono text-[10px] mb-1" style={{ color: '#7eff8b' }}>
                  {v.mouth}
                </div>
                <div style={{ color: '#bbb', fontSize: 11, lineHeight: 1.5 }}>{v.use}</div>
              </div>
            ))}
          </div>
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            가사의 90%는 모음 길이 + 입 모양으로 결정. 자음은 빠르게 통과. "<em style={{ color: '#fff' }}>모음에 노래가 있다</em>" — 김광석/박정현 모두 이 원칙.
          </p>
        </Section>

        <Section number="04" title="자세 — Posture + Mic Distance" subtitle="body alignment">
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {POSTURE_TIPS.map((tip, i) => (
              <li
                key={i}
                className="rounded-md px-4 py-3"
                style={{ background: '#101010', border: '1px solid #1c1c1c' }}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px]" style={{ color: '#fbbc0088' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ color: '#ddd', fontSize: 13, lineHeight: 1.5 }}>{tip}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section number="05" title="톤 — 장르별 가이드" subtitle="genre-aware tone shaping">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {TONE_BY_GENRE.map((g) => (
              <div
                key={g.genre}
                className="rounded-lg p-4"
                style={{ background: '#101010', border: '1px solid #222' }}
              >
                <div className="font-serif italic mb-2" style={{ color: '#fbbc00', fontSize: 16 }}>
                  {g.genre}
                </div>
                <div className="font-mono text-[10px] mb-2" style={{ color: '#7eff8b' }}>
                  TONE
                </div>
                <div style={{ color: '#bbb', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                  {g.tone}
                </div>
                <div className="font-mono text-[10px] mb-1" style={{ color: '#888' }}>
                  TIP
                </div>
                <div style={{ color: '#aaa', fontSize: 12, lineHeight: 1.5 }}>{g.tip}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section number="06" title="일상 관리" subtitle="daily care · don't break the instrument">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {DAILY_CARE.map((c) => (
              <div
                key={c.ko}
                className="rounded-md p-3"
                style={{ background: '#101010', border: '1px solid #1c1c1c' }}
              >
                <div className="font-serif italic" style={{ color: '#fbbc00', fontSize: 15 }}>
                  {c.ko}
                </div>
                <div style={{ color: '#bbb', fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>
                  {c.tip}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section number="07" title="자기 평가 — 녹음 + 듣기" subtitle="metacognition · the most underused tool">
          <ol className="list-decimal pl-5 flex flex-col gap-2" style={{ color: '#bbb', fontSize: 13, lineHeight: 1.6 }}>
            {SELF_EVAL.map((s, i) => (
              <li key={i} style={{ paddingLeft: 4 }}>
                {s}
              </li>
            ))}
          </ol>
        </Section>

        <footer
          className="pt-6 pb-12"
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            sources · Musicians Institute, School of Rock, Forbrain, Berklee Online,
            Singing Range Test, Soundverse AI, Vocal Range Test, Tonegym
          </div>
        </footer>
      </div>
    </div>
  )
}
