import assert from 'node:assert/strict'
import test from 'node:test'
import { isTrustedUrl, sanitizeDeep, stripControl } from '../src/sanitize.js'

const ESC = String.fromCharCode(27)
const BEL = String.fromCharCode(7)

test('stripControl removes escape sequences but keeps newlines and tabs', () => {
  assert.equal(stripControl(`8-K${ESC}[2J${ESC}]0;pwned${BEL} filed`), '8-K[2J]0;pwned filed')
  assert.equal(stripControl('line1\nline2\tx'), 'line1\nline2\tx')
  assert.equal(stripControl('삼성전자'), '삼성전자')
})

test('sanitizeDeep walks objects and arrays', () => {
  const v = sanitizeDeep({ a: `x${ESC}y`, b: [`${ESC}z`], n: 1, nil: null })
  assert.deepEqual(v, { a: 'xy', b: ['z'], n: 1, nil: null })
})

test('isTrustedUrl only allows the API site', () => {
  const api = 'https://argos.inlevel9.com'
  assert.ok(isTrustedUrl('https://argos.inlevel9.com/link/mac?user_code=A7KQ2M', api))
  assert.ok(!isTrustedUrl('https://evil.example/link', api))
  assert.ok(!isTrustedUrl('http://argos.inlevel9.com/link', api))
  assert.ok(!isTrustedUrl('https://argos.inlevel9.com.evil.example/', api))
  assert.ok(!isTrustedUrl('javascript:alert(1)', api))
  assert.ok(isTrustedUrl('http://localhost:3000/link/mac', 'http://localhost:3000'))
})
