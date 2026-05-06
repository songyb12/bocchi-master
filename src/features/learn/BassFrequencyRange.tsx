// BassFrequencyRange — 베이스 4현 표준 튜닝 + 음역대 시각화.
//
// 표준 튜닝 4현은 E1(41Hz) ~ G3(196Hz) 12프렛까지. 베이스 학습자가 자신이
// 짚는 음의 절대 주파수와 옥타브 위치를 한눈에 파악할 수 있도록.

interface StringInfo {
  name: string
  open: { note: string; freq: number; midi: number }
  octaveFret: number // 12 — 옥타브 위 위치
}

const STRINGS: StringInfo[] = [
  { name: 'G', open: { note: 'G2', freq: 98.0,  midi: 43 }, octaveFret: 12 },
  { name: 'D', open: { note: 'D2', freq: 73.42, midi: 38 }, octaveFret: 12 },
  { name: 'A', open: { note: 'A1', freq: 55.0,  midi: 33 }, octaveFret: 12 },
  { name: 'E', open: { note: 'E1', freq: 41.2,  midi: 28 }, octaveFret: 12 },
]

// Reference markers — orchestral / production landmarks
const LANDMARKS: Array<{ freq: number; label: string; ko: string }> = [
  { freq: 30.87, label: 'B0',  ko: '5현 베이스 최저음' },
  { freq: 41.2,  label: 'E1',  ko: '4현 베이스 최저음 (E0 = 4번현 0프렛)' },
  { freq: 55,    label: 'A1',  ko: 'A현 개방' },
  { freq: 82.41, label: 'E2',  ko: '4번현 12프렛 = 옥타브 위. 록 베이스 핵심대' },
  { freq: 110,   label: 'A2',  ko: 'A현 12프렛' },
  { freq: 196,   label: 'G3',  ko: '1번현 12프렛 — 베이스 표준 영역 끝' },
  { freq: 261.6, label: 'C4',  ko: '중앙 C — 베이스로는 슬랩/탭/하이 포지션' },
  { freq: 440,   label: 'A4',  ko: 'A4 표준 튜너 기준 (피아노 중심)' },
]

const FREQ_MIN = 25
const FREQ_MAX = 500

function freqToX(f: number): number {
  return ((Math.log(f) - Math.log(FREQ_MIN)) / (Math.log(FREQ_MAX) - Math.log(FREQ_MIN))) * 100
}

export function BassFrequencyRange() {
  return (
    <div className="flex flex-col gap-4">
      {/* Strings table */}
      <div
        className="rounded-lg p-4"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        <div className="font-mono text-[10px] mb-3" style={{ color: '#666' }}>
          STANDARD TUNING · 4-string bass
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: '60px 1fr 1fr 1fr 1fr' }}>
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>STRING</div>
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>OPEN NOTE</div>
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>FREQ (Hz)</div>
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>MIDI</div>
          <div className="font-mono text-[10px]" style={{ color: '#fbbc00' }}>OCTAVE @12fr</div>

          {STRINGS.map((s) => (
            <div key={s.name} className="contents">
              <div
                className="font-serif italic"
                style={{ color: '#fbbc00', fontSize: 18 }}
              >
                {s.name}
              </div>
              <div style={{ color: '#ddd', fontSize: 13 }}>{s.open.note}</div>
              <div className="font-mono" style={{ color: '#ddd', fontSize: 12 }}>
                {s.open.freq.toFixed(2)}
              </div>
              <div className="font-mono" style={{ color: '#888', fontSize: 12 }}>
                {s.open.midi}
              </div>
              <div className="font-mono" style={{ color: '#7eff8b', fontSize: 12 }}>
                {(s.open.freq * 2).toFixed(2)} Hz
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequency landmark axis */}
      <div
        className="rounded-lg p-4"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-mono text-[10px]" style={{ color: '#666' }}>
            FREQUENCY LANDMARKS · log scale 25 Hz – 500 Hz
          </div>
          <div className="font-mono text-[10px]" style={{ color: '#7eff8b' }}>
            ━ 4-string bass range
          </div>
        </div>

        {/* Range bar */}
        <div className="relative" style={{ height: 24 }}>
          <div
            className="absolute"
            style={{
              top: 8,
              height: 8,
              left: `${freqToX(41.2)}%`,
              width: `${freqToX(196) - freqToX(41.2)}%`,
              background: 'linear-gradient(90deg, #fbbc00aa 0%, #fbbc0044 100%)',
              borderRadius: 2,
            }}
            title="E1 (41.2Hz) – G3 (196Hz)"
          />
          <div
            className="absolute"
            style={{
              top: 8,
              height: 8,
              left: `${freqToX(30.87)}%`,
              width: `${freqToX(41.2) - freqToX(30.87)}%`,
              background: 'rgba(126,255,139,0.15)',
              borderRadius: 2,
            }}
            title="5-string bass extension (B0 ~ E1)"
          />
        </div>

        {/* Landmark markers */}
        <div className="relative mt-3" style={{ height: 56 }}>
          {LANDMARKS.map((lm) => {
            const x = freqToX(lm.freq)
            const isBassRange = lm.freq >= 41.2 && lm.freq <= 196
            return (
              <div
                key={lm.label}
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: 0,
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  width: 90,
                }}
              >
                <div
                  style={{
                    width: 1,
                    height: 8,
                    background: isBassRange ? '#fbbc00' : '#444',
                    margin: '0 auto',
                  }}
                />
                <div
                  className="font-mono text-[10px]"
                  style={{
                    color: isBassRange ? '#fbbc00' : '#888',
                    fontWeight: isBassRange ? 600 : 400,
                  }}
                >
                  {lm.label}
                </div>
                <div
                  className="font-mono text-[8px]"
                  style={{ color: '#666' }}
                >
                  {lm.freq.toFixed(0)}Hz
                </div>
                <div
                  className="text-[9px] mt-0.5"
                  style={{ color: isBassRange ? '#bbb' : '#555', lineHeight: 1.3 }}
                >
                  {lm.ko}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <div
        className="rounded-lg p-3"
        style={{ background: '#0a0a0a', border: '1px dashed #2a2a2a' }}
      >
        <div className="font-mono text-[10px] mb-2" style={{ color: '#fbbc00' }}>
          PRACTICE NOTES
        </div>
        <ul
          className="text-[12px] list-none p-0 m-0 flex flex-col gap-1"
          style={{ color: '#bbb', lineHeight: 1.6 }}
        >
          <li>
            <span style={{ color: '#fbbc00aa' }}>▸</span> EQ 80–200 Hz 부스트가 베이스 "두께" — 4번 E현 영역
          </li>
          <li>
            <span style={{ color: '#fbbc00aa' }}>▸</span> 200–300 Hz는 머디 영역. 다른 악기와 충돌 시 컷
          </li>
          <li>
            <span style={{ color: '#fbbc00aa' }}>▸</span> 12프렛 = 정확히 옥타브 위. E0 → E2 (41 → 82 Hz)
          </li>
          <li>
            <span style={{ color: '#fbbc00aa' }}>▸</span> 5현 베이스(B0 = 30.87 Hz)는 표준 4현 영역 한 옥타브 아래까지 확장
          </li>
        </ul>
      </div>
    </div>
  )
}
