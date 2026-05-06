// BassSignalChainRecipe — concrete plugin chain recipe (FL Studio).
// 4-stage card grid: Compressor → NAM → EQ → Limiter, with parameters and analogies.

interface Param {
  k: string
  v: string
  hint?: string
}

interface Stage {
  n: string
  plugin: string
  ko: string
  role: string
  params: Param[]
  analogy: string
  optional?: boolean
}

const STAGES: Stage[] = [
  {
    n: '1',
    plugin: 'Fruity Compressor',
    ko: '컴프레서',
    role: '어택 평탄화',
    params: [
      { k: 'THRESHOLD', v: '-18 ~ -15 dB', hint: '피크가 이 선을 넘으면 압축' },
      { k: 'RATIO',     v: '3:1 ~ 4:1',   hint: '넘은 만큼의 1/3~1/4만 통과' },
      { k: 'ATTACK',    v: '5 ~ 10 ms',   hint: '어택 트랜지언트 살짝 살림' },
      { k: 'RELEASE',   v: '100 ms',      hint: '음 끝나면 빠르게 풀어줌' },
      { k: 'GR (목표)',  v: '-3 ~ -5 dB',  hint: '게인 리덕션 미터 기준' },
    ],
    analogy: 'AGC + soft-knee limiter. 슬랩/핑거 어택 차이 평탄화.',
  },
  {
    n: '2',
    plugin: 'Neural Amp Modeler (NAM)',
    ko: '앰프 시뮬',
    role: '베이스 프리앰프 톤',
    params: [
      { k: 'CAPTURE',   v: 'Darkglass B7K', hint: 'ToneHunt 검색 → .nam 다운' },
      { k: 'DRIVE',     v: '9 ~ 10시',      hint: '약한 오버드라이브 (growl)' },
      { k: 'BLEND',     v: '70%',           hint: 'wet/dry 믹스, 70% wet' },
      { k: 'LO MID',    v: '1시',           hint: '저-중역 살짝 부스트' },
      { k: 'HI MID',    v: '12시',          hint: '중립' },
      { k: 'TREBLE',    v: '12 ~ 1시',      hint: '고역 살짝 살림' },
    ],
    analogy: '비선형 클리핑 (소프트). Darkglass B7K 시그니처 베이스 프리앰프 톤 캡처.',
  },
  {
    n: '3',
    plugin: 'Fruity Parametric EQ 2',
    ko: '4-포인트 EQ',
    role: '주파수 정형',
    params: [
      { k: '80Hz↓',         v: 'HPF (로우컷)', hint: '서브 럼블 제거' },
      { k: '250 ~ 400 Hz',  v: '-2 dB',       hint: '머디 영역 컷' },
      { k: '1 kHz',         v: '+2 dB',       hint: '펀치 강조' },
      { k: '2.5 ~ 3 kHz',   v: '+12 dB',      hint: '프레즌스/엣지 (큰 부스트)' },
    ],
    analogy: 'FIR/IIR 4포인트. 머디 영역 -2dB로 깔끔하게, 어택 영역 강하게 끌어올림.',
  },
  {
    n: '4',
    plugin: 'Fruity Limiter',
    ko: '리미터',
    role: '피크 캡 (옵션)',
    optional: true,
    params: [
      { k: 'THRESHOLD', v: '-3 dB', hint: 'hard ceiling, 클리핑 방지' },
    ],
    analogy: '하드 클리퍼 / brick-wall. 피크가 -3dB 이상 절대 못 가게.',
  },
]

export function BassSignalChainRecipe() {
  return (
    <div className="flex flex-col gap-4">
      {/* Audio interface meta */}
      <div
        className="rounded-lg p-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px]"
        style={{ background: '#0a0a0a', border: '1px dashed #2a2a2a', color: '#aaa' }}
      >
        <div>
          <span style={{ color: '#666' }}>DEVICE · </span>
          <span style={{ color: '#fbbc00' }}>Focusrite USB ASIO</span>
        </div>
        <div>
          <span style={{ color: '#666' }}>BUFFER · </span>
          <span style={{ color: '#fbbc00' }}>128 samples</span>
          <span style={{ color: '#555' }}> (~3 ms @ 44.1 kHz)</span>
        </div>
      </div>

      {/* 4-stage cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {STAGES.map(s => {
          const accent = s.optional ? '#888' : '#fbbc00'
          return (
            <div
              key={s.n}
              className="rounded-lg p-4 flex flex-col gap-3"
              style={{
                background: '#101010',
                border: `1px solid ${s.optional ? '#222' : 'rgba(251,188,0,0.2)'}`,
              }}
            >
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px]" style={{ color: accent + '99' }}>
                    [{s.n}]
                  </span>
                  <span className="font-serif italic" style={{ color: accent, fontSize: 16 }}>
                    {s.plugin}
                  </span>
                  {s.optional && (
                    <span className="font-mono text-[9px]" style={{ color: '#888' }}>
                      · optional
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] mt-1" style={{ color: '#666' }}>
                  {s.ko} · {s.role}
                </div>
              </div>

              {/* Params table */}
              <div className="flex flex-col gap-1.5">
                {s.params.map((p, i) => (
                  <div key={i} className="flex items-baseline gap-2 leading-tight">
                    <span
                      className="font-mono text-[9px] flex-shrink-0"
                      style={{ color: '#666', minWidth: 76 }}
                    >
                      {p.k}
                    </span>
                    <span style={{ color: accent, fontSize: 12, fontWeight: 500 }}>
                      {p.v}
                    </span>
                    {p.hint && (
                      <span
                        className="text-[10px]"
                        style={{ color: '#777', marginLeft: 'auto', textAlign: 'right' }}
                      >
                        {p.hint}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div
                className="font-mono text-[10px] pt-2"
                style={{ color: '#888', borderTop: '1px solid #1c1c1c', lineHeight: 1.5 }}
              >
                ≈ {s.analogy}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tip footer */}
      <div
        className="rounded-lg p-3"
        style={{ background: 'rgba(251,188,0,0.05)', border: '1px solid rgba(251,188,0,0.15)' }}
      >
        <div className="font-mono text-[10px] mb-1" style={{ color: '#fbbc00' }}>
          PRESET TIP
        </div>
        <div style={{ color: '#bbb', fontSize: 12, lineHeight: 1.6 }}>
          한 번 세팅 후 채널 우클릭 →{' '}
          <span style={{ color: '#fbbc00' }}>Save mixer track state as...</span>{' '}
          (.fst) 저장 → 다음부터 1클릭 로드. NAM 캡처는{' '}
          <span style={{ color: '#fbbc00' }}>tonehunt.org</span>에서 "Darkglass B7K" 검색 → .nam 파일 다운로드 후 NAM 플러그인 안에서 로드.
        </div>
      </div>
    </div>
  )
}
