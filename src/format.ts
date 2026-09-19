import type { Lang } from './config.js'
import type { History } from './schema.js'

export const pct = (v: number | null | undefined, digits = 1): string =>
  v == null || !Number.isFinite(v) ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`

export function price(v: number | null | undefined, currency: string | null): string {
  if (v == null || !Number.isFinite(v)) return '—'
  const digits = currency === 'KRW' || currency === 'JPY' ? 0 : 2
  return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function usdCap(usd: number): string {
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`
  return `$${(usd / 1e6).toFixed(0)}M`
}

function krwCap(krw: number, lang: Lang): string {
  if (lang === 'ko') {
    if (krw >= 1e12) return `₩${(krw / 1e12).toFixed(krw >= 1e14 ? 0 : 1)}조`
    return `₩${Math.round(krw / 1e8).toLocaleString('en-US')}억`
  }
  if (krw >= 1e12) return `₩${(krw / 1e12).toFixed(1)}T`
  return `₩${(krw / 1e9).toFixed(0)}B`
}

// Won for KR listings (what Korean investors quote), dollars otherwise.
export function marketCap(usd: number | null | undefined, krw?: number | null, lang: Lang = 'ko'): string {
  if (krw != null) return krwCap(krw, lang)
  return usd == null ? '—' : usdCap(usd)
}

// Both currencies when we have both (KR rows), e.g. "₩1476조 · $1.07T".
export function marketCapBoth(usd: number | null | undefined, krw: number | null | undefined, lang: Lang): string {
  if (krw != null && usd != null) return `${krwCap(krw, lang)} · ${usdCap(usd)}`
  return marketCap(usd, krw, lang)
}

export const shortDate = (iso: string): string => iso.slice(5, 10)

export function displayName(c: { name: string | null; name_ko?: string | null; ticker: string }, lang: Lang): string {
  return (lang === 'ko' ? c.name_ko?.trim() || c.name : c.name) || c.ticker
}

// Change over the last session and over the whole fetched range, from closes.
export function changes(history: History | null): { day: number | null; range: number | null; last: number | null } {
  const pts = history?.series.points ?? []
  const last = pts.at(-1)?.close ?? null
  const prev = pts.at(-2)?.close ?? null
  const first = pts[0]?.close ?? null
  return {
    last,
    day: last != null && prev ? ((last - prev) / prev) * 100 : null,
    range: last != null && first && pts.length > 1 ? ((last - first) / first) * 100 : null,
  }
}

const BANDS: Record<string, { ko: string; en: string }> = {
  extreme_fear: { ko: '극단적 공포', en: 'Extreme fear' },
  fear: { ko: '공포', en: 'Fear' },
  neutral: { ko: '중립', en: 'Neutral' },
  greed: { ko: '탐욕', en: 'Greed' },
  extreme_greed: { ko: '극단적 탐욕', en: 'Extreme greed' },
}
export const bandLabel = (band: string | null, lang: Lang): string => (band ? BANDS[band]?.[lang] ?? band : '—')

export const symbolUrl = (base: string, ticker: string, lang: Lang): string =>
  `${base}${lang === 'en' ? '/en' : ''}/symbol/${encodeURIComponent(ticker)}`


// event_timeline.event_type → short column label. Unknown types fall back to
// their first word so new server-side types still render sensibly.
const KINDS: Array<[RegExp, { ko: string; en: string }]> = [
  [/^earnings|^ir_/, { ko: '실적', en: 'Earnings' }],
  [/^analyst/, { ko: '리포트', en: 'Analyst' }],
  [/^institutional|13f/i, { ko: '기관', en: '13F' }],
  [/insider|exec/, { ko: '내부자', en: 'Insider' }],
  [/major|holding|stake/, { ko: '대량보유', en: 'Stake' }],
  [/^transcript|call/, { ko: '컨콜', en: 'Call' }],
  [/^dividend/, { ko: '배당', en: 'Dividend' }],
  [/^news/, { ko: '뉴스', en: 'News' }],
  [/filing|disclosure|dart|sec_|^8-?k|^10-?[kq]/i, { ko: '공시', en: 'Filing' }],
]
export function eventKind(kind: string, lang: Lang): string {
  const k = kind.replace(/^(kr|us|jp|global)_/, '')
  for (const [re, label] of KINDS) if (re.test(k)) return label[lang]
  return k.split(/[_\s]/)[0] ?? k
}

// Consensus upside from the freshest price we have (the chart's last close)
// rather than the server's cached companies.last_price, which can lag.
export function targetGap(target: number | null | undefined, last: number | null, fallback: number | null | undefined): number | null {
  if (target != null && last != null && last > 0) return ((target - last) / last) * 100
  return fallback ?? null
}
