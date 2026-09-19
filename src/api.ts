import type { z } from 'zod'
import { API_URL, type Lang } from './config.js'
import * as S from './schema.js'

export class ApiError extends Error {
  constructor(public status: number, public code: string, public detail: Record<string, unknown> = {}) {
    super(code)
  }
}

type Options = {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number | boolean | null | undefined>
  body?: unknown
  token?: string | null
  timeoutMs?: number
}

async function request<T extends z.ZodType>(schema: T, path: string, opts: Options = {}): Promise<z.infer<T>> {
  const url = new URL(path, API_URL)
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v != null && v !== '' && v !== false) url.searchParams.set(k, v === true ? '1' : String(v))
  }
  let res: Response
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: {
        accept: 'application/json',
        'user-agent': 'argos-cli',
        ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
    })
  } catch {
    throw new ApiError(0, 'network_error')
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null
  if (!res.ok) throw new ApiError(res.status, typeof json?.error === 'string' ? json.error : `http_${res.status}`, json ?? {})
  const parsed = schema.safeParse(json)
  if (!parsed.success) throw new ApiError(res.status, 'unexpected_response')
  return parsed.data
}

export const api = {
  deviceStart: (device_name: string) =>
    request(S.DeviceStart, '/api/mac/device/start', { method: 'POST', body: { client: 'cli', device_name } }),
  devicePoll: (device_code: string, device_name: string) =>
    request(S.DevicePoll, '/api/mac/device/poll', { method: 'POST', body: { device_code, device_name } }),
  revoke: (token: string) => request(S.WatchlistChange.partial(), '/api/mac/token/revoke', { method: 'POST', token }),
  me: (token: string) => request(S.Me, '/api/mac/me', { token }),
  watchlist: (token: string) => request(S.Watchlist, '/api/mac/watchlist', { token }),
  watchlistChange: (token: string, ticker: string, action: 'add' | 'remove') =>
    request(S.WatchlistChange, '/api/mac/watchlist', { method: 'POST', token, body: { ticker, action } }),
  search: (q: string, limit = 8) => request(S.SearchResult, '/api/mac/search', { query: { q, limit } }),
  symbol: (ticker: string, lang: Lang) =>
    request(S.Symbol, `/api/mac/symbol/${encodeURIComponent(ticker)}`, { query: { lang } }),
  history: (ticker: string, range: S.ChartRange) =>
    request(S.History, `/api/symbol/${encodeURIComponent(ticker)}/history`, { query: { range } }),
  aiBrief: async (ticker: string): Promise<S.Brief> => {
    // Generated on first request (cached server-side afterwards), so allow longer.
    const r = await request(S.AiBrief, `/api/symbol/${encodeURIComponent(ticker)}/ai`, { timeoutMs: 60_000 })
    return { summary: r.brief.summary_text, highlights: r.brief.highlights, updated_at: '', checkpoints: r.brief.next_checkpoints ?? [] }
  },
  // Stored brief when there is one, otherwise the web's on-demand brief.
  brief: async (sym: S.Symbol): Promise<S.Brief | null> =>
    sym.brief ?? (await api.aiBrief(sym.company.ticker).catch(() => null)),
  sentiment: (market: 'us' | 'kr', lang: Lang) => request(S.Sentiment, '/api/mac/sentiment', { query: { market, lang } }),
  screen: (query: Options['query']) => request(S.Screen, '/api/mac/screen', { query }),
  digest: (token: string, since: string | undefined, lang: Lang) =>
    request(S.Digest, '/api/mac/digest', { token, query: { since, lang } }),
}

const MESSAGES: Record<string, { ko: string; en: string }> = {
  network_error: { ko: '서버에 연결하지 못했습니다. 네트워크를 확인하세요.', en: "Couldn't reach ARGOS. Check your connection." },
  unauthorized: { ko: '로그인이 필요합니다. `argos login`을 실행하세요.', en: 'Sign in first: run `argos login`.' },
  symbol_not_found: { ko: '종목을 찾지 못했습니다. `argos search <이름>`으로 티커를 확인하세요.', en: "Couldn't find that symbol. Try `argos search <name>`." },
  unknown_ticker: { ko: '종목을 찾지 못했습니다. `argos search <이름>`으로 티커를 확인하세요.', en: "Couldn't find that symbol. Try `argos search <name>`." },
  coverage_limit_reached: { ko: '관심종목 한도에 도달했습니다. 하나를 제거한 뒤 다시 추가하세요.', en: 'Your watchlist is full. Remove one, then add again.' },
  rate_limited: { ko: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.', en: 'Too many requests. Try again in a moment.' },
  unexpected_response: { ko: '서버 응답을 해석하지 못했습니다. CLI를 업데이트하세요: npm i -g @inlevel9/argos', en: "Couldn't read the server response. Update the CLI: npm i -g @inlevel9/argos" },
}

export function errorMessage(err: unknown, lang: Lang): string {
  if (err instanceof ApiError) return MESSAGES[err.code]?.[lang] ?? `${err.code} (${err.status})`
  return err instanceof Error ? err.message : String(err)
}
