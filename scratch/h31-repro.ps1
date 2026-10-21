# H-31 reproduction harness: exercises POST /api/tickets/{id}/solutions and
# PATCH /api/tickets/{id}/status against the local stack and prints the exact
# HTTP status + ProblemDetails body for every case in the matrix.
# Compatible with Windows PowerShell 5.1.
param(
  [string]$Api = 'http://localhost:8080',
  [int]$TicketId = 9501
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot

Add-Type -AssemblyName System.Net.Http

function Get-DbPassword {
  $line = Get-Content (Join-Path $repo '.env') | Where-Object { $_ -match '^MARIADB_PASSWORD=' } | Select-Object -First 1
  return ($line -replace '^MARIADB_PASSWORD=', '')
}

function Invoke-Db {
  param([string]$Sql)
  $pw = Get-DbPassword
  $out = $Sql | & docker compose exec -T glpi-db mariadb -u glpi "-p$pw" glpi 2>$null
  return ($out | Out-String)
}

$script:client = New-Object System.Net.Http.HttpClient

function Invoke-Api {
  param(
    [string]$Method, [string]$Uri, [string]$Token,
    $Body = $null, [string]$RawBody = $null
  )
  $req = [System.Net.Http.HttpRequestMessage]::new()
  $req.Method = [System.Net.Http.HttpMethod]::new($Method)
  $req.RequestUri = $Uri
  if (-not [string]::IsNullOrEmpty($Token)) {
    $req.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $Token)
  }
  if ($PSBoundParameters.ContainsKey('RawBody')) {
    $req.Content = [System.Net.Http.StringContent]::new($RawBody, [System.Text.Encoding]::UTF8, 'application/json')
  } elseif ($PSBoundParameters.ContainsKey('Body')) {
    $json = ($Body | ConvertTo-Json -Depth 6 -Compress)
    $req.Content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, 'application/json')
  }
  $resp = $script:client.SendAsync($req).GetAwaiter().GetResult()
  $text = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  $parsed = $null
  try { $parsed = $text | ConvertFrom-Json } catch { }
  [pscustomobject]@{ Status = [int]$resp.StatusCode; Body = $text; Json = $parsed }
}

function Reset-Ticket {
  param([int]$Id, [int]$Status = 1, [bool]$ClearSolution = $true)
  $del = if ($ClearSolution) { "DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=$Id;" } else { "" }
  Invoke-Db @"
INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES ($Id, 0, 'H-31 repro fixture', NOW(), NOW(), $Status, 3, 'Fixture H-31', 3, 3, 3, 1, 1, 2)
ON DUPLICATE KEY UPDATE status=$Status, solvedate=NULL, closedate=NULL, date_mod=NOW();
INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES ($Id, 1, 2)
ON DUPLICATE KEY UPDATE groups_id=1, type=2;
DELETE FROM glpi_tickets_users WHERE tickets_id=$Id AND type=2;
$del
"@
}

function Show {
  param([string]$Label, $Result)
  $body = $Result.Body
  if ($body.Length -gt 700) { $body = $body.Substring(0, 700) + '...' }
  Write-Host ("`n### {0}`n    HTTP {1}`n    {2}" -f $Label, $Result.Status, $body)
}

# ---------------------------------------------------------------- login
$login = Invoke-Api -Method Post -Uri "$Api/api/auth/login" -Token '' -Body @{ username = 'tech1'; password = 'Tech1Pass!' }
if ($login.Status -ne 200) { throw "login failed: $($login.Body)" }
$token = $login.Json.accessToken
Write-Host "== logged in as $($login.Json.user.username) (id $($login.Json.user.userId)) =="

$base = "$Api/api/tickets/$TicketId"

Write-Host "`n=================== H-31 MATRIX ==================="

# A. empty content
Reset-Ticket -Id $TicketId -Status 1
$a = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = '' }
Show 'A. POST /solutions  content="" (empty)' $a

# B. whitespace-only content
$b = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = '     ' }
Show 'B. POST /solutions  content="     " (whitespace)' $b

# C. missing content property entirely
$c = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -RawBody '{}'
Show 'C. POST /solutions  body={} (no content key)' $c

# D. content > 2000 chars
$d = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = ('A' * 2001) }
Show 'D. POST /solutions  content length 2001' $d

# E. technician NOT assigned (ticket in group 1, other tech not in that group)
Reset-Ticket -Id $TicketId -Status 1
$other = Invoke-Api -Method Post -Uri "$Api/api/auth/login" -Token '' -Body @{ username = 'tecnico_test1'; password = 'Tec123!' }
if ($other.Status -eq 200) {
  $e = Invoke-Api -Method Post -Uri "$base/solutions" -Token $other.Json.accessToken -Body @{ content = 'Intento de otro tecnico sin relacion con el ticket' }
  Show 'E. POST /solutions  by technician NOT assigned and NOT in group' $e
} else {
  Write-Host "`n### E. skipped: tecnico_test1 login failed -> $($other.Status) $($other.Body)"
}

# F. valid solution then status 5 (happy path)
Reset-Ticket -Id $TicketId -Status 1
Invoke-Api -Method Post -Uri "$base/claim" -Token $token | Out-Null
$f1 = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = 'Solucion valida de prueba para el caso feliz' }
Show 'F1. POST /solutions  valid content (30+ chars)' $f1
$f2 = Invoke-Api -Method Patch -Uri "$base/status" -Token $token -Body @{ status = 5 }
Show 'F2. PATCH /status {status:5} after valid solution' $f2
Write-Host "    DB after F: $(Invoke-Db "SELECT id,status,solvedate IS NOT NULL AS solved FROM glpi_tickets WHERE id=$TicketId;")"

