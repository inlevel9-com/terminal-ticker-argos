import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import { api, errorMessage } from '../api.js'
import { openUrl } from '../auth.js'
import { API_URL, loadCredentials, loadState, saveState, type Config, type Lang } from '../config.js'
import { bandLabel, changes, displayName, eventKind, marketCap, pct, price, shortDate, symbolUrl, targetGap } from '../format.js'
import { CHART_RANGES, type Brief, type ChartRange, type Digest, type History, type ScreenRow, type Symbol } from '../schema.js'
import { lineChart } from '../ui/chart.js'
import { color } from '../ui/color.js'
import { padW, truncW, wrapW } from '../ui/width.js'
import { eachLimit, load, peek, useAsync } from './data.js'

type Tab = 'watch' | 'sentiment' | 'screen' | 'digest'
type Overlay = null | 'brief' | 'help' | 'search'
type Item = { ticker: string; name: string; name_ko: string | null; exchange: string | null; watched: boolean }

const TABS: Array<[Tab, { ko: string; en: string }]> = [
  ['watch', { ko: '관심종목', en: 'Watchlist' }],
  ['sentiment', { ko: '섹터 심리', en: 'Sentiment' }],
  ['screen', { ko: '스크리너', en: 'Screener' }],
  ['digest', { ko: '다이제스트', en: 'Digest' }],
]
const SCREEN_MARKETS = ['us', 'kr', 'jp', 'hk', 'tw', 'cn', 'eu'] as const
const SCREEN_SORTS = ['cap', 'upside', 'surprise'] as const

const t = (lang: Lang, ko: string, en: string) => (lang === 'ko' ? ko : en)
const tone = (v: number | null | undefined) => (v == null ? 'gray' : v >= 0 ? 'green' : 'red')
const histKey = (ticker: string, range: ChartRange) => `hist:${ticker}:${range}`

function useSize() {
  const { stdout } = useStdout()
  const [size, setSize] = useState({ cols: stdout.columns || 100, rows: stdout.rows || 30 })
  useEffect(() => {
    const on = () => setSize({ cols: stdout.columns || 100, rows: stdout.rows || 30 })
    stdout.on('resize', on)
    return () => { stdout.off('resize', on) }
  }, [stdout])
  return size
}

