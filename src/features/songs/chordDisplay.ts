// Display helpers for the chord timeline — Crema label normalization and the
// shared color tokens. Extracted verbatim from ChordTimeline so the renderers
// (ContinuousRow / MeasureGrid) and the host component share one source.

/** Pull the root note (with sharps/flats Korean-rendered) from a Crema label. */
export function extractRoot(raw: string): string {
  if (!raw || raw === 'N' || raw === 'X') return ''
  const [rootPart] = raw.split(':')
  return rootPart.replace(/#/g, '♯').replace(/b/g, '♭')
}

// Crema labels: "A#:maj", "F#:min7", "C:7", "G#:maj/3", "N" (no chord)
export function normalizeLabel(raw: string): string {
  if (!raw || raw === 'N' || raw === 'X') return '—'
  const [rootPart, qualityPart = ''] = raw.split(':')
  const root = rootPart.replace(/#/g, '♯').replace(/b/g, '♭')
  const [quality, slash] = qualityPart.split('/')
  let suffix = ''
  switch (quality) {
    case 'maj':   suffix = ''; break
    case 'min':   suffix = 'm'; break
    case 'min7':  suffix = 'm7'; break
    case 'maj7':  suffix = 'maj7'; break
    case '7':     suffix = '7'; break
    case 'min6':  suffix = 'm6'; break
    case 'maj6':  suffix = '6'; break
    case 'dim':   suffix = '°'; break
    case 'aug':   suffix = '+'; break
    case 'sus4':  suffix = 'sus4'; break
    case 'sus2':  suffix = 'sus2'; break
    case 'min9':  suffix = 'm9'; break
    case 'maj9':  suffix = 'maj9'; break
    case '9':     suffix = '9'; break
    case '':      suffix = ''; break
    default:      suffix = quality
  }
  return slash ? `${root}${suffix}/${slash}` : `${root}${suffix}`
}

export const C = {
  surface:  '#1c1b1b',
  surface2: '#131313',
  amber:    '#fbbc00',
  amberDim: 'rgba(251,188,0,0.12)',
  rose:     '#ffb2be',
  green:    '#71dc8f',
  textPri:  '#f0f0f0',
  textSec:  '#888888',
  textMut:  '#555555',
}