# G. SHORT solution ("OK") then status 5  <-- suspected 422 root cause
Reset-Ticket -Id $TicketId -Status 1
Invoke-Api -Method Post -Uri "$base/claim" -Token $token | Out-Null
$g1 = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = 'OK' }
Show 'G1. POST /solutions  content="OK" (2 chars, UI explicitly allows it)' $g1
$g2 = Invoke-Api -Method Patch -Uri "$base/status" -Token $token -Body @{ status = 5 }
Show 'G2. PATCH /status {status:5} after short solution' $g2
Write-Host "    DB solutions after G: $(Invoke-Db "SELECT id,status,CHAR_LENGTH(content) AS len FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=$TicketId;")"

# G3. solution of exactly 9 and exactly 10 chars
foreach ($len in 9, 10) {
  Reset-Ticket -Id $TicketId -Status 1
  Invoke-Api -Method Post -Uri "$base/claim" -Token $token | Out-Null
  $s1 = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = ('B' * $len) }
  $s2 = Invoke-Api -Method Patch -Uri "$base/status" -Token $token -Body @{ status = 5 }
  Show ("G3.len=$len POST={0} then PATCH={1}" -f $s1.Status, $s2.Status) $s2
}

# H. ticket already resolved (status 5) -> POST another solution
Reset-Ticket -Id $TicketId -Status 5
$h = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = 'Segunda solucion sobre ticket ya resuelto' }
Show 'H. POST /solutions  ticket already status 5' $h

# I. reopened ticket that keeps a historical solution
Reset-Ticket -Id $TicketId -Status 1
Invoke-Api -Method Post -Uri "$base/claim" -Token $token | Out-Null
Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = 'Solucion historica que debe quedar obsoleta' } | Out-Null
Invoke-Api -Method Patch -Uri "$base/status" -Token $token -Body @{ status = 5 } | Out-Null
$i1 = Invoke-Api -Method Post -Uri "$base/reopen" -Token $token -Body @{ reason = 'Reapertura para prueba' }
Show 'I1. POST /reopen  (after resolve)' $i1
Write-Host "    DB ticket after reopen: $(Invoke-Db "SELECT id,status FROM glpi_tickets WHERE id=$TicketId;")"
Write-Host "    DB solutions after reopen: $(Invoke-Db "SELECT id,status,CHAR_LENGTH(content) AS len FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=$TicketId;")"
$i2 = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = 'Solucion nueva despues de reabrir el ticket' }
Show 'I2. POST /solutions  after reopen' $i2
$i3 = Invoke-Api -Method Patch -Uri "$base/status" -Token $token -Body @{ status = 5 }
Show 'I3. PATCH /status {status:5} after reopen + new solution' $i3

# J. double submit (two POST /solutions back to back)
Reset-Ticket -Id $TicketId -Status 1
Invoke-Api -Method Post -Uri "$base/claim" -Token $token | Out-Null
$j1 = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = 'Solucion del primer clic del boton resolver' }
$j2 = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = 'Solucion del primer clic del boton resolver' }
Show 'J1. POST /solutions  (first click)' $j1
Show 'J2. POST /solutions  (second click, double submit)' $j2
Write-Host "    DB solutions after double submit: $(Invoke-Db "SELECT id,status,CHAR_LENGTH(content) AS len FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=$TicketId;")"
Write-Host "    DB ticket after double submit: $(Invoke-Db "SELECT id,status FROM glpi_tickets WHERE id=$TicketId;")"

# K. PATCH /status 5 with solution embedded in the body (alternative flow)
Reset-Ticket -Id $TicketId -Status 1
Invoke-Api -Method Post -Uri "$base/claim" -Token $token | Out-Null
$k = Invoke-Api -Method Patch -Uri "$base/status" -Token $token -Body @{ status = 5; solution = 'Solucion enviada dentro del PATCH de estado' }
Show 'K. PATCH /status {status:5, solution:"..."}' $k
Write-Host "    DB solutions after K: $(Invoke-Db "SELECT id,status,CHAR_LENGTH(content) AS len FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=$TicketId;")"
Write-Host "    DB ticket after K: $(Invoke-Db "SELECT id,status FROM glpi_tickets WHERE id=$TicketId;")"

# L. GLPI side effect: does adding a solution move the ticket to 5 by itself?
Reset-Ticket -Id $TicketId -Status 2
Invoke-Api -Method Post -Uri "$base/claim" -Token $token | Out-Null
$before = Invoke-Db "SELECT status FROM glpi_tickets WHERE id=$TicketId;"
$l1 = Invoke-Api -Method Post -Uri "$base/solutions" -Token $token -Body @{ content = 'Comprobando efecto secundario automatico en GLPI' }
$afterL = Invoke-Db "SELECT status, solvedate IS NOT NULL AS solved FROM glpi_tickets WHERE id=$TicketId;"
Write-Host "`n### L. GLPI auto-transition on solution insert`n    POST status: $($l1.Status)`n    status before=$before after=$afterL"

# cleanup
Reset-Ticket -Id $TicketId -Status 1
Invoke-Db "DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=$TicketId; DELETE FROM glpi_tickets_users WHERE tickets_id=$TicketId; DELETE FROM glpi_groups_tickets WHERE tickets_id=$TicketId;" | Out-Null
Write-Host "`n== cleanup done for ticket $TicketId =="