export function App({ config }: { config: Config }) {
  const { exit } = useApp()
  const { cols, rows } = useSize()
  const lang = config.lang
  const token = useMemo(() => loadCredentials()?.token ?? null, [])

  const [tab, setTab] = useState<Tab>('watch')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [items, setItems] = useState<Item[]>([])
  const [cursor, setCursor] = useState(0)
  const [range, setRange] = useState<ChartRange>(config.range)
  const [nonce, setNonce] = useState(0)
  const [status, setStatus] = useState<string>('')
  const [quotes, setQuotes] = useState<Record<string, number | null>>({})
  const [fresh, setFresh] = useState<Record<string, number>>({})
  const [briefScroll, setBriefScroll] = useState(0)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Item[]>([])
  const [resultCursor, setResultCursor] = useState(0)
  const [market, setMarket] = useState<'us' | 'kr'>('us')
  const [screenOpts, setScreenOpts] = useState({ market: 0, sort: 0, beat: false })
  const [listCursor, setListCursor] = useState(0)

  // Watchlist + "new event" markers since the last digest check.
  useEffect(() => {
    if (!token) { setStatus(t(lang, '로그인하면 관심종목이 보입니다: argos login · / 로 검색', 'Sign in to see your watchlist: argos login · / to search')); return }
    api.watchlist(token).then((w) => {
      setItems((prev) => {
        const watched = w.items.map((i) => ({ ...i, watched: true }))
        return [...watched, ...prev.filter((p) => !p.watched && !watched.some((x) => x.ticker === p.ticker))]
      })
    }, (e) => setStatus(errorMessage(e, lang)))
    api.digest(token, loadState().lastDigestAt, lang).then((d) => setFresh(d.by_ticker), () => {})
  }, [token, lang, nonce])

  // Row quotes: daily change from the last two closes of the 1M series.
  const tickers = items.map((i) => i.ticker).join(',')
  useEffect(() => {
    void eachLimit(items, 4, async (i) => {
      const h = await load(histKey(i.ticker, '1M'), () => api.history(i.ticker, '1M'))
      setQuotes((q) => ({ ...q, [i.ticker]: changes(h).day }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers])

  // Debounced search.
  useEffect(() => {
    if (overlay !== 'search' || !query.trim()) { setResults([]); return }
    const id = setTimeout(() => {
      api.search(query.trim(), 10).then((r) => {
        setResults(r.items.map((x) => ({ ticker: x.ticker, name: x.name ?? x.ticker, name_ko: null, exchange: x.exchange ?? null, watched: false })))
        setResultCursor(0)
      }, (e) => setStatus(errorMessage(e, lang)))
    }, 250)
    return () => clearTimeout(id)
  }, [query, overlay, lang])

  const current = items[Math.min(cursor, items.length - 1)] ?? null
  const screen = { market: SCREEN_MARKETS[screenOpts.market]!, sort: SCREEN_SORTS[screenOpts.sort]!, beat: screenOpts.beat }
  const screenKey = tab === 'screen' ? `screen:${screen.market}:${screen.sort}:${screen.beat}` : null
  const screenRes = useAsync(screenKey, () => api.screen({ market: screen.market, sort: screen.sort, beat: screen.beat, limit: 50 }), nonce)
  const digestRes = useAsync(tab === 'digest' && token ? 'digest:week' : null, () => api.digest(token!, undefined, lang), nonce)

  useEffect(() => {
    if (tab !== 'digest' || !token) return
    saveState({ ...loadState(), lastDigestAt: new Date().toISOString() })
    setFresh({})
  }, [tab, token])

  function openTicker(item: Item) {
    const idx = items.findIndex((i) => i.ticker === item.ticker)
    if (idx >= 0) setCursor(idx)
    else { setItems((prev) => [...prev, item]); setCursor(items.length) }
    setTab('watch'); setOverlay(null); setBriefScroll(0)
  }

  async function toggleWatch(add: boolean) {
    if (!current) return
    if (!token) { setStatus(t(lang, '로그인이 필요합니다: argos login', 'Sign in first: argos login')); return }
    try {
      await api.watchlistChange(token, current.ticker, add ? 'add' : 'remove')
      setItems((prev) => add
        ? prev.map((i) => (i.ticker === current.ticker ? { ...i, watched: true } : i))
        : prev.filter((i) => i.ticker !== current.ticker))
      if (!add) setCursor((c) => Math.max(0, c - 1))
      setStatus(`${add ? '+' : '-'} ${current.ticker}`)
    } catch (e) {
      setStatus(errorMessage(e, lang))
    }
  }

  useInput((input, key) => {
    if (overlay === 'search') {
      if (key.escape) { setOverlay(null); return }
      if (key.return) { const r = results[resultCursor]; if (r) openTicker(r); return }
      if (key.upArrow) { setResultCursor((c) => Math.max(0, c - 1)); return }
      if (key.downArrow) { setResultCursor((c) => Math.min(results.length - 1, c + 1)); return }
      if (key.backspace || key.delete) { setQuery((q) => [...q].slice(0, -1).join('')); return }
      if (input && !key.ctrl && !key.meta) setQuery((q) => q + input)
      return
    }
    if (key.escape) { setOverlay(null); return }
    if (input === 'q' || (key.ctrl && input === 'c')) { exit(); return }
    if (input === '?') { setOverlay(overlay === 'help' ? null : 'help'); return }
    if (input === '/') { setQuery(''); setResults([]); setOverlay('search'); return }
    if (input === 'r') { setNonce((n) => n + 1); setStatus(t(lang, '새로고침', 'Refreshed')); return }
    const n = Number(input)
    if (n >= 1 && n <= TABS.length) { setTab(TABS[n - 1]![0]); setOverlay(null); setListCursor(0); return }
    if (key.tab) { setTab(TABS[(TABS.findIndex(([k]) => k === tab) + 1) % TABS.length]![0]); setListCursor(0); return }

    const down = input === 'j' || key.downArrow
    const up = input === 'k' || key.upArrow

    if (tab === 'watch') {
      if (overlay === 'brief') {
        if (down) setBriefScroll((s) => s + 1)
        if (up) setBriefScroll((s) => Math.max(0, s - 1))
        if (input === 'b') setOverlay(null)
        return
      }
      if (down) setCursor((c) => Math.min(items.length - 1, c + 1))
      if (up) setCursor((c) => Math.max(0, c - 1))
      const ri = CHART_RANGES.indexOf(range)
      if (key.rightArrow || input === 'l') setRange(CHART_RANGES[Math.min(CHART_RANGES.length - 1, ri + 1)]!)
      if (key.leftArrow || input === 'h') setRange(CHART_RANGES[Math.max(0, ri - 1)]!)
      if (input === 'b') { setBriefScroll(0); setOverlay('brief') }
      if (input === 'a') void toggleWatch(true)
      if (input === 'd') void toggleWatch(false)
      if (input === 'o' && current) openUrl(symbolUrl(API_URL, current.ticker, lang))
      return
    }
    if (tab === 'sentiment' && input === 'm') setMarket((m) => (m === 'us' ? 'kr' : 'us'))
    if (tab === 'screen') {
      if (input === 'm') setScreenOpts((o) => ({ ...o, market: (o.market + 1) % SCREEN_MARKETS.length }))
      if (input === 's') setScreenOpts((o) => ({ ...o, sort: (o.sort + 1) % SCREEN_SORTS.length }))
      if (input === 'b') setScreenOpts((o) => ({ ...o, beat: !o.beat }))
    }
    if (tab === 'screen' || tab === 'digest') {
      const list: Array<{ ticker: string; name?: string | null; name_ko?: string | null }> =
        tab === 'screen' ? screenRes.data?.items ?? [] : digestRes.data?.items ?? []
      if (down) setListCursor((c) => Math.min(list.length - 1, c + 1))
      if (up) setListCursor((c) => Math.max(0, c - 1))
      const row = list[listCursor]
      if (key.return && row) openTicker({ ticker: row.ticker, name: row.name ?? row.ticker, name_ko: row.name_ko ?? null, exchange: null, watched: false })
    }
  })

  // Ink redraws in place only while the frame is shorter than the terminal, so
  // keep one spare row; every line below truncates instead of wrapping.
  const bodyRows = Math.max(8, rows - 3)
  const LEFT = cols < 80 ? 20 : 26
  const right = Math.max(24, cols - LEFT - 2) // inner width of the right pane
  const hints = footer(tab, overlay, lang)

  return (
    <Box flexDirection="column" width={cols} height={rows - 1}>
      <Box paddingX={1}>
        <Text wrap="truncate-end">
          <Text bold>ARGOS  </Text>
          {TABS.map(([k, label], i) => (
            <Text key={k} color={tab === k ? 'cyan' : 'gray'} bold={tab === k}>
              {tab === k || cols >= 72 ? ` ${i + 1} ${label[lang]} ` : ` ${i + 1} `}
            </Text>
          ))}
        </Text>
      </Box>
      <Box height={bodyRows} borderStyle="round" borderColor="gray">
        {overlay === 'help' ? (
          <Help lang={lang} />
        ) : tab === 'watch' ? (
          <>
            <Box width={LEFT - 2} flexDirection="column" paddingX={1} borderStyle="single" borderColor="gray" borderTop={false} borderBottom={false} borderLeft={false}>
              {overlay === 'search' ? (
                <SearchPane lang={lang} query={query} results={results} cursor={resultCursor} width={LEFT - 7} />
              ) : (
                <WatchPane items={items} cursor={cursor} quotes={quotes} fresh={fresh} width={LEFT - 7} lang={lang} />
              )}
            </Box>
            <Box flexDirection="column" flexGrow={1} paddingX={1}>
              {current ? (
                overlay === 'brief'
                  ? <BriefPane ticker={current.ticker} lang={lang} width={right} height={bodyRows - 2} scroll={briefScroll} nonce={nonce} />
                  : <SymbolPane ticker={current.ticker} range={range} lang={lang} ascii={config.ascii} width={right} height={bodyRows - 2} nonce={nonce} />
              ) : (
                <Text color="gray" wrap="truncate-end">{t(lang, '/ 로 종목 검색', 'Press / to search')}</Text>
              )}
            </Box>
          </>
        ) : tab === 'sentiment' ? (
          <SentimentPane market={market} lang={lang} nonce={nonce} />
        ) : tab === 'screen' ? (
          <ScreenPane res={screenRes} lang={lang} cursor={listCursor} opts={screen} height={bodyRows - 4} width={cols - 4} />
        ) : (
          <DigestPane res={digestRes} lang={lang} cursor={listCursor} loggedIn={!!token} height={bodyRows - 3} width={cols - 4} />
        )}
      </Box>
      <Box paddingX={1}>
        <Text wrap="truncate-end">
          {status ? <Text color="yellow">{truncW(status, Math.floor(cols / 2))}  </Text> : null}
          <Text color="gray">{hints}</Text>
        </Text>
      </Box>
    </Box>
  )
}

function footer(tab: Tab, overlay: Overlay, lang: Lang): string {
  if (overlay === 'search') return t(lang, '입력해 검색 · ↑↓ 선택 · Enter 열기 · Esc 닫기', 'Type to search · ↑↓ select · Enter open · Esc close')
  if (overlay === 'brief') return t(lang, 'j/k 스크롤 · b/Esc 닫기', 'j/k scroll · b/Esc close')
  const common = t(lang, '/ 검색 · r 새로고침 · ? 도움말 · q 종료', '/ search · r refresh · ? help · q quit')
  if (tab === 'watch') return `${t(lang, 'j/k 이동 · ←→ 기간 · b 브리프 · a/d 추가/삭제 · o 웹', 'j/k move · ←→ range · b brief · a/d add/remove · o web')} · ${common}`
  if (tab === 'sentiment') return `${t(lang, 'm 시장 전환', 'm switch market')} · ${common}`
  if (tab === 'screen') return `${t(lang, 'm 시장 · s 정렬 · b 실적 beat만 · Enter 열기', 'm market · s sort · b beats only · Enter open')} · ${common}`
  return `${t(lang, 'j/k 이동 · Enter 열기', 'j/k move · Enter open')} · ${common}`
}

function WatchPane({ items, cursor, quotes, fresh, width, lang }: {
  items: Item[]; cursor: number; quotes: Record<string, number | null>; fresh: Record<string, number>; width: number; lang: Lang
}) {
  const nameW = width - 9
  return (
    <Box flexDirection="column">
      <Text color="gray">{t(lang, '관심종목', 'Watchlist')}</Text>
      {items.map((i, idx) => {
        const q = quotes[i.ticker]
        const selected = idx === cursor
        return (
          <Text key={i.ticker} inverse={selected} wrap="truncate-end">
            <Text color={i.watched ? undefined : 'gray'}>{padW(displayName(i, lang), nameW)}</Text>
            <Text color={tone(q)}>{padW(q === undefined ? '' : pct(q), 7, 'right')}</Text>
            {' '}
            <Text color="yellow">{fresh[i.ticker] ? '●' : ' '}</Text>
          </Text>
        )
      })}
      {Object.keys(fresh).length > 0 && <Text color="gray">{'\n'}<Text color="yellow">●</Text> {t(lang, '새 이벤트', 'new events')}</Text>}
    </Box>
  )
}

function SearchPane({ lang, query, results, cursor, width }: { lang: Lang; query: string; results: Item[]; cursor: number; width: number }) {
  return (
    <Box flexDirection="column">
      <Text><Text color="cyan">/ </Text>{truncW(query, width - 3)}<Text inverse> </Text></Text>
      {results.map((r, idx) => (
        <Text key={r.ticker} inverse={idx === cursor} wrap="truncate-end">
          {padW(r.ticker, 8)}<Text color="gray">{padW(r.name, width - 8)}</Text>
        </Text>
      ))}
      {!query && <Text color="gray">{t(lang, '티커·회사명 (예: 삼성전자, NVDA)', 'Ticker or name (e.g. NVDA)')}</Text>}
    </Box>
  )
}

function SymbolPane({ ticker, range, lang, ascii, width, height, nonce }: {
  ticker: string; range: ChartRange; lang: Lang; ascii: boolean; width: number; height: number; nonce: number
}) {
  const sym = useAsync<Symbol>(`sym:${ticker}:${lang}`, () => api.symbol(ticker, lang), nonce)
  const hist = useAsync<History>(histKey(ticker, range), () => api.history(ticker, range), nonce)
  if (sym.error) return <Text color="red">{errorMessage(sym.error, lang)}</Text>
  const s = sym.data
  const ch = changes(hist.data ?? peek<History>(histKey(ticker, '1M')) ?? null)
  const rangeCh = changes(hist.data ?? null).range
  const gap = targetGap(s?.consensus?.target_mean, ch.last, s?.consensus?.target_gap_pct)
  const narrow = width < 60
  const chartRows = Math.max(3, height - (narrow ? 18 : 10))
  const eventsW = narrow ? width : Math.floor(width * 0.6)
  const consW = narrow ? width : width - eventsW - 3

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Text wrap="truncate-end">
          <Text bold>{ticker}</Text>{'  '}
          <Text color="gray">{s ? truncW(displayName(s.company, lang), narrow ? 10 : 24) : '…'}</Text>{'  '}
          {price(ch.last ?? s?.quote?.price ?? null, s?.company.currency ?? null)}{' '}
          <Text color={tone(ch.day)}>{pct(ch.day)}</Text>
        </Text>
        {narrow ? <Text color="cyan"> [{range}]</Text> : (
          <Text>
            {CHART_RANGES.map((r) => <Text key={r} color={r === range ? 'cyan' : 'gray'}>{r === range ? `[${r}]` : ` ${r} `}</Text>)}
          </Text>
        )}
      </Box>
      <Box flexDirection="column" height={chartRows} marginY={1}>
        {hist.loading ? <Text color="gray">{t(lang, '차트 불러오는 중…', 'Loading chart…')}</Text>
          : (hist.data?.series.points.length ?? 0) < 2 ? <Text color="gray">{t(lang, '가격 데이터 없음', 'No price data')}</Text>
          : lineChart(hist.data!.series.points.map((p) => p.close), width, chartRows, ascii).map((line, i) => (
            <Text key={i} color={tone(rangeCh)}>{line}</Text>
          ))}
      </Box>
      <Box flexDirection={narrow ? 'column' : 'row'}>
        <Box flexDirection="column" width={eventsW} marginRight={narrow ? 0 : 3} marginBottom={narrow ? 1 : 0}>
          <Text color="gray">{t(lang, '이벤트', 'Events')}</Text>
          {!s ? <Text color="gray">…</Text> : s.events.length === 0 ? <Text color="gray">—</Text>
            : s.events.slice(0, narrow ? 4 : 6).map((e) => (
              <Text key={e.id} wrap="truncate-end">
                <Text color="gray">{shortDate(e.date)}</Text>{'  '}
                <Text color="cyan">{padW(eventKind(e.kind, lang), 9)}</Text>{' '}
                {truncW(e.title, eventsW - 17)}
              </Text>
            ))}
        </Box>
        <Box flexDirection="column" width={consW}>
          <Text color="gray">{t(lang, '컨센서스', 'Consensus')}</Text>
          <KV label={t(lang, 'EPS beat', 'EPS beats')} width={consW} value={s?.consensus?.eps_quarters ? `${s.consensus.eps_beats} / ${s.consensus.eps_quarters}` : '—'} />
          <KV label={t(lang, '최근 서프라이즈', 'Last surprise')} width={consW} value={pct(s?.consensus?.last_surprise_pct)} color={tone(s?.consensus?.last_surprise_pct)} />
          <KV label={t(lang, '목표가 갭', 'Target gap')} width={consW} value={pct(gap)} color={tone(gap)} />
          <KV label={t(lang, '섹터 심리', 'Sector mood')} width={consW} value={s?.sentiment ? `${s.sentiment.score} ${bandLabel(s.sentiment.band, lang)}` : '—'} color={s?.sentiment ? color.band(s.sentiment.band) : undefined} />
          <KV label={t(lang, '시가총액', 'Market cap')} width={consW} value={marketCap(s?.company.market_cap_usd, s?.company.market_cap_krw, lang)} />
        </Box>
      </Box>
      <Text color="gray" wrap="truncate-end">{'\n'}b {t(lang, 'AI 브리프', 'AI brief')}{s?.brief ? ` · ${truncW(s.brief.summary.replace(/\s+/g, ' '), width - 16)}` : ''}</Text>
    </Box>
  )
}

function KV({ label, value, width, color: c }: { label: string; value: string; width: number; color?: string }) {
  const labelW = Math.min(16, Math.max(8, width - 12))
  return (
    <Text wrap="truncate-end">
      <Text color="gray">{padW(label, labelW)}</Text>
      <Text color={c}>{padW(value, Math.max(4, width - labelW), 'right')}</Text>
    </Text>
  )
}

function BriefPane({ ticker, lang, width, height, scroll, nonce }: { ticker: string; lang: Lang; width: number; height: number; scroll: number; nonce: number }) {
  const res = useAsync<Brief | null>(`brief:${ticker}:${lang}`, async () => api.brief(await load(`sym:${ticker}:${lang}`, () => api.symbol(ticker, lang))), nonce)
  const brief = res.data
  if (!brief) return <Text color="gray">{res.loading ? t(lang, 'AI 브리프 불러오는 중…', 'Loading AI brief…') : t(lang, '이 종목의 AI 브리프가 아직 없습니다.', 'No AI brief for this symbol yet.')}</Text>
  const lines = [
    ...wrapW(brief.summary, width),
    '',
    ...brief.highlights.map((h) => `• ${h.label}`).flatMap((l) => wrapW(l, width)),
    ...(brief.checkpoints?.length ? ['', t(lang, '다음 체크포인트', 'Next checkpoints'), ...brief.checkpoints.flatMap((l) => wrapW(`- ${l}`, width))] : []),
  ]
  const top = Math.min(scroll, Math.max(0, lines.length - (height - 2)))
  return (
    <Box flexDirection="column">
      <Text><Text bold>{ticker}</Text> <Text color="gray">{t(lang, 'AI 브리프', 'AI brief')}{brief.updated_at ? ` · ${brief.updated_at.slice(0, 10)}` : ''}</Text></Text>
      {lines.slice(top, top + height - 2).map((l, i) => <Text key={i}>{l || ' '}</Text>)}
    </Box>
  )
}

function SentimentPane({ market, lang, nonce }: { market: 'us' | 'kr'; lang: Lang; nonce: number }) {
  const res = useAsync(`sent:${market}:${lang}`, () => api.sentiment(market, lang), nonce)
  if (res.error) return <Text color="red">{errorMessage(res.error, lang)}</Text>
  const d = res.data
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>
        <Text bold>{market.toUpperCase()}</Text>{'  '}
        <Text color={color.band(d?.band ?? null)}>{d?.overall ?? '—'} {bandLabel(d?.band ?? null, lang)}</Text>{'  '}
        <Text color="gray">{d?.as_of?.slice(0, 16).replace('T', ' ') ?? ''}</Text>
      </Text>
      <Text> </Text>
      {(d?.sectors ?? []).map((s) => {
        const filled = Math.round(s.score / 4)
        return (
          <Text key={s.key}>
            {padW(s.label, 18)}
            <Text color={color.band(s.band)}>{'█'.repeat(filled)}</Text>
            <Text color="gray">{'·'.repeat(25 - filled)}</Text>
            {padW(String(s.score), 5, 'right')}{'  '}
            <Text color="gray">{bandLabel(s.band, lang)}</Text>
          </Text>
        )
      })}
    </Box>
  )
}

function ScreenPane({ res, lang, cursor, opts, height, width }: {
  res: { data?: { items: ScreenRow[] }; error: unknown; loading: boolean }; lang: Lang; cursor: number
  opts: { market: string; sort: string; beat: boolean }; height: number; width: number
}) {
  const nameW = Math.max(12, width - 8 - 9 - 9 - 9 - 8)
  const rowsShown = Math.max(1, height - 1)
  const start = Math.max(0, Math.min(cursor - Math.floor(rowsShown / 2), (res.data?.items.length ?? 0) - rowsShown))
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color="gray">
        {t(lang, '시장', 'Market')} <Text color="cyan">{opts.market.toUpperCase()}</Text> · {t(lang, '정렬', 'Sort')} <Text color="cyan">{opts.sort}</Text> · {t(lang, '실적 beat만', 'Beats only')} <Text color="cyan">{opts.beat ? 'on' : 'off'}</Text>
      </Text>
      <Text color="gray">
        {padW('TICKER', 8)}{padW(t(lang, '종목명', 'NAME'), nameW)}{padW(t(lang, '시총', 'MCAP'), 9, 'right')}{padW(t(lang, '상승여력', 'UPSIDE'), 9, 'right')}{padW('SURPRISE', 9, 'right')}
      </Text>
      {res.error ? <Text color="red">{errorMessage(res.error, lang)}</Text>
        : res.loading ? <Text color="gray">…</Text>
        : (res.data?.items ?? []).slice(start, start + rowsShown).map((r, i) => (
          <Text key={r.ticker} inverse={start + i === cursor} wrap="truncate-end">
            {padW(r.ticker, 8)}{padW(displayName(r, lang), nameW)}{padW(marketCap(r.market_cap_usd, r.market_cap_krw, lang), 9, 'right')}
            <Text color={tone(r.upside_pct)}>{padW(pct(r.upside_pct), 9, 'right')}</Text>
            <Text color={tone(r.surprise_pct)}>{padW(pct(r.surprise_pct), 9, 'right')}</Text>
          </Text>
        ))}
    </Box>
  )
}

function DigestPane({ res, lang, cursor, loggedIn, height, width }: {
  res: { data?: Digest; error: unknown; loading: boolean }; lang: Lang; cursor: number; loggedIn: boolean; height: number; width: number
}) {
  if (!loggedIn) return <Text color="gray"> {t(lang, '로그인이 필요합니다: argos login', 'Sign in first: argos login')}</Text>
  if (res.error) return <Text color="red">{errorMessage(res.error, lang)}</Text>
  const items = res.data?.items ?? []
  const start = Math.max(0, Math.min(cursor - Math.floor(height / 2), items.length - height))
  return (
    <Box flexDirection="column" paddingX={1}>
      {res.loading ? <Text color="gray">…</Text>
        : items.length === 0 ? <Text color="gray">{t(lang, '최근 7일간 관심종목 이벤트가 없습니다.', 'No watchlist events in the last 7 days.')}</Text>
        : items.slice(start, start + height).map((e, i) => (
          <Text key={e.id} inverse={start + i === cursor} wrap="truncate-end">
            <Text color="gray">{shortDate(e.date)}</Text>{'  '}
            <Text bold>{padW(e.ticker, 8)}</Text>
            <Text color="cyan">{padW(eventKind(e.kind, lang), 10)}</Text>
            {truncW(e.title, width - 30)}
          </Text>
        ))}
    </Box>
  )
}

function Help({ lang }: { lang: Lang }) {
  const rows: Array<[string, string]> = [
    ['1-4 / Tab', t(lang, '탭 전환', 'Switch tab')],
    ['j k ↑ ↓', t(lang, '이동', 'Move')],
    ['h l ← →', t(lang, '차트 기간', 'Chart range')],
    ['/', t(lang, '종목 검색', 'Search symbols')],
    ['b', t(lang, 'AI 브리프 (관심종목 탭)', 'AI brief (watchlist tab)')],
    ['a / d', t(lang, '관심종목 추가 / 삭제', 'Add to / remove from watchlist')],
    ['o', t(lang, '웹에서 열기', 'Open on the web')],
    ['m / s', t(lang, '시장 전환 / 정렬 (심리·스크리너)', 'Market / sort (sentiment, screener)')],
    ['r', t(lang, '새로고침', 'Refresh')],
    ['Esc', t(lang, '닫기', 'Close')],
    ['q', t(lang, '종료', 'Quit')],
  ]
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>{t(lang, '단축키', 'Keys')}</Text>
      <Text> </Text>
      {rows.map(([k, v]) => <Text key={k}><Text color="cyan">{padW(k, 12)}</Text>{v}</Text>)}
    </Box>
  )
}
