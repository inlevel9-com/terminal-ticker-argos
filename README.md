# ARGOS terminal

ARGOS in your terminal: filings, earnings surprises, consensus gaps, sector fear and greed, and AI briefs for global listed companies. It's a research briefing, not a price ticker. Web: <https://argos.inlevel9.com>

```bash
npx @inlevel9/argos           # interactive terminal
npm i -g @inlevel9/argos      # or install the `argos` command
```

Requires Node.js 22+ and a terminal with a font that has braille characters (use `--ascii` if yours doesn't).

## Commands

| Command | What it does |
|---|---|
| `argos` | Interactive terminal: watchlist, sector sentiment, screener, digest |
| `argos login` / `logout` / `whoami` | Link this device to your ARGOS account (browser code flow) |
| `argos brief NVDA` · `argos 005930` | One symbol: price, chart, consensus, recent events, AI brief |
| `argos search 삼성전자` | Find tickers by name (Korean or English) or code |
| `argos watch [add\|rm <ticker>]` | Show or edit your watchlist (sign-in required) |
| `argos sentiment [--market kr]` | Sector fear and greed, US or KR |
| `argos screen --market us --beat --min-upside 20 --sort upside` | Quant screener |
| `argos digest [--since 2026-09-01] [--all]` | New events on your watchlist since you last checked |

Every command takes `--json` (raw output for scripts and agents), `--lang ko|en`, `--range 1M|3M|6M|YTD|1Y|3Y|5Y`, `--ascii`, and `--no-color`.

## Keys (interactive)

`1`–`4` or `Tab` switch tabs · `j`/`k` move · `←`/`→` chart range · `/` search · `b` AI brief · `a`/`d` add or remove from watchlist · `o` open on the web · `m`/`s` market or sort (sentiment, screener) · `r` refresh · `?` help · `q` quit

## Configuration

`~/.config/argos/` (or `$XDG_CONFIG_HOME/argos`):

- `config.json`: `{ "lang": "ko", "range": "3M", "ascii": false }`
- `credentials.json`: device token, owner-only (0600). `argos logout` revokes it on the server.
- `state.json`: when you last read your digest

Environment: `ARGOS_API_URL` (default `https://argos.inlevel9.com`), `ARGOS_CONFIG_DIR`, `NO_COLOR`, `BROWSER=none` (don't open a browser on login).

## Development

```bash
npm install
npm run dev -- brief NVDA                              # against production
ARGOS_API_URL=http://localhost:3000 npm run dev        # against a local ARGOS server
npm test && npm run typecheck && npm run build
```

The API this client calls: [`docs/API.md`](docs/API.md). Releases: push a `v<version>` tag matching `package.json` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## License

[MIT](LICENSE)
