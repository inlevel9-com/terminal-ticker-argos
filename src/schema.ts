// Response contracts for the ARGOS endpoints this client reads (docs/API.md).
// Unknown keys are ignored so the server can add fields.
import { z } from 'zod'

export const CHART_RANGES = ['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y'] as const
export type ChartRange = (typeof CHART_RANGES)[number]

export const DeviceStart = z.object({
  device_code: z.string(),
  user_code: z.string(),
  verification_url: z.string(),
  expires_in: z.number(),
})

export const DevicePoll = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({ status: z.literal('expired') }),
  z.object({
    status: z.literal('approved'),
    token: z.string(),
    user: z.object({ id: z.string(), email: z.string().nullable() }),
  }),
])

export const Me = z.object({
  id: z.string(),
  email: z.string().nullable(),
  display_name: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
  coverage_limit: z.number().nullable().optional(),
})

export const WatchItem = z.object({
  ticker: z.string(),
  name: z.string(),
  name_ko: z.string().nullable(),
  exchange: z.string().nullable(),
  pinned: z.boolean().optional(),
})
export type WatchItem = z.infer<typeof WatchItem>
export const Watchlist = z.object({ items: z.array(WatchItem) })

export const WatchlistChange = z.object({ ok: z.boolean(), covered: z.boolean().optional() })

export const SearchResult = z.object({
  items: z.array(z.looseObject({
    ticker: z.string(),
    name: z.string().nullable().optional(),
    exchange: z.string().nullable().optional(),
  })),
})

export const Event = z.object({
  id: z.number(),
  date: z.string(),
  kind: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  importance: z.number(),
})
export type Event = z.infer<typeof Event>

export const Sector = z.object({ key: z.string(), label: z.string(), score: z.number(), band: z.string() })
export type Sector = z.infer<typeof Sector>

export const Symbol = z.object({
  company: z.object({
    ticker: z.string(),
    name: z.string(),
    name_ko: z.string().nullable(),
    exchange: z.string().nullable(),
    country: z.string().nullable(),
    currency: z.string().nullable(),
    sector: z.string().nullable(),
    industry: z.string().nullable(),
    market_cap_usd: z.number().nullable(),
    market_cap_krw: z.number().nullable().optional(),
  }),
  quote: z.object({ price: z.number(), as_of: z.string().nullable() }).nullable(),
  events: z.array(Event),
  consensus: z.object({
    target_mean: z.number().nullable(),
    target_gap_pct: z.number().nullable(),
    rating: z.string().nullable(),
    analyst_count: z.number().nullable(),
    eps_beats: z.number(),
    eps_quarters: z.number(),
    last_surprise_pct: z.number().nullable(),
    last_surprise_period: z.string().nullable(),
  }).nullable(),
  sentiment: Sector.nullable(),
  brief: z.object({
    summary: z.string(),
    highlights: z.array(z.object({ label: z.string(), tone: z.string() })),
    updated_at: z.string(),
  }).nullable(),
})
export type Symbol = z.infer<typeof Symbol>

export const History = z.object({
  company: z.object({ ticker: z.string(), currency: z.string().nullable() }),
  series: z.object({
    currency: z.string().nullable(),
    range: z.string(),
    source: z.string(),
    points: z.array(z.object({
      time: z.string(),
      open: z.number().nullable(),
      high: z.number().nullable(),
      low: z.number().nullable(),
      close: z.number(),
      volume: z.number().nullable(),
    })),
  }),
})
export type History = z.infer<typeof History>

export const Sentiment = z.object({
  market: z.string(),
  overall: z.number().nullable(),
  band: z.string().nullable(),
  as_of: z.string().nullable(),
  sectors: z.array(Sector),
})
export type Sentiment = z.infer<typeof Sentiment>

export const ScreenRow = z.object({
  ticker: z.string(),
  name: z.string().nullable(),
  name_ko: z.string().nullable(),
  sector: z.string().nullable(),
  currency: z.string().nullable(),
  last_price: z.number().nullable(),
  market_cap_usd: z.number().nullable(),
  market_cap_krw: z.number().nullable().optional(),
  target_mean: z.number().nullable(),
  upside_pct: z.number().nullable(),
  rating: z.string().nullable(),
  surprise_pct: z.number().nullable(),
  surprise_period: z.string().nullable(),
})
export type ScreenRow = z.infer<typeof ScreenRow>
export const Screen = z.object({ items: z.array(ScreenRow) })

export const Digest = z.object({
  since: z.string(),
  items: z.array(Event.extend({ ticker: z.string() })),
  by_ticker: z.record(z.string(), z.number()),
})
export type Digest = z.infer<typeof Digest>

// /api/symbol/{ticker}/ai — the web's on-demand brief (cached server-side,
// rate-limited). Used only when /api/mac/symbol has no stored brief.
export const AiBrief = z.object({
  brief: z.object({
    summary_text: z.string(),
    highlights: z.array(z.object({ label: z.string(), tone: z.string() })),
    next_checkpoints: z.array(z.string()).optional(),
  }),
})

export type Brief = NonNullable<Symbol['brief']> & { checkpoints?: string[] }
