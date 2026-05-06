// VocalRangeMap — Chest / Mix / Head voice 영역 + passaggio 표시.
// 음역대(C2 ~ C6)를 가로 축으로, 4가지 voice type을 영역으로.

interface VoiceType {
  name: string
  ko: string
  ranges: [string, string]  // [low, high] note names
  freqs: [number, number]   // [low, high] Hz
  color: string
  desc: string
}

const VOICE_TYPES: VoiceType[] = [
  { name: 'Chest',  ko: '흉성',     ranges: ['C2', 'E4'], freqs: [65.41, 329.6], color: '#fbbc00', desc: '말할 때 자연스러운 음역. 풍부, 따뜻, 단단. 무리 시 거칠어짐.' },
  { name: 'Mix',    ko: '믹스',     ranges: ['E4', 'A4'], freqs: [329.6, 440.0], color: '#7eff8b', desc: '흉성 + 두성의 균형 영역. 팝/J-Pop 보컬의 sweet spot. passaggio 통과 핵심.' },
  { name: 'Head',   ko: '두성',     ranges: ['A4', 'C6'], freqs: [440.0, 1046.5], color: '#71dcff', desc: '얇고 가볍지만 멀리 뻗는 소리. 고음 안정 시 사용. 흉성과 자연스럽게 연결되어야.' },
  { name: 'Falsetto', ko: '팔세토', ranges: ['G4', 'C6'], freqs: [392.0, 1046.5], color: '#ffb2be', desc: '가성 — 성대 일부만 진동. 두성과 다름 (두성은 풀 진동). R&B/팝 발라드에 자주.' },
]

const F_MIN = 60
const F_MAX = 1100

function freqToX(f: number): number {
  return ((Math.log(f) - Math.log(F_MIN)) / (Math.log(F_MAX) - Math.log(F_MIN))) * 100
}

const PASSAGGIO_NOTES = [
  { name: 'P1 (E4)', freq: 329.6, label: 'Chest → Mix 1차 패시지오' },
  { name: 'P2 (A4)', freq: 440.0, label: 'Mix → Head 2차 패시지오' },
]

const TICKS = [
  { note: 'C2', freq: 65.41 },
  { note: 'C3', freq: 130.8 },
  { note: 'C4', freq: 261.6, label: '중앙 C' },
  { note: 'A4', freq: 440.0, label: '튜닝 기준' },
  { note: 'C5', freq: 523.3 },
  { note: 'C6', freq: 1046.5 },
]

export function VocalRangeMap() {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-lg p-4"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            VOICE TYPES · log frequency · C2 (65 Hz) – C6 (1046 Hz)
          </div>
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>
            ▼ passaggio
          </div>
        </div>

        {/* 4 voice type ranges stacked */}
        <div className="relative" style={{ height: 96 }}>
          {VOICE_TYPES.map((vt, i) => {
            const x = freqToX(vt.freqs[0])
            const w = freqToX(vt.freqs[1]) - freqToX(vt.freqs[0])
            return (
              <div
                key={vt.name}
                className="absolute flex items-center px-2"
                style={{
                  left: `${x}%`,
                  width: `${w}%`,
                  top: i * 22,
                  height: 18,
                  background: `${vt.color}33`,
                  border: `1px solid ${vt.color}88`,
                  borderRadius: 3,
                }}
                title={`${vt.ko} · ${vt.ranges[0]} ~ ${vt.ranges[1]} (${vt.freqs[0].toFixed(1)} ~ ${vt.freqs[1].toFixed(1)} Hz)`}
              >
                <span className="font-mono text-[10px]" style={{ color: vt.color, fontWeight: 600 }}>
                  {vt.name} · {vt.ko}
                </span>
              </div>
            )
          })}
        </div>

        {/* Passaggio markers */}
        <div className="relative mt-2" style={{ height: 18 }}>
          {PASSAGGIO_NOTES.map((p) => (
            <div
              key={p.name}
              className="absolute"
              style={{
                left: `${freqToX(p.freq)}%`,
                transform: 'translateX(-50%)',
                top: 0,
              }}
              title={p.label}
            >
              <div style={{ color: '#fbbc00', fontSize: 11, lineHeight: 1 }}>▼</div>
              <div className="font-mono text-[8px]" style={{ color: '#fbbc0099', whiteSpace: 'nowrap', transform: 'translateX(-50%)' }}>
                {p.name}
              </div>
            </div>
          ))}
        </div>

        {/* Frequency tick axis */}
        <div className="relative mt-2" style={{ height: 22 }}>
          {TICKS.map((t) => (
            <div
              key={t.note}
              className="absolute"
              style={{
                left: `${freqToX(t.freq)}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div style={{ width: 1, height: 6, background: '#444', margin: '0 auto' }} />
              <div className="font-mono text-[9px]" style={{ color: '#888' }}>
                {t.note}
              </div>
              {t.label && (
                <div className="font-mono text-[8px]" style={{ color: '#555', whiteSpace: 'nowrap' }}>
                  {t.label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Voice type cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {VOICE_TYPES.map((vt) => (
          <div
            key={vt.name}
            className="rounded-lg p-3"
            style={{
              background: '#101010',
              border: `1px solid ${vt.color}33`,
            }}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-serif italic" style={{ color: vt.color, fontSize: 16 }}>
                {vt.name}
              </span>
              <span className="font-mono text-[9px]" style={{ color: '#888' }}>
                {vt.ranges[0]} – {vt.ranges[1]}
              </span>
            </div>
            <div className="font-mono text-[10px] mb-1" style={{ color: '#666' }}>
              {vt.ko}
            </div>
            <div style={{ color: '#bbb', fontSize: 12, lineHeight: 1.5 }}>
              {vt.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
