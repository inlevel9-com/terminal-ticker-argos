# ARGOS terminal

[한국어](README.ko.md)

ARGOS in your terminal. It's a research briefing, not a price ticker: filings, earnings surprises, consensus gaps, sector fear and greed, and AI briefs for about 16,000 US, Korean, and other listed companies. Web: <https://argos.inlevel9.com>

```bash
npx @inlevel9/argos
```

## Install

Requires Node.js 22 or later.

```bash
npm install -g @inlevel9/argos    # adds the `argos` command
argos --version
```

Or run it without installing: `npx @inlevel9/argos <command>`.

Charts are drawn with braille characters. Most terminal fonts include them; if yours shows boxes or question marks, add `--ascii`.

## Quick start

You don't need an account to look things up:

```bash
argos search nvidia        # find a ticker (Korean names work too)
argos brief NVDA           # price, chart, consensus, events, AI brief
argos 005930               # shorthand for `argos brief 005930`
argos                      # open the interactive terminal
```

Sign in to use your watchlist and digest:

```bash
argos login
```

`argos login` opens an approval page in your browser with a 6-character code already filled in. Check that the code matches the one in your terminal, then click **Approve** (sign in first if the browser asks). The terminal finishes signing in on its own. Over SSH, or with `BROWSER=none`, the address is printed for you to open on any device instead.

Your password never touches the terminal. The CLI keeps a device token in `~/.config/argos/credentials.json` (readable only by you), and `argos logout` revokes it on the server. The approval page shows a device name, `argos-cli (<OS> <CPU>)` by default; set `ARGOS_DEVICE_NAME` to choose your own. The host name isn't sent.

## A symbol at a glance

```text
$ argos brief NVDA --lang en
NVDA  NVIDIA CORP  NASDAQ
222.27 USD  +1.3% 1D  +6.5% 3M  $5.37T

⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⢀⡤⠤⣄⠀⠀⠀⠀⠀⠀⣤⡀⠀⢀⡴⠋⠳⣄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠖⠋⠳⠴⠋⠀⠀⠈⠳⠤⣄⡀⠀⢀⡇⠷⠲⠞⠀⠀⠀⠈⠳⢤⠀⠀⣰⠚
⢤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣄⣰⠒⢦⡀⠀⣰⠲⢤⡀⠀⠀⠀⠀⣠⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⠖⠚⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠓⠋⠁⠀
⠈⢧⣀⠀⠀⣠⣄⠀⠀⢠⠟⠋⠘⠃⠀⠀⠓⠚⠁⠀⠀⢳⠀⠀⠀⡴⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠈⠳⠖⠃⠈⠙⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠧⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

Consensus
  EPS beats            4/4  last +6.2%
  Target gap        +47.8%  328.49 · strong_buy · 58 analysts
  Sector mood           60  Greed · Technology

Recent events
  11-17  Earnings    Next earnings date
  09-10  Analyst     Piper Sandler: Overweight
  09-04  Analyst     Rosenblatt: Buy
```

- **EPS beats**: how many of the last four quarters beat the EPS consensus, and by how much last time.
- **Target gap**: the mean analyst target versus the latest close.
- **Sector mood**: the sector's fear and greed score (0 is extreme fear, 100 is extreme greed).

## Interactive terminal

Run `argos` with no arguments. It has four tabs:

| Tab | What's in it |
|---|---|
| `1` Watchlist | Your watchlist on the left. On the right: the selected symbol's chart, recent events, consensus, and sector mood. A yellow `●` marks symbols with events since you last opened the digest. |
| `2` Sentiment | Fear and greed by sector for the US or Korea |
| `3` Screener | Rank by market cap, consensus upside, or earnings surprise |
| `4` Digest | New events on your watchlist from the last 7 days |

Keys:

| Key | Action |
|---|---|
| `1`–`4`, `Tab` | Switch tab |
| `j` `k` or `↑` `↓` | Move |
| `h` `l` or `←` `→` | Chart range (1M, 3M, 6M, YTD, 1Y, 3Y, 5Y) |
| `/` | Search symbols. `Enter` opens one, `Esc` closes search |
| `b` | Full AI brief for the selected symbol |
| `a` / `d` | Add to / remove from your watchlist |
| `o` | Open the symbol on the web |
| `m` / `s` | Switch market / sort (Sentiment and Screener tabs) |
| `r` | Refresh |
| `?` | Help |
| `q` | Quit |

A symbol opened from search shows in gray until you add it with `a`. The layout adapts to narrow windows, but 80 columns or wider is most comfortable.

## Commands

| Command | What it does |
|---|---|
| `argos` | Interactive terminal |
| `argos login` · `logout` · `whoami` | Sign in, sign out, show the account |
| `argos brief <ticker>` · `argos <ticker>` | One symbol |
| `argos search <query>` | Find tickers by name or code |
| `argos watch` | Show your watchlist |
| `argos watch add <ticker>` · `argos watch rm <ticker>` | Edit your watchlist |
| `argos sentiment [--market kr]` | Sector fear and greed (US by default) |
| `argos screen [options]` | Quant screener (below) |
| `argos digest [--since <date>] [--all]` | New events on your watchlist since your last check |

