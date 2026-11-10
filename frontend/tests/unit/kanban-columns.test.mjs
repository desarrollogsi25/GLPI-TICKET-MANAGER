import assert from 'node:assert/strict'
import test from 'node:test'
import { ticketColumn } from '../../src/features/tickets/kanbanColumns.ts'

test('P1-02 BI: two unassigned tickets and two closed tickets yield four exclusive cards', () => {
  const tickets = [
    { id: 12, status: 1, assigneeIds: [] },
    { id: 1041, status: 2, assigneeIds: [] },
    { id: 1029, status: 6, assigneeIds: [] },
    { id: 1042, status: 6, assigneeIds: [8] },
  ]
  assert.deepEqual(tickets.map(ticketColumn), ['queue', 'queue', 'resolved', 'resolved'])
  assert.equal(tickets.length, 4)
})

test('GLPI assigned, planned and pending keep their distinct columns', () => {
  assert.deepEqual([2, 3, 4, 5, 6].map(status => ticketColumn({ status, assigneeIds: [7] })),
    ['mine', 'in_progress', 'pending', 'resolved', 'resolved'])
})
