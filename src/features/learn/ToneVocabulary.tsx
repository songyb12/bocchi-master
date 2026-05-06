// ToneVocabulary — 7 tone adjectives with mini frequency spectrum bars.
// Each card has 3 bars (low/mid/high) showing typical frequency emphasis.

interface Vocab {
  term: string
  ko: string
  bars: [number, number, number] // 0..1 for low/mid/high
  desc: string
  analogy: string
  warn?: boolean
}

const VOCAB: Vocab[] = [
  { term: 'Warm',    ko: '웜',     bars: [0.95, 0.55, 0.20], desc: '부드럽고 둥근. 저역 강 + 고역 약',          analogy: 'LPF 걸린 사인파' },
  { term: 'Bright',  ko: '브라이트', bars: [0.30, 0.55, 0.90], desc: '밝고 또렷. 저역 약 + 고역 강',             analogy: 'HPF 걸린 톱니파' },
  { term: 'Thump',   ko: '썸프',    bars: [0.95, 0.65, 0.25], desc: '"퉁/둥" 펀치. 저역 + 미드 약간',           analogy: '임펄스 응답 짧음' },
  { term: 'Growl',   ko: '그라울',  bars: [0.40, 0.85, 0.70], desc: '"그르르". 어퍼미드~고역 강조',             analogy: '살짝 클리핑 + 고차 하모닉' },
  { term: 'Grunt',   ko: '그런트',  bars: [0.60, 0.85, 0.40], desc: '"그르엉". 로우미드 + 약한 오버드라이브',  analogy: '비대칭 클리핑' },
  { term: 'Sizzle',  ko: '시즐',    bars: [0.25, 0.40, 0.95], desc: '반짝거림. 8kHz↑ 하모닉',                   analogy: '고차 오버톤 잔향' },
  { term: 'Mud',     ko: '머드',    bars: [0.70, 0.95, 0.30], desc: '답답. 200~300Hz 과다',                     analogy: '콤필터처럼 마스킹', warn: true },
]

const LABELS = ['LOW', 'MID', 'HIGH']

export function ToneVocabulary() {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
      {VOCAB.map(v => {
        const accent = v.warn ? '#ff7575' : '#fbbc00'
        return (
          <div
            key={v.term}
            className="rounded-lg p-4 transition-all"
            style={{
              background: '#101010',
              border: `1px solid ${v.warn ? 'rgba(255,117,117,0.25)' : '#222'}`,
              cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = v.warn ? 'rgba(255,117,117,0.6)' : 'rgba(251,188,0,0.5)'
              e.currentTarget.style.boxShadow = `0 0 14px ${v.warn ? 'rgba(255,117,117,0.18)' : 'rgba(251,188,0,0.18)'}`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = v.warn ? 'rgba(255,117,117,0.25)' : '#222'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div className="flex items-baseline gap-2 mb-3">
              <div className="font-serif italic" style={{ color: accent, fontSize: 22 }}>
                {v.term}
              </div>
              <div className="font-mono text-[10px]" style={{ color: '#666' }}>
                {v.ko}
                {v.warn && <span className="ml-1" style={{ color: '#ff7575' }}>· avoid</span>}
              </div>
            </div>

            {/* Mini spectrum: 3 bars (low/mid/high) */}
            <div className="mb-3">
              <div className="flex items-end gap-2" style={{ height: 56 }}>
                {v.bars.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h * 100}%`,
                      background: `linear-gradient(180deg, ${accent}55 0%, ${accent}cc 100%)`,
                      borderRadius: 2,
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                {LABELS.map((l, i) => (
                  <div
                    key={i}
                    className="font-mono text-[9px] text-center"
                    style={{ flex: 1, color: '#555' }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ color: '#bbb', fontSize: 12, lineHeight: 1.5 }}>
              {v.desc}
            </div>
            <div className="font-mono text-[10px] mt-2" style={{ color: '#777' }}>
              ≈ {v.analogy}
            </div>
          </div>
        )
      })}
    </div>
  )
}
