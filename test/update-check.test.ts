import assert from 'node:assert/strict'
import test from 'node:test'
import { isNewer } from '../src/update-check.js'
import { retryDelayMs } from '../src/api.js'

test('isNewer compares semver numerically', () => {
  assert.ok(isNewer('0.1.10', '0.1.9'))
  assert.ok(isNewer('1.0.0', '0.9.9'))
  assert.ok(!isNewer('0.1.0', '0.1.0'))
  assert.ok(!isNewer('0.1.0', '0.2.0'))
  assert.ok(!isNewer('0.2.0-beta.1', '0.2.0'))
})

test('retry delay backs off and honors Retry-After up to 10s', () => {
  assert.equal(retryDelayMs(0, null), 500)
  assert.equal(retryDelayMs(1, null), 1000)
  assert.equal(retryDelayMs(0, '3'), 3000)
  assert.equal(retryDelayMs(0, '120'), 10_000)
  assert.equal(retryDelayMs(1, 'soon'), 1000)
})
