#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { createRequire } from 'node:module'
import { errorMessage } from './api.js'
import { login, logout } from './auth.js'
import * as cmd from './commands.js'
import { loadConfig, type Lang } from './config.js'
import { CHART_RANGES, type ChartRange } from './schema.js'
import { updateCheckEnabled, updateNotice } from './update-check.js'

const { version } = createRequire(import.meta.url)('../package.json') as { version: string }

const HELP = `argos ${version} — ARGOS in your terminal (https://argos.inlevel9.com)

Usage
  argos                          interactive terminal (watchlist, sentiment, screener, digest)
  argos login | logout | whoami  link this device to your ARGOS account
  argos brief <ticker>           one symbol: price, chart, consensus, events, AI brief
  argos search <query>           find tickers (삼성전자, nvidia, 7203…)
  argos watch [add|rm <ticker>]  show or edit your watchlist
  argos sentiment [--market kr]  sector fear & greed
  argos screen [options]         quant screener
      --market us|kr|jp|hk|tw|cn|eu  --sector <text>  --min-mcap <usd>  --min-mcap-krw <krw>
      --min-upside <pct>  --beat  --sort cap|upside|surprise  --limit <n>
  argos digest [--since <date>] [--all]  new events on your watchlist

Options
  --json          print raw JSON (for scripts and agents)
  --lang ko|en    language (default: config, then $LANG)
  --range 3M      chart range: ${CHART_RANGES.join(' ')}
  --ascii         draw charts without braille characters
  --no-color      disable colors (also honors NO_COLOR)
  -v, --version   -h, --help
`

// `argos screen | head` closes stdout early; that's not an error.
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') process.exit(0)
  throw err
})

// Language for error messages printed after main() fails; set once flags are parsed.
let messageLang: Lang = loadConfig().lang

async function main(): Promise<void> {
  const { values: v, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: 'boolean', default: false },
      lang: { type: 'string' },
      range: { type: 'string' },
      ascii: { type: 'boolean' },
      'no-color': { type: 'boolean', default: false },
      market: { type: 'string' },
      sector: { type: 'string' },
      'min-mcap': { type: 'string' },
      'min-mcap-krw': { type: 'string' },
      'min-upside': { type: 'string' },
      beat: { type: 'boolean', default: false },
      sort: { type: 'string' },
      limit: { type: 'string' },
      since: { type: 'string' },
      all: { type: 'boolean', default: false },
      version: { type: 'boolean', short: 'v', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  if (v.version) { process.stdout.write(`${version}\n`); return }
  const [command, ...args] = positionals
  if (v.help || command === 'help') { process.stdout.write(HELP); return }

  const config = loadConfig()
  const lang: Lang = v.lang === 'ko' || v.lang === 'en' ? v.lang : config.lang
  messageLang = lang
  const range = (CHART_RANGES as readonly string[]).includes(String(v.range).toUpperCase())
    ? (String(v.range).toUpperCase() as ChartRange) : config.range
  const flags: cmd.Flags = {
    json: v.json,
    lang,
    range,
    ascii: v.ascii ?? config.ascii,
    color: !v['no-color'] && !process.env.NO_COLOR && process.stdout.isTTY === true,
  }

  switch (command) {
    case undefined: {
      if (!process.stdin.isTTY || !process.stdout.isTTY) { process.stdout.write(HELP); return }
      const [{ render }, { createElement }, { App }] = await Promise.all([
        import('ink'), import('react'), import('./tui/App.js'),
      ])
      // Alternate screen buffer: the TUI never scrolls the user's shell history.
      process.stdout.write('\x1b[?1049h')
      const restore = () => process.stdout.write('\x1b[?1049l')
      process.on('exit', restore)
      const app = render(createElement(App, { config: { ...config, lang, range, ascii: flags.ascii } }), { exitOnCtrlC: true })
      await app.waitUntilExit()
      return
    }
    case 'login': return login(lang)
    case 'logout': process.stdout.write(`${await logout(lang)}\n`); return
    case 'whoami': return cmd.whoami(flags)
    case 'brief': return args[0] ? cmd.brief(args[0], flags) : usage('argos brief <ticker>')
    case 'search': return args.length ? cmd.search(args.join(' '), flags) : usage('argos search <query>')
    case 'watch': return cmd.watch(args[0], args[1], flags)
    case 'sentiment': return cmd.sentiment(v.market === 'kr' ? 'kr' : 'us', flags)
    case 'screen': return cmd.screen({
      market: v.market, sector: v.sector, min_mcap: v['min-mcap'], min_mcap_krw: v['min-mcap-krw'], min_upside: v['min-upside'],
      beat: v.beat, sort: v.sort, limit: v.limit,
    }, flags)
    case 'digest': return cmd.digest(flags, { since: v.since, all: v.all })
    default:
      // `argos NVDA` is shorthand for `argos brief NVDA`.
      if (args.length === 0 && /^[\w.\-:]{1,15}$/.test(command)) return cmd.brief(command, flags)
      return usage(`unknown command: ${command}`)
  }
}

function usage(message: string): void {
  process.stderr.write(`${message}\nRun \`argos --help\` for usage.\n`)
  process.exitCode = 2
}

main()
  .catch((err: unknown) => {
    process.stderr.write(`argos: ${errorMessage(err, messageLang)}\n`)
    process.exitCode = 1
  })
  .then(async () => {
    const argv = process.argv.slice(2)
    // Skip for the TUI (no command): it exits through the alternate screen, which would swallow the line.
    const hasCommand = argv.some((a) => !a.startsWith('-'))
    if (!hasCommand || !updateCheckEnabled(argv.includes('--json')) || argv.includes('-v') || argv.includes('--version')) return
    const notice = await updateNotice(version, messageLang).catch(() => null)
    if (notice) process.stderr.write(`\n${notice}\n`)
  })
