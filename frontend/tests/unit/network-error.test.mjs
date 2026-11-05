import assert from 'node:assert/strict'
import test from 'node:test'

import axios from 'axios'

import { isNetworkFailure } from '../../src/lib/api/network-error.ts'

test('canceled requests are not network failures', () => {
  assert.equal(isNetworkFailure(new axios.CanceledError('canceled')), false)
  assert.equal(isNetworkFailure(new axios.AxiosError('canceled', 'ERR_CANCELED')), false)
})

test('connectivity failures are detected', () => {
  assert.equal(isNetworkFailure(new axios.AxiosError('Network Error', 'ERR_NETWORK')), true)
  assert.equal(isNetworkFailure(new axios.AxiosError('timeout', 'ECONNABORTED')), true)
  assert.equal(isNetworkFailure(new axios.AxiosError('timeout', 'ETIMEDOUT')), true)
})

test('HTTP responses and foreign errors are not connectivity failures', () => {
  const config = new axios.AxiosError('server', 'ERR_BAD_RESPONSE').config
  const withResponse = new axios.AxiosError('server', 'ERR_BAD_RESPONSE', config, {}, {
    status: 500,
    statusText: 'Internal Server Error',
    headers: {},
    config,
    data: {},
  })
  assert.equal(isNetworkFailure(withResponse), false)
  assert.equal(isNetworkFailure(new Error('boom')), false)
  assert.equal(isNetworkFailure(null), false)
})
