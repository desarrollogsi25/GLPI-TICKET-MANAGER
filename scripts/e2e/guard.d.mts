export interface FixtureManifest {
  version: 1;
  runId: string;
  context: string;
  project: string;
  composeFile: string;
  frontendUrl: string;
  glpiUrl: string;
  apiUrl: string;
  containers: Record<'glpi-db' | 'app-db' | 'glpi' | 'api' | 'frontend', string>;
  credentials: { mariaUser: 'e2e'; mariaPassword: string; appUser: 'e2e'; appPassword: string };
  expiresAt: string;
}
export interface GuardDependencies {
  execFileSync?: (...args: any[]) => string | Buffer;
  readFileSync?: (...args: any[]) => string | Buffer;
  now?: () => number;
}
export function verifyFixtureResources(env?: NodeJS.ProcessEnv, deps?: GuardDependencies): FixtureManifest;
export function assertDisposableFixture(env?: NodeJS.ProcessEnv, deps?: GuardDependencies): FixtureManifest;
export function runFixtureSql(engine: 'mariadb' | 'postgres', sql: string, env?: NodeJS.ProcessEnv, deps?: GuardDependencies): string;
export function resetFixtures(env?: NodeJS.ProcessEnv, deps?: GuardDependencies): void;
export function resetTicket(ticketId: number, name: string, env?: NodeJS.ProcessEnv, deps?: GuardDependencies): string;
export function main(argv?: string[], env?: NodeJS.ProcessEnv, deps?: GuardDependencies, io?: { write: (value: string) => unknown; error: (value: string) => unknown }): number;
