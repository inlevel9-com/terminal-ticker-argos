// Minimal ANSI styling for non-interactive output. Disabled when --no-color,
// NO_COLOR is set, or stdout isn't a TTY (see index.ts).
const CODES = { bold: [1, 22], dim: [2, 22], red: [31, 39], green: [32, 39], yellow: [33, 39], cyan: [36, 39], gray: [90, 39] } as const
export type Style = keyof typeof CODES

export function paint(enabled: boolean): Record<Style, (s: string) => string> {
  const entries = Object.entries(CODES).map(([k, [on, off]]) => [k, (s: string) => (enabled ? `\x1b[${on}m${s}\x1b[${off}m` : s)])
  return Object.fromEntries(entries) as Record<Style, (s: string) => string>
}

export const color = {
  band: (band: string | null): Style => (band?.includes('fear') ? 'red' : band?.includes('greed') ? 'green' : 'yellow'),
}
