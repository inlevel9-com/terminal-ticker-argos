import assert from 'node:assert/strict'
import test from 'node:test'
import { lineChart } from '../src/ui/chart.js'
import { widthOf } from '../src/ui/width.js'

test('braille chart has exactly rows x cols cells', () => {
  const lines = lineChart([1, 3, 2, 5, 4, 6, 8, 7], 30, 5)
  assert.equal(lines.length, 5)
  for (const l of lines) {
    assert.equal([...l].length, 30)
    assert.equal(widthOf(l), 30)
  }
})

test('rising series ends higher than it starts', () => {
  const lines = lineChart([1, 2, 3, 4, 5], 10, 4)
  const first = lines.findIndex((l) => [...l][0] !== '⠀')
  const last = lines.findIndex((l) => [...l][9] !== '⠀')
  assert.ok(last < first, lines.join('\n'))
})

test('ascii fallback and flat/empty series', () => {
  assert.ok(lineChart([1, 2, 3], 10, 3, true).every((l) => /^[* ]{10}$/.test(l)))
  assert.equal(lineChart([5, 5, 5], 8, 2).length, 2)
  assert.equal(lineChart([], 8, 2).join(''), '⠀'.repeat(16))
})
