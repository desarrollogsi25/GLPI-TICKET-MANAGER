param([ValidateSet('sistemaopensourceglpi')][string]$ProjectName = 'sistemaopensourceglpi')

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$composeArgs = @('compose', '-p', $ProjectName, '-f', (Join-Path $projectRoot 'docker-compose.yml'), '-f', (Join-Path $projectRoot 'docker-compose.local-sync.yml'))

function Invoke-CheckedDocker {
    param([string[]]$DockerArgs)
    & docker @DockerArgs
    if ($LASTEXITCODE -ne 0) { throw "Docker command failed (exit $LASTEXITCODE)." }
}

# The pre-H65 LAN container was standalone. Replace only that named frontend,
# and retain every database volume (no --volumes / --remove-orphans).
$lanInfo = & docker inspect glpi-lan-frontend 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -eq 0 -and $lanInfo) {
    $owner = $lanInfo[0].Config.Labels.'com.docker.compose.project'
    if (-not $owner) {
        Invoke-CheckedDocker -DockerArgs @('stop', 'glpi-lan-frontend')
        Invoke-CheckedDocker -DockerArgs @('rm', 'glpi-lan-frontend')
    } elseif ($owner -ne $ProjectName) {
        throw "glpi-lan-frontend belongs to compose project '$owner'."
    }
}

Invoke-CheckedDocker -DockerArgs ($composeArgs + @('down'))
Invoke-CheckedDocker -DockerArgs ($composeArgs + @('up', '-d', '--build'))

$imageIds = @('glpi-frontend', 'glpi-lan-frontend') | ForEach-Object {
    & docker inspect $_ --format '{{.Image}}'
    if ($LASTEXITCODE -ne 0) { throw "Cannot inspect $_." }
}
if ($imageIds[0] -ne $imageIds[1]) { throw 'Frontend images differ.' }
Write-Output "Both frontend containers use $($imageIds[0])."
