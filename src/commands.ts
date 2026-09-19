// Non-interactive commands: print once and exit. With --json they print the
// server response verbatim (after schema validation) for pipes and agents.
import { api } from './api.js'
import { API_URL, loadCredentials, loadState, saveState, type Lang } from './config.js'
import { bandLabel, changes, displayName, eventKind, marketCap, marketCapBoth, pct, price, shortDate, symbolUrl, targetGap } from './format.js'
import { lineChart } from './ui/chart.js'
import { color, paint } from './ui/color.js'
import { padW, table, wrapW } from './ui/width.js'
import type { ChartRange } from './schema.js'

export type Flags = { json: boolean; lang: Lang; color: boolean; ascii: boolean; range: ChartRange }

const out = (s: string): void => { process.stdout.write(`${s}\n`) }
const json = (v: unknown): void => out(JSON.stringify(v, null, 2))

export function requireToken(lang: Lang): string {
  const creds = loadCredentials()
  if (!creds) {
    throw new Error(lang === 'ko' ? '로그인이 필요합니다. `argos login`을 실행하세요.' : 'Sign in first: run `argos login`.')
  }
  return creds.token
}

const tone = (v: number | null | undefined) => (v == null ? 'gray' : v >= 0 ? 'green' : 'red')

export async function brief(ticker: string, f: Flags): Promise<void> {
  const [sym, hist] = await Promise.all([
    api.symbol(ticker, f.lang),
    api.history(ticker, f.range).catch(() => null),
  ])
  if (f.json) return json({ ...sym, brief: await api.brief(sym), history: hist?.series ?? null })

  const c = paint(f.color)
  const ko = f.lang === 'ko'
  const ch = changes(hist)
  const cols = Math.min(process.stdout.columns || 80, 100)
  const last = ch.last ?? sym.quote?.price ?? null

  out(`${c.bold(sym.company.ticker)}  ${displayName(sym.company, f.lang)}  ${c.dim(sym.company.exchange ?? '')}`)
  out(`${price(last, sym.company.currency)} ${sym.company.currency ?? ''}  ${c[tone(ch.day)](pct(ch.day))} ${c.dim(ko ? '전일' : '1D')}  ${c[tone(ch.range)](pct(ch.range))} ${c.dim(f.range)}  ${c.dim(marketCapBoth(sym.company.market_cap_usd, sym.company.market_cap_krw, f.lang))}`)
  if (hist && hist.series.points.length > 1) {
    out('')
    for (const line of lineChart(hist.series.points.map((p) => p.close), cols - 2, 6, f.ascii)) out(c[tone(ch.range)](line))
  }

  const cons = sym.consensus
  if (cons || sym.sentiment) {
    const row = (label: string, value: string, note = '') => out(`  ${padW(label, 16)}${padW(value, 8, 'right')}  ${c.dim(note)}`)
    const gap = targetGap(cons?.target_mean, last, cons?.target_gap_pct)
    out('')
    out(c.bold(ko ? '컨센서스' : 'Consensus'))
    if (cons?.eps_quarters) row(ko ? 'EPS beat' : 'EPS beats', `${cons.eps_beats}/${cons.eps_quarters}`, `${ko ? '최근' : 'last'} ${pct(cons.last_surprise_pct)}`)
    if (cons?.target_mean != null) row(ko ? '목표가 갭' : 'Target gap', c[tone(gap)](pct(gap)), `${price(cons.target_mean, sym.company.currency)} · ${cons.rating ?? '—'} · ${cons.analyst_count ?? '?'}${ko ? '명' : ' analysts'}`)
    if (sym.sentiment) row(ko ? '섹터 심리' : 'Sector mood', String(sym.sentiment.score), `${bandLabel(sym.sentiment.band, f.lang)} · ${sym.sentiment.label}`)
  }

  if (sym.events.length) {
    out('')
    out(c.bold(ko ? '최근 이벤트' : 'Recent events'))
    for (const e of sym.events.slice(0, 6)) out(`  ${c.dim(shortDate(e.date))}  ${c.cyan(padW(eventKind(e.kind, f.lang), 10))}  ${e.title}`)
  }

  const b = await api.brief(sym)
  if (b) {
    out('')
    out(c.bold(ko ? 'AI 브리프' : 'AI brief'))
    for (const line of wrapW(b.summary, cols - 4).slice(0, 14)) out(`  ${line}`)
    for (const h of b.highlights.slice(0, 5)) out(`  ${c.dim('•')} ${h.label}`)
  }
  out('')
  out(c.dim(symbolUrl(API_URL, sym.company.ticker, f.lang)))
}

