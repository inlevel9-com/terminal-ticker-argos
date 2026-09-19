# ARGOS API used by this client

Base URL: `https://argos.inlevel9.com` (override with `ARGOS_API_URL`). Errors are always `{ "error": "<code>" }`. Public endpoints are rate-limited per IP; `429 rate_limited` includes `Retry-After`.

The client validates every response against the zod schemas in [`src/schema.ts`](../src/schema.ts). If the server returns something the schemas don't accept, the CLI reports `unexpected_response` and suggests updating.

## Sign-in (device code)

| Request | Auth | Notes |
|---|---|---|
| `POST /api/mac/device/start` | none | → `{ device_code, user_code, verification_url, expires_in }` |
| `POST /api/mac/device/poll` `{ device_code, device_name }` | none | → `{ status: "pending" \| "expired" }` or `{ status: "approved", token, user }` (once). `429 slow_down` if polled faster than every 2s |
| `POST /api/mac/token/revoke` | Bearer | Sign out |
| `GET /api/mac/me` | Bearer | `{ id, email, display_name, plan, coverage_limit }` |

The token is stored in `~/.config/argos/credentials.json` (0600) and sent as `Authorization: Bearer <token>`.

## Data

| Request | Auth | Response |
|---|---|---|
| `GET /api/mac/search?q=&limit=` | none | `{ items: [{ ticker, name, exchange }] }` |
| `GET /api/mac/symbol/{ticker}?lang=ko\|en` | none | `{ company, quote, events, consensus, sentiment, brief }` (below) |
| `GET /api/symbol/{ticker}/history?range=1M\|3M\|6M\|YTD\|1Y\|3Y\|5Y` | none | `{ company, series: { currency, range, source, points: [{ time, open, high, low, close, volume }] } }` |
| `GET /api/symbol/{ticker}/ai` | none | `{ brief: { summary_text, highlights, next_checkpoints } }`: on-demand AI brief, used only when `symbol.brief` is null |
| `GET /api/mac/sentiment?market=us\|kr&lang=` | none | `{ market, overall, band, as_of, sectors: [{ key, label, score, band }] }` |
| `GET /api/mac/screen` | none | `{ items: [{ ticker, name, name_ko, sector, currency, last_price, market_cap_usd, market_cap_krw, target_mean, upside_pct, rating, surprise_pct, surprise_period }] }` |
| `GET /api/mac/watchlist` · `POST { ticker, action: "add" \| "remove" }` | Bearer | `{ items: [{ ticker, name, name_ko, exchange, pinned }] }` · `{ ok, covered }` |
| `GET /api/mac/digest?since=<ISO>&lang=` | Bearer | `{ since, items: [{ ticker, id, date, kind, title, summary, importance }], by_ticker: { [ticker]: count } }` |

Screener query: `market=us|kr|hk|cn|jp|tw|eu`, `sector`, `min_mcap` (USD), `min_mcap_krw` (KRW; KR listings only), `min_upside` (%), `beat=1`, `sort=cap|upside|surprise`, `limit` (1–50).

### `symbol`

- `company`: `{ ticker, name, name_ko, exchange, country, currency, sector, industry, market_cap_usd, market_cap_krw }`. `market_cap_krw` is set for KR listings only.
- `quote`: `{ price, as_of }`, or `null`. The chart's last close can be newer.
- `events`: up to 12 recent timeline items `{ id, date, kind, title, summary, importance }`, including scheduled ones such as the next earnings date.
- `consensus`: `{ target_mean, target_gap_pct, rating, analyst_count, eps_beats, eps_quarters, last_surprise_pct, last_surprise_period }`, or `null`.
- `sentiment`: the company's sector in the fear and greed index, or `null`.
- `brief`: the stored AI brief `{ summary, highlights, updated_at }`, or `null`.

All `*_pct` fields are percentages (`6.16` means +6.16%).
