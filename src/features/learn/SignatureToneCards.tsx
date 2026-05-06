// SignatureToneCards — 5 iconic bass tones with recipes.

interface Sig {
  artist: string
  band: string
  bass: string
  tone: string
  recipe: string
  era: string
}

const SIGS: Sig[] = [
  {
    artist: 'James Jamerson',
    band: 'Motown',
    bass: 'P-Bass + flatwound + 검지 1개',
    tone: 'warm, thumpy, 단순',
    recipe: 'P-Bass · flatwound · 100Hz 부스트 · 4kHz 롤오프',
    era: '60s',
  },
  {
    artist: 'Jaco Pastorius',
    band: 'Weather Report',
    bass: '프렛리스 J-Bass + roundwound',
    tone: '노래하는 horn-like growl',
    recipe: 'J-Bass 양 픽업 50:50 · 미드 700Hz +3dB · 살짝 코러스',
    era: '70s',
  },
  {
    artist: 'Flea',
    band: 'Red Hot Chili Peppers',
    bass: 'Modulus / Fender J-Bass',
    tone: 'funky 슬랩 + 멜로딕',
    recipe: 'J-Bass 브릿지 픽업 우세 · 슬랩 · 컴프 강하게',
    era: '90s–',
  },
  {
    artist: 'Geddy Lee',
    band: 'Rush',
    bass: 'J-Bass + 피크',
    tone: 'aggressive, mid 강조',
    recipe: '피크 · 미드 800Hz +4dB · Sansamp 살짝',
    era: '80s',
  },
  {
    artist: 'Cliff Burton',
    band: 'Metallica',
    bass: 'Rickenbacker',
    tone: '리드 베이스, 고역 디스토션',
    recipe: '퍼즈 (Big Muff) · 와우 · 브릿지 픽업',
    era: '80s',
  },
]

export function SignatureToneCards() {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {SIGS.map(s => (
        <div
          key={s.artist}
          className="rounded-lg p-4 transition-all"
          style={{
            background: '#101010',
            border: '1px solid #222',
            cursor: 'default',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(251,188,0,0.5)'
            e.currentTarget.style.boxShadow = '0 0 14px rgba(251,188,0,0.18)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#222'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div className="flex items-baseline justify-between mb-2">
            <div className="font-serif italic" style={{ color: '#fbbc00', fontSize: 17 }}>
              {s.artist}
            </div>
            <div className="font-mono text-[9px]" style={{ color: '#666' }}>
              {s.era}
            </div>
          </div>
          <div className="font-mono text-[10px] mb-3" style={{ color: '#888' }}>
            {s.band}
          </div>
          <div className="space-y-2">
            <div>
              <div className="font-mono text-[9px]" style={{ color: '#666' }}>BASS</div>
              <div style={{ color: '#ccc', fontSize: 12 }}>{s.bass}</div>
            </div>
            <div>
              <div className="font-mono text-[9px]" style={{ color: '#666' }}>TONE</div>
              <div style={{ color: '#ccc', fontSize: 12 }}>{s.tone}</div>
            </div>
            <div
              className="rounded px-2 py-2 mt-2"
              style={{ background: 'rgba(251,188,0,0.06)', border: '1px solid rgba(251,188,0,0.2)' }}
            >
              <div className="font-mono text-[9px]" style={{ color: '#fbbc00' }}>RECIPE</div>
              <div style={{ color: '#fbbc00cc', fontSize: 11, lineHeight: 1.5 }}>{s.recipe}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
