import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, resolve } from 'node:path'

const SERVICES = ['glpi-db', 'app-db', 'glpi', 'api', 'frontend']
const lines = value => value.trim().split(/\s+/).filter(Boolean)

/** Refuse all removal until every project container and network has been inspected. */
export function cleanupFixture({ docker, compose, project, runId, manifest }) {
  if (!/^[a-f0-9]{32}$/.test(runId) || project !== `glpi-e2e-${runId}`) throw new Error('Refusing cleanup: invalid fixture identity')
  const filter = `label=com.docker.compose.project=${project}`
  const ids = lines(docker(['ps', '-aq', '--filter', filter]))
  const knownIds = new Set()
  const knownServices = new Set()
  for (const id of ids) {
    const resource = JSON.parse(docker(['inspect', id]))[0]
    const labels = resource?.Config?.Labels
    const service = labels?.['com.docker.compose.service']
    if (!/^[a-f0-9]{64}$/.test(resource?.Id ?? '') ||
        labels?.['com.docker.compose.project'] !== project || labels?.['io.glpi.e2e.run-id'] !== runId ||
        !SERVICES.includes(service) || knownServices.has(service) ||
        (manifest && manifest.containers[service] !== resource.Id) ||
        (resource.Mounts ?? []).some(mount => mount.Type !== 'tmpfs')) {
      throw new Error('Refusing cleanup: container identity or storage mismatch')
    }
    knownIds.add(resource.Id)
    knownServices.add(service)
  }
  const networkIds = lines(docker(['network', 'ls', '-q', '--filter', filter]))
  for (const id of networkIds) {
    const network = JSON.parse(docker(['network', 'inspect', id]))[0]
    if (network?.Labels?.['io.glpi.e2e.run-id'] !== runId ||
        network.Labels['com.docker.compose.project'] !== project ||
        Object.keys(network.Containers ?? {}).some(member => !knownIds.has(member))) {
      throw new Error('Refusing cleanup: network identity or membership mismatch')
    }
  }
  if (lines(docker(['volume', 'ls', '-q', '--filter', filter])).length) {
    throw new Error('Refusing cleanup: unexpected persistent project volumes')
  }
  // Deliberately no --remove-orphans: only services from the dedicated Compose file.
  compose(['down', '--volumes', '--timeout', '10'])
  if (lines(docker(['ps', '-aq', '--filter', filter])).length ||
      lines(docker(['volume', 'ls', '-q', '--filter', filter])).length ||
      lines(docker(['network', 'ls', '-q', '--filter', filter])).length) {
    throw new Error('Fixture cleanup left resources behind')
  }
}

/** Only remove the direct mkdtemp child allocated for this run, never a manifest path. */
export function removeTemporaryFixtureDirectory(temp, { tempRoot = tmpdir(), remove = rmSync } = {}) {
  if (!isAbsolute(temp) || resolve(temp) !== temp || dirname(temp) !== resolve(tempRoot) ||
      !/^glpi-e2e-[a-zA-Z0-9]+$/.test(basename(temp))) {
    throw new Error('Refusing cleanup: temporary directory is outside the fixture workspace')
  }
  remove(temp, { recursive: true, force: true })
}
