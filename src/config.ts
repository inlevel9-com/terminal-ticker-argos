import { mkdirSync, readFileSync, writeFileSync, rmSync, chmodSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { CHART_RANGES, type ChartRange } from './schema.js'

export const API_URL = (process.env.ARGOS_API_URL ?? 'https://argos.inlevel9.com').replace(/\/+$/, '')

const DIR = process.env.ARGOS_CONFIG_DIR
  ?? join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'argos')

export type Lang = 'ko' | 'en'
export type Config = { lang: Lang; range: ChartRange; ascii: boolean }
export type State = { lastDigestAt?: string }
export type Credentials = { token: string; email: string | null }

function readJson<T>(name: string): Partial<T> {
  try {
    return JSON.parse(readFileSync(join(DIR, name), 'utf8')) as Partial<T>
  } catch {
    return {}
  }
}

function writeJson(name: string, value: unknown, mode = 0o644): void {
  mkdirSync(DIR, { recursive: true, mode: 0o700 })
  const path = join(DIR, name)
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode })
  chmodSync(path, mode)
}

function systemLang(): Lang {
  const v = process.env.LC_ALL ?? process.env.LC_MESSAGES ?? process.env.LANG ?? ''
  return v.toLowerCase().startsWith('ko') ? 'ko' : 'en'
}

export function loadConfig(): Config {
  const raw = readJson<Config>('config.json')
  return {
    lang: raw.lang === 'ko' || raw.lang === 'en' ? raw.lang : systemLang(),
    range: CHART_RANGES.includes(raw.range as ChartRange) ? (raw.range as ChartRange) : '3M',
    ascii: raw.ascii === true,
  }
}

export const loadState = (): State => readJson<State>('state.json')
export const saveState = (state: State): void => writeJson('state.json', state)

// The token is a long-lived bearer credential: keep the file owner-only (0600).
export function loadCredentials(): Credentials | null {
  const raw = readJson<Credentials>('credentials.json')
  return typeof raw.token === 'string' && raw.token ? { token: raw.token, email: raw.email ?? null } : null
}
export const saveCredentials = (c: Credentials): void => writeJson('credentials.json', c, 0o600)
export function clearCredentials(): void {
  rmSync(join(DIR, 'credentials.json'), { force: true })
}
