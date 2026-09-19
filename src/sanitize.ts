// Server text (filing titles, news, AI briefs) comes from third parties and is
// written straight to the terminal. Strip C0/C1 control characters, except
// newline and tab, so a crafted title can't carry ANSI/OSC escape sequences
// (cursor moves, fake prompts, clickable-link spoofing, title changes).
const CONTROL = new RegExp('[\\u0000-\\u0008\\u000b-\\u001f\\u007f-\\u009f]', 'g')

export function stripControl(s: string): string {
  return s.replace(CONTROL, '')
}

export function sanitizeDeep<T>(value: T): T {
  if (typeof value === 'string') return stripControl(value) as T
  if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeDeep(v)
    return out as T
  }
  return value
}

// Only open URLs on the API's own site (or its subdomains) over https, or plain
// http for a localhost API during development.
export function isTrustedUrl(url: string, apiUrl: string): boolean {
  try {
    const u = new URL(url)
    const api = new URL(apiUrl)
    const local = api.hostname === 'localhost' || api.hostname === '127.0.0.1'
    if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) return false
    const base = api.hostname.replace(/^www\./, '')
    return u.hostname === base || u.hostname.endsWith(`.${base}`)
  } catch {
    return false
  }
}
