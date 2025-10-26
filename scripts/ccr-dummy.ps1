#!/usr/bin/env pwsh
# Minimal CCR dummy in PowerShell that simulates progress and writes a result file.

param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ArgsRest
)

function Find-TaskArg {
  param([string[]]$a)
  foreach ($x in $a) {
    if ($x -is [string] -and $x.ToLower().StartsWith('task file ')) {
      $p = $x.Substring(10).Trim().Trim('"')
      if ($p) { return $p }
    }
  }
  return $null
}

function Compute-ResultPath {
  param([string]$absTaskPath)
  $taskDir = [System.IO.Path]::GetDirectoryName($absTaskPath)
  $sep = [System.IO.Path]::DirectorySeparatorChar
  $parts = $taskDir -split [regex]::Escape($sep)
  $idx = [Array]::LastIndexOf($parts, 'tasks')
  if ($idx -eq -1) { throw "taskPath must be under a 'tasks' directory" }
  $parts[$idx] = 'result'
  $resultDir = $parts -join $sep
  $base = [System.IO.Path]::GetFileName($absTaskPath)
  return [System.IO.Path]::Combine($resultDir, $base)
}

try {
  $taskPath = Find-TaskArg -a $ArgsRest
  if (-not $taskPath) {
    Write-Error 'dummy: missing task file arg'
    exit 2
  }
  $absTaskPath = [System.IO.Path]::GetFullPath($taskPath)
  Write-Output 'dummy: start'
  foreach ($i in 1..5) {
    Start-Sleep -Milliseconds 500
    Write-Output "dummy: tick $i"
  }
  $resultPath = Compute-ResultPath -absTaskPath $absTaskPath
  $dir = [System.IO.Path]::GetDirectoryName($resultPath)
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Set-Content -Path $resultPath -Value "dummy result for $absTaskPath`n"
  Write-Output "dummy: wrote result: $resultPath"
  Write-Error 'dummy: stderr sample'
} catch {
  Write-Error ("dummy: error " + $_.Exception.Message)
  exit 1
}


