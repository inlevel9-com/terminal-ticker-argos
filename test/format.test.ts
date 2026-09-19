import assert from 'node:assert/strict'
import test from 'node:test'
import { changes, marketCap, pct, price } from '../src/format.js'
import { History } from '../src/schema.js'

test('number formatting', () => {
  assert.equal(pct(1.234), '+1.2%')
  assert.equal(pct(-0.4), '-0.4%')
  assert.equal(pct(null), '—')
  assert.equal(price(71200, 'KRW'), '71,200')
  assert.equal(price(182.4, 'USD'), '182.40')
  assert.equal(marketCap(4.4e12), '$4.40T')
  assert.equal(marketCap(1.065e12, 1476185348520000, 'ko'), '₩1476조')
  assert.equal(marketCap(1.065e12, 1476185348520000, 'en'), '₩1476.2T')
  assert.equal(marketCap(null, 350_000_000_000, 'ko'), '₩3,500억')
})

test('changes derive day and range moves from closes', () => {
  const h = History.parse({
    company: { ticker: 'X', currency: 'USD' },
    series: { currency: 'USD', range: '1M', source: 'Yahoo Finance', points: [100, 110, 121].map((close, i) => ({ time: `2026-09-0${i + 1}`, open: null, high: null, low: null, close, volume: null })) },
  })
  const c = changes(h)
  assert.equal(c.last, 121)
  assert.equal(Math.round(c.day! * 10) / 10, 10)
  assert.equal(Math.round(c.range!), 21)
  assert.deepEqual(changes(null), { last: null, day: null, range: null })
})

test('eventKind maps server event types to short labels', async () => {
  const { eventKind } = await import('../src/format.js')
  assert.equal(eventKind('kr_insider_exec', 'ko'), '내부자')
  assert.equal(eventKind('kr_major_change', 'en'), 'Stake')
  assert.equal(eventKind('earnings_scheduled', 'ko'), '실적')
  assert.equal(eventKind('filing_other', 'en'), 'Filing')
  assert.equal(eventKind('analyst_action', 'ko'), '리포트')
  assert.equal(eventKind('brand_new_type', 'en'), 'brand')
})