Options for every command:

| Option | |
|---|---|
| `--json` | Print the raw response as JSON |
| `--lang ko\|en` | Language (default: your config, then `$LANG`) |
| `--range 1M\|3M\|6M\|YTD\|1Y\|3Y\|5Y` | Chart range for `brief` |
| `--ascii` | Draw charts without braille |
| `--no-color` | No colors (`NO_COLOR` works too) |

### Screener

```bash
argos screen --market us --sort upside --min-upside 20
argos screen --market us --beat --min-mcap 1e10
argos screen --market kr --min-mcap-krw 1e13        # KR, ₩10T and up
```

| Option | |
|---|---|
| `--market us\|kr\|jp\|hk\|tw\|cn\|eu` | Market |
| `--sector <text>` | Sector contains this text, e.g. `Semiconductors` |
| `--min-mcap <usd>` | Minimum market cap in dollars |
| `--min-mcap-krw <krw>` | Minimum market cap in won (Korean listings only) |
| `--min-upside <pct>` | Minimum consensus upside, in percent |
| `--beat` | Only companies whose latest quarter beat EPS consensus |
| `--sort cap\|upside\|surprise` | Sort order (default `cap`) |
| `--limit <n>` | Up to 50 rows (default 25) |

```text
$ argos screen --market kr --limit 3 --lang en
TICKER    NAME                         MCAP    UPSIDE  SURPRISE  SECTOR
005930    SAMSUNG ELECTRONICS C…   ₩1476.2T         —    +40.0%  Technology
000660    SK hynix Inc.            ₩1274.7T         —    +41.6%  Technology
005935    SamsungElectronics(1P)    ₩155.1T         —         —  Technology
```

Korean listings show market cap in won. Consensus targets aren't available for them yet, so upside shows `—`.

### Scripting

`--json` prints the server response as is, so you can pipe it into other tools:

```bash
# Consensus gap for several symbols
for t in NVDA AAPL 005930; do
  argos brief "$t" --json | jq -r '[.company.ticker, .consensus.target_gap_pct] | @tsv'
done

# Tickers of US names that beat estimates, largest first
argos screen --market us --beat --json | jq -r '.items[].ticker'

# New events per watchlist symbol over the last 7 days
argos digest --all --json | jq '.by_ticker'
```

Response fields are described in [`docs/API.md`](docs/API.md).

## Configuration

Settings live in `~/.config/argos/` (or `$XDG_CONFIG_HOME/argos`):

| File | Contents |
|---|---|
| `config.json` | Defaults, for example `{ "lang": "ko", "range": "3M", "ascii": false }` |
| `credentials.json` | Device token (owner-only permissions) |
| `state.json` | When you last read the digest |

Environment variables: `ARGOS_API_URL` (default `https://argos.inlevel9.com`), `ARGOS_CONFIG_DIR`, `ARGOS_DEVICE_NAME`, `NO_COLOR`, `BROWSER=none`.

## Troubleshooting

| Problem | Fix |
|---|---|
| The chart shows boxes or `?` | Your font lacks braille characters. Use `--ascii`, or set `"ascii": true` in `config.json`. |
| Columns look misaligned | Use a monospace font that renders Hangul at double width (most do). The interactive terminal is easiest to read at 80 columns or wider. |
| `argos login` didn't open a browser | Open the printed address yourself, on any device. |
| "Sign in first" | Run `argos login`. Only the watchlist and digest need an account. |
| "Couldn't read the server response" | Update: `npm install -g @inlevel9/argos@latest` |
| "Too many requests" | Public endpoints are rate-limited per IP. Wait a minute. |

## Notices

- **Not investment advice.** ARGOS is a free research tool. It doesn't offer individual investment advice, manage money, or recommend buying or selling anything, and it isn't a registered investment adviser. Investment decisions, and any losses, are yours. You can lose principal.
- **Generative AI.** AI briefs are written by generative AI (Google Gemini) and are labeled "AI brief · generated by AI". They can contain mistakes. Check them against the sources on the symbol page.
- **Data.** Prices, filings, and consensus figures come from public and third-party sources listed at <https://argos.inlevel9.com/sources>. They can lag the market, and some fields are empty for some markets.
- **Privacy.** Using the CLI without signing in sends only your requests. Signing in links a device token to your ARGOS account. See the [privacy policy](https://argos.inlevel9.com/privacy) and [terms](https://argos.inlevel9.com/terms).
- **Terminal output.** Text from the server has control characters removed before it's printed, so third-party content can't send escape sequences to your terminal.

## Development

```bash
npm install
npm run dev -- brief NVDA                          # against production
ARGOS_API_URL=http://localhost:3000 npm run dev    # against a local ARGOS server
npm test && npm run typecheck && npm run build
```

Releases: bump `version` in `package.json`, then push a matching `v<version>` tag. CI publishes to npm with provenance (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## License

[MIT](LICENSE)
