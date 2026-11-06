import assert from 'node:assert/strict'
import test from 'node:test'

import axios from 'axios'

import { isNetworkFailure } from '../../src/lib/api/network-error.ts'
import { getApiErrorMessage } from '../../src/lib/api/errors.ts'

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

test('403 error does not disclose internal user and ticket identifiers', () => {
  const config = new axios.AxiosError('Forbidden', 'ERR_BAD_RESPONSE').config
  const error = new axios.AxiosError('Forbidden', 'ERR_BAD_RESPONSE', config, {}, {
    status: 403,
    statusText: 'Forbidden',
    headers: {},
    config,
    data: { detail: 'User 12 cannot view ticket 1032' },
  })
  assert.equal(getApiErrorMessage(error), 'No tienes permiso para realizar esta acción.')
})

test('timeout is reported as a timeout, not an offline backend', () => {
  assert.equal(
    getApiErrorMessage(new axios.AxiosError('timeout', 'ECONNABORTED')),
    'El API tardó demasiado en responder.',
  )
})