export async function watch(action: string | undefined, ticker: string | undefined, f: Flags): Promise<void> {
  const token = requireToken(f.lang)
  if (action === 'add' || action === 'rm' || action === 'remove') {
    if (!ticker) throw new Error('usage: argos watch add|rm <ticker>')
    const res = await api.watchlistChange(token, ticker.toUpperCase(), action === 'add' ? 'add' : 'remove')
    return f.json ? json(res) : out(`${action === 'add' ? '+' : '-'} ${ticker.toUpperCase()}`)
  }
  const list = await api.watchlist(token)
  if (f.json) return json(list)
  if (!list.items.length) return out(f.lang === 'ko' ? '관심종목이 없습니다. `argos watch add <티커>`로 추가하세요.' : 'Your watchlist is empty. Add one with `argos watch add <ticker>`.')
  out(table(list.items, [
    { header: 'TICKER', width: 10, get: (i) => i.ticker },
    { header: f.lang === 'ko' ? '종목명' : 'NAME', width: 28, get: (i) => displayName(i, f.lang) },
    { header: 'EXCHANGE', width: 10, get: (i) => i.exchange ?? '' },
  ]))
}

export async function search(q: string, f: Flags): Promise<void> {
  const res = await api.search(q, 10)
  if (f.json) return json(res)
  out(table(res.items, [
    { header: 'TICKER', width: 10, get: (i) => i.ticker },
    { header: f.lang === 'ko' ? '종목명' : 'NAME', width: 30, get: (i) => i.name ?? '' },
    { header: 'EXCHANGE', width: 10, get: (i) => i.exchange ?? '' },
  ]))
}

export async function sentiment(market: 'us' | 'kr', f: Flags): Promise<void> {
  const res = await api.sentiment(market, f.lang)
  if (f.json) return json(res)
  const c = paint(f.color)
  out(`${c.bold(market.toUpperCase())}  ${res.overall ?? '—'} ${bandLabel(res.band, f.lang)}  ${c.dim(res.as_of?.slice(0, 16).replace('T', ' ') ?? '')}`)
  out('')
  for (const s of res.sectors) {
    const filled = Math.round(s.score / 5)
    const bar = '█'.repeat(filled) + '·'.repeat(20 - filled)
    out(`${padW(s.label, 16)}  ${c[color.band(s.band)](bar)}  ${padW(String(s.score), 3, 'right')}  ${c.dim(bandLabel(s.band, f.lang))}`)
  }
}

export type ScreenArgs = { market?: string; sector?: string; min_mcap?: string; min_mcap_krw?: string; min_upside?: string; beat?: boolean; sort?: string; limit?: string }

export async function screen(a: ScreenArgs, f: Flags): Promise<void> {
  const res = await api.screen({ ...a })
  if (f.json) return json(res)
  const c = paint(f.color)
  out(table(res.items, [
    { header: 'TICKER', width: 8, get: (r) => r.ticker },
    { header: f.lang === 'ko' ? '종목명' : 'NAME', width: 22, get: (r) => displayName(r, f.lang) },
    { header: f.lang === 'ko' ? '시총' : 'MCAP', width: 9, align: 'right', get: (r) => marketCap(r.market_cap_usd, r.market_cap_krw, f.lang) },
    { header: f.lang === 'ko' ? '상승여력' : 'UPSIDE', width: 8, align: 'right', get: (r) => pct(r.upside_pct) },
    { header: 'SURPRISE', width: 8, align: 'right', get: (r) => pct(r.surprise_pct) },
    { header: f.lang === 'ko' ? '섹터' : 'SECTOR', width: 18, get: (r) => r.sector ?? '' },
  ]))
  if (!res.items.length) out(c.dim(f.lang === 'ko' ? '조건에 맞는 종목이 없습니다.' : 'No matches.'))
}

export async function digest(f: Flags, opts: { since?: string; all?: boolean }): Promise<void> {
  const token = requireToken(f.lang)
  const state = loadState()
  const since = opts.since ?? (opts.all ? undefined : state.lastDigestAt)
  const res = await api.digest(token, since, f.lang)
  saveState({ ...state, lastDigestAt: new Date().toISOString() })
  if (f.json) return json(res)
  const c = paint(f.color)
  if (!res.items.length) return out(c.dim(f.lang === 'ko' ? `${res.since.slice(0, 10)} 이후 새 이벤트가 없습니다.` : `Nothing new since ${res.since.slice(0, 10)}.`))
  const cols = process.stdout.columns || 80
  for (const e of res.items) {
    out(`${c.dim(shortDate(e.date))}  ${c.bold(padW(e.ticker, 8))}  ${c.cyan(padW(eventKind(e.kind, f.lang), 10))}  ${e.title}`)
    if (e.summary) for (const line of wrapW(e.summary, cols - 12).slice(0, 2)) out(`            ${c.dim(line)}`)
  }
}

export async function whoami(f: Flags): Promise<void> {
  const me = await api.me(requireToken(f.lang))
  if (f.json) return json(me)
  out(`${me.email ?? me.id}${me.plan ? `  (${me.plan})` : ''}`)
}

