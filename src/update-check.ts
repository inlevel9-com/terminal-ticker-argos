// Once a day, look up the latest published version and, if it's newer, print a
// one-line notice after the command. Never blocks for long (1.5s timeout), never
// runs in CI, pipes, or --json output, and honors NO_UPDATE_NOTIFIER.
import { loadState, saveState } from './config.js'

const DAY_MS = 86_400_000
const REGISTRY = 'https://registry.npmjs.org/@inlevel9%2fargos/latest'

export function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('-')[0]!.split('.').map((n) => Number(n) || 0)
  const [a, b] = [parse(latest), parse(current)]
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0)
  }
  return false
}

export function updateCheckEnabled(json: boolean): boolean {
  return !json && process.stderr.isTTY === true && !process.env.CI && !process.env.NO_UPDATE_NOTIFIER
}

// Returns the notice to print (or null) using the cached result, and refreshes
// the cache in the background when it's older than a day.
export async function updateNotice(current: string, lang: 'ko' | 'en'): Promise<string | null> {
  const state = loadState()
  if (!state.lastUpdateCheck || Date.now() - Date.parse(state.lastUpdateCheck) > DAY_MS) {
    try {
      const res = await fetch(REGISTRY, { signal: AbortSignal.timeout(1500), headers: { accept: 'application/json' } })
      const latest = res.ok ? ((await res.json()) as { version?: string }).version : undefined
      saveState({ ...loadState(), lastUpdateCheck: new Date().toISOString(), latestVersion: latest ?? state.latestVersion })
      state.latestVersion = latest ?? state.latestVersion
    } catch {
      saveState({ ...loadState(), lastUpdateCheck: new Date().toISOString() })
    }
  }
  if (!state.latestVersion || !isNewer(state.latestVersion, current)) return null
  return lang === 'ko'
    ? `새 버전 ${state.latestVersion}이 있습니다 (현재 ${current}). 업데이트: npm i -g @inlevel9/argos`
    : `argos ${state.latestVersion} is available (you have ${current}). Update: npm i -g @inlevel9/argos`
}
