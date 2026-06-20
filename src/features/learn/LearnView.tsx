// LearnView — Bass Tone Workshop, the entry "Learn" view.
// Sections render educational content with interactive visualizations.

import { SignalChainDiagram } from './SignalChainDiagram'
import { ToneVocabulary } from './ToneVocabulary'
import { TechniqueWaveforms } from './TechniqueWaveforms'
import { PickupPositionDemo } from './PickupPositionDemo'
import { EQFrequencyMap } from './EQFrequencyMap'
import { ClippingComparison } from './ClippingComparison'
import { BassSignalChainRecipe } from './BassSignalChainRecipe'
import { BassFrequencyRange } from './BassFrequencyRange'
import { SignatureToneCards } from './SignatureToneCards'

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
        <h2 className="font-serif italic" style={{ color: '#fff', fontSize: 22, fontWeight: 400 }}>
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

const TIPS = [
  { t: 'A/B 토글 습관', d: '한 번에 하나만 바꾸고 듣기. 변수 1개씩 격리 — 디버깅과 동일.' },
  { t: '주파수 sweep 게임', d: '패러메트릭 EQ로 좁은 Q 부스트 + sweep. 어느 주파수 = 어느 형용사인지 매핑.' },
  { t: '레퍼런스 트랙 라이브러리', d: 'warm/bright/growl/slap 4~5곡 정해서 상시 비교.' },
  { t: '솔로 vs 믹스', d: '솔로에선 미드 컷이 멋있어 보이지만, 믹스에선 미드가 있어야 살아남음.' },
  { t: '녹음해서 다시 듣기', d: '다음 날 들으면 객관적으로 들림.' },
]

export function LearnView() {
  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: '#0a0a0a' }}
    >
      <div className="mx-auto px-6 py-8 flex flex-col gap-12" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
            BOCCHI · LEARN
          </div>
          <h1
            className="font-serif italic"
            style={{ color: '#fff', fontSize: 38, fontWeight: 400, lineHeight: 1.1 }}
          >
            Bass Tone Workshop
          </h1>
          <p style={{ color: '#999', fontSize: 14, maxWidth: 720, lineHeight: 1.6 }}>
            베이스 소리를 카테고리로 이해하고, 주법 + 톤 세팅으로 원하는 소리를 만든다.
            UFS 엔지니어 관점(신호처리 비유)으로 정리.
          </p>
        </header>

        <Section number="00" title="신호 체인" subtitle="signal chain · 5-stage pipeline">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            베이스 소리는 5단 직렬 파이프라인. 각 단이 주파수 스펙트럼·엔벨로프를 변형한다.
            귀가 약하면 <em style={{ color: '#fbbc00' }}>한 번에 한 단계씩만 바꾸면서</em> 듣는 게 정석.
          </p>
          <SignalChainDiagram />
        </Section>

        <Section number="01" title="톤 어휘" subtitle="vocabulary · 8 adjectives">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            좋아하는 곡의 베이스에 위 어휘를 붙여보기. 세 막대는 저/중/고 주파수 강도 분포.
          </p>
          <ToneVocabulary />
        </Section>

        <Section number="02" title="주법" subtitle="technique · input waveform">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            같은 함수에 다른 입력 신호 형태를 넣는 셈. fingerstyle = 가우시안 펄스, pick = 거의 디랙 델타,
            slap = 임펄스 + 클리핑. 클릭해서 파형 비교.
          </p>
          <TechniqueWaveforms />
        </Section>

        <Section number="03" title="픽업 위치" subtitle="pickup · sampling point">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            현은 양 끝에서 고정되어 정상파를 만든다. 픽업은 현의 특정 지점에서 진동을 측정 →
            위치에 따라 잡히는 하모닉이 달라짐. 픽업 클릭으로 토글.
          </p>
          <PickupPositionDemo />
        </Section>

        <Section number="03b" title="베이스 음역대" subtitle="bass frequency range · standard tuning + landmarks">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            4현 베이스 표준 튜닝의 주파수 매핑. E1 41Hz부터 1번 G현 12프렛 G3 196Hz까지가 표준 영역.
            5현 베이스는 B0 30.87Hz 한 옥타브 아래로 확장.
          </p>
          <BassFrequencyRange />
        </Section>

        <Section number="04" title="EQ — 주파수대" subtitle="equalizer · 8 bands">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            EQ = FIR/IIR 필터 뱅크. 부스트 = 게인, 컷 = 어테뉴에이션. 대역 클릭으로 부스트/컷 효과 비교.
            베이스 ↔ 킥드럼은 같은 저역대를 두고 싸우니 둘 중 하나가 자리를 양보해야 함.
          </p>
          <EQFrequencyMap />
        </Section>

        <Section number="05" title="다이내믹스 + 디스토션" subtitle="nonlinear shaping">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            컴프 = AGC + soft-knee limiter (어택 평탄화). 오버드라이브/디스토션/퍼즈는
            점진적으로 강해지는 비선형 클리핑. 입력 사인파가 어떻게 변형되는지 비교.
          </p>
          <ClippingComparison />
        </Section>

        <Section number="06" title="실전 레시피 — FL Studio" subtitle="practical recipe · plugin chain">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            앞 섹션은 추상적 원리. 여기서는 실제 FL Studio 채널에 올릴 4단 시그널 체인 한 세트.
            Compressor → NAM(Darkglass B7K 캡처) → Parametric EQ 2 → Limiter 순서. 베이스 트랙에 그대로 적용.
          </p>
          <BassSignalChainRecipe />
        </Section>

        <Section number="07" title="시그니처 톤" subtitle="case studies · iconic bassists">
          <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, maxWidth: 800 }}>
            "내 귀에 좋은 소리"를 알기 어려우면 시그니처 톤 1개를 모방하는 게 빠르다.
            목표 음원을 옆에 틀고 자기 톤을 맞추는 식.
          </p>
          <SignatureToneCards />
        </Section>

        <Section number="08" title="듣는 귀 훈련" subtitle="ear training · engineer's approach">
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {TIPS.map((tip, i) => (
              <li
                key={i}
                className="rounded-lg px-4 py-3"
                style={{ background: '#101010', border: '1px solid #1c1c1c' }}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px]" style={{ color: '#fbbc0088' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="font-serif italic" style={{ color: '#fbbc00', fontSize: 15 }}>
                      {tip.t}
                    </div>
                    <div style={{ color: '#bbb', fontSize: 13, lineHeight: 1.5, marginTop: 2 }}>
                      {tip.d}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* Footer / sources */}
        <footer
          className="pt-6 pb-12"
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            sources · Carvin Audio, TalkBass, MusicRadar, Sweetwater, Wikipedia, StudyBass, FatBassTone, MusicGuyMixing, LedgerNote, 나무위키
          </div>
          <div className="font-mono text-[10px] mt-2" style={{ color: '#444' }}>
            full text: docs/bass-tone-guide.md
          </div>
        </footer>
      </div>
    </div>
  )
}
