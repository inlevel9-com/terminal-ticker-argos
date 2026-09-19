// Line chart rasterized onto a dot matrix, then encoded as braille (2x4 dots per
// cell) or, for fonts without braille, one '*' per cell.
const DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
] as const

export function lineChart(values: number[], cols: number, rows: number, ascii = false): string[] {
  const dx = ascii ? 1 : 2
  const dy = ascii ? 1 : 4
  const W = Math.max(1, cols) * dx
  const H = Math.max(1, rows) * dy
  const grid: boolean[][] = Array.from({ length: H }, () => Array<boolean>(W).fill(false))

  const data = values.filter((v) => Number.isFinite(v))
  if (data.length >= 2) {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const span = max - min || 1
    const yAt = (x: number): number => {
      const pos = (x / (W - 1 || 1)) * (data.length - 1)
      const i = Math.floor(pos)
      const a = data[i]!
      const b = data[Math.min(i + 1, data.length - 1)]!
      const v = a + (b - a) * (pos - i)
      return Math.round((1 - (v - min) / span) * (H - 1))
    }
    let prev = yAt(0)
    for (let x = 0; x < W; x++) {
      const y = yAt(x)
      // Fill the vertical gap so steep moves stay a connected line.
      for (let yy = Math.min(prev, y); yy <= Math.max(prev, y); yy++) grid[yy]![x] = true
      prev = y
    }
  }

  const out: string[] = []
  for (let r = 0; r < H; r += dy) {
    let line = ''
    for (let c = 0; c < W; c += dx) {
      if (ascii) { line += grid[r]![c] ? '*' : ' '; continue }
      let bits = 0
      for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 2; xx++) if (grid[r + yy]![c + xx]) bits |= DOT_BITS[yy]![xx]!
      // U+2800 (blank braille) keeps column width identical to a filled cell.
      line += String.fromCodePoint(0x2800 + bits)
    }
    out.push(line)
  }
  return out
}
