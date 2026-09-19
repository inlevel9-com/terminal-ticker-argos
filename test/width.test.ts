import assert from 'node:assert/strict'
import test from 'node:test'
import { padW, table, truncW, widthOf, wrapW } from '../src/ui/width.js'

test('Hangul counts as two columns', () => {
  assert.equal(widthOf('삼성전자'), 8)
  assert.equal(widthOf('SK하이닉스'), 10)
})

test('padW aligns mixed Korean/Latin names to the same display width', () => {
  for (const name of ['NVDA', '삼성전자', 'SK하이닉스', 'ASML Holding N.V.', '현대자동차우선주보통주']) {
    assert.equal(widthOf(padW(name, 12)), 12, name)
    assert.equal(widthOf(padW(name, 12, 'right')), 12, name)
  }
})

test('truncW never splits a wide char past the limit', () => {
  const t = truncW('현대자동차우선주', 7)
  assert.ok(widthOf(t) <= 7)
  assert.ok(t.endsWith('…'))
  assert.equal(truncW('NVDA', 7), 'NVDA')
})

test('table rows line up column-wise regardless of script', () => {
  const rows = [{ t: '005930', n: '삼성전자' }, { t: 'NVDA', n: 'NVIDIA' }, { t: '000660', n: 'SK하이닉스' }]
  const lines = table(rows, [
    { header: 'TICKER', width: 8, get: (r) => r.t },
    { header: 'NAME', width: 12, get: (r) => r.n },
    { header: 'X', width: 3, align: 'right', get: () => '1' },
  ]).split('\n')
  const widths = new Set(lines.map(widthOf))
  assert.equal(widths.size, 1, lines.join('\n'))
})

test('wrapW keeps every line within width, including CJK runs', () => {
  const text = '엔비디아는 데이터센터 매출이 전년 대비 크게 증가했고 가이던스를 상향했다. Gross margin expanded to 75%.'
  for (const line of wrapW(text, 20)) assert.ok(widthOf(line) <= 20, line)
})
