import { resetTicket } from '../../../../scripts/e2e/guard.mjs'

/** Resets only after the common guard verifies both disposable databases. */
export function resetFixtureTicket(ticketId: number, name: string): void {
  resetTicket(ticketId, name)
}
