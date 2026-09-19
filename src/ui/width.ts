// Display-width helpers. Hangul/CJK occupy 2 terminal columns, so every pad and
// truncate in this client goes through here — never String.padEnd/slice.
import stringWidth from 'string-width'

export const widthOf = (s: string): number => stringWidth(s)

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export function truncW(s: string, max: number): string {
  if (max <= 0) return ''
  if (stringWidth(s) <= max) return s
  let out = ''
  let w = 0
  for (const { segment } of segmenter.segment(s)) {
    const sw = stringWidth(segment)
    if (w + sw > max - 1) break
    out += segment
    w += sw
  }
  return `${out}…`
}

export function padW(s: string, width: number, align: 'left' | 'right' = 'left'): string {
  const t = truncW(s, width)
  const gap = ' '.repeat(Math.max(0, width - stringWidth(t)))
  return align === 'right' ? gap + t : t + gap
}

// Greedy wrap by display width; breaks on spaces when it can, mid-word (CJK) when it can't.
export function wrapW(text: string, width: number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    let w = 0
    for (const word of para.split(/(\s+)/)) {
      const ww = stringWidth(word)
      if (w + ww <= width) { line += word; w += ww; continue }
      if (line.trim()) lines.push(line.trimEnd())
      line = ''; w = 0
      if (/^\s+$/.test(word)) continue
      for (const { segment } of segmenter.segment(word)) {
        const sw = stringWidth(segment)
        if (w + sw > width) { lines.push(line); line = ''; w = 0 }
        line += segment; w += sw
      }
    }
    lines.push(line.trimEnd())
  }
  return lines
}

export type Column<T> = { header: string; width: number; align?: 'left' | 'right'; get: (row: T) => string }

export function table<T>(rows: T[], columns: Column<T>[]): string {
  const line = (cells: string[]) => cells.map((c, i) => padW(c, columns[i]!.width, columns[i]!.align)).join('  ').trimEnd()
  return [line(columns.map((c) => c.header)), ...rows.map((r) => line(columns.map((c) => c.get(r))))].join('\n')
}
