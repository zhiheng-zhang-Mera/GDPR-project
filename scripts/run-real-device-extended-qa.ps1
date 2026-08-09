param(
  [Parameter(Mandatory = $true)][string]$Serial,
  [string]$Package = 'com.zhihengzhang.privacylens',
  [string]$Activity = '.MainActivity',
  [int]$RestartRounds = 10,
  [string]$ArtifactDir = (Join-Path $PSScriptRoot '..\testing-report\real-device-extended-latest')
)

$ErrorActionPreference = 'Stop'
$artifactRoot = [IO.Path]::GetFullPath($ArtifactDir)
New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null

function Invoke-Adb([string[]]$AdbArgs) {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $output = & adb -s $Serial @AdbArgs 2>&1
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousPreference
  if ($exitCode -ne 0) { throw "adb failed: $($AdbArgs -join ' ')`n$output" }
  return $output
}

$deviceState = (& adb -s $Serial get-state 2>&1).Trim()
if ($LASTEXITCODE -ne 0 -or $deviceState -ne 'device') { throw "Device $Serial is not ready: $deviceState" }

$resolved = (Invoke-Adb @('shell', 'cmd', 'package', 'resolve-activity', '--brief', $Package) | Select-Object -Last 1).Trim()
if (-not $resolved.Contains($Package)) { throw "Unable to resolve launcher activity for ${Package}: $resolved" }

$packageDump = Invoke-Adb @('shell', 'dumpsys', 'package', $Package)
$packageDump | Set-Content -LiteralPath (Join-Path $artifactRoot 'package.txt') -Encoding utf8
Invoke-Adb @('shell', 'logcat', '-c') | Out-Null

$rows = @()
for ($round = 1; $round -le $RestartRounds; $round += 1) {
  Invoke-Adb @('shell', 'am', 'force-stop', $Package) | Out-Null
  $startOutput = Invoke-Adb @('shell', 'am', 'start', '-W', '-n', "$Package/$Activity")
  $totalTime = [int](($startOutput | Select-String 'TotalTime:\s*(\d+)').Matches.Groups[1].Value)
  $waitTime = [int](($startOutput | Select-String 'WaitTime:\s*(\d+)').Matches.Groups[1].Value)
  Start-Sleep -Milliseconds 700
  $processId = (Invoke-Adb @('shell', 'pidof', '-s', $Package)).Trim()
  if (-not $processId) { throw "App process missing after restart round $round." }
  $meminfo = Invoke-Adb @('shell', 'dumpsys', 'meminfo', $Package)
  $pssLine = $meminfo | Select-String '^\s*TOTAL\s+(\d+)'
  if (-not $pssLine) { throw "TOTAL PSS missing after restart round $round." }
  $totalPssKb = [int]$pssLine.Matches.Groups[1].Value
  $rows += [pscustomobject]@{ round = $round; total_time_ms = $totalTime; wait_time_ms = $waitTime; total_pss_kb = $totalPssKb; pid = $processId }
}
$rows | Export-Csv -LiteralPath (Join-Path $artifactRoot 'restart-endurance.csv') -NoTypeInformation -Encoding utf8

Invoke-Adb @('shell', 'uiautomator', 'dump', '/sdcard/gdpr-extended-ui.xml') | Out-Null
Invoke-Adb @('pull', '/sdcard/gdpr-extended-ui.xml', (Join-Path $artifactRoot 'ui-after-restarts.xml')) | Out-Null
Invoke-Adb @('shell', 'screencap', '-p', '/sdcard/gdpr-extended-screen.png') | Out-Null
Invoke-Adb @('pull', '/sdcard/gdpr-extended-screen.png', (Join-Path $artifactRoot 'screen-after-restarts.png')) | Out-Null
Invoke-Adb @('shell', 'dumpsys', 'jobscheduler') | Set-Content -LiteralPath (Join-Path $artifactRoot 'jobscheduler.txt') -Encoding utf8
Invoke-Adb @('shell', 'cmd', 'appops', 'get', $Package) | Set-Content -LiteralPath (Join-Path $artifactRoot 'appops.txt') -Encoding utf8
$logcatOutput = Invoke-Adb @('shell', 'logcat', '-d')
$crashOutput = Invoke-Adb @('shell', 'logcat', '-b', 'crash', '-d')
if ($null -eq $logcatOutput) { $logcatOutput = '' }
if ($null -eq $crashOutput) { $crashOutput = '' }
Set-Content -LiteralPath (Join-Path $artifactRoot 'logcat.txt') -Value $logcatOutput -Encoding utf8
Set-Content -LiteralPath (Join-Path $artifactRoot 'crash-buffer.txt') -Value $crashOutput -Encoding utf8

$sortedStarts = @($rows.total_time_ms | Sort-Object)
$medianStart = $sortedStarts[[math]::Floor($sortedStarts.Count / 2)]
$meanStart = [math]::Round(($rows.total_time_ms | Measure-Object -Average).Average, 1)
$minPss = ($rows.total_pss_kb | Measure-Object -Minimum).Minimum
$maxPss = ($rows.total_pss_kb | Measure-Object -Maximum).Maximum
$crashText = Get-Content -Raw -LiteralPath (Join-Path $artifactRoot 'crash-buffer.txt')
$appCrash = $crashText -match [regex]::Escape($Package)

@"
# Extended real-device QA summary

- Device serial: $Serial
- Package: $Package
- Restart rounds: $RestartRounds
- Median / mean TotalTime: $medianStart ms / $meanStart ms
- Sampled TOTAL PSS range: $minPss-$maxPss KB
- Package-specific crash-buffer entry: $appCrash

This is a short restart/endurance check. It does not establish long-duration leak freedom, battery consumption, Doze timing, or legal compliance.
"@ | Set-Content -LiteralPath (Join-Path $artifactRoot 'SUMMARY.md') -Encoding utf8

Write-Output "Extended QA complete: $artifactRoot"
Write-Output "Median start: $medianStart ms; mean start: $meanStart ms; PSS range: $minPss-$maxPss KB; app crash: $appCrash"
