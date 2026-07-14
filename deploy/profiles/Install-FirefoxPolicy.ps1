#Requires -Version 5.1
#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Instaluje politykę Firefox (policies.json) dla całej maszyny — wymaga uprawnień administratora.

.DESCRIPTION
  Kopiuje policies.json do katalogu distribution Firefox.
  Wszyscy użytkownicy tego komputera zobaczą stronę startową po uruchomieniu profilu.

.PARAMETER HomepageUrl
  Adres strony Board.

.EXAMPLE
  .\Install-FirefoxPolicy.ps1 -HomepageUrl "http://start.urzad.local"
#>
param(
  [Parameter(Mandatory)]
  [ValidatePattern('^https?://')]
  [string]$HomepageUrl
)

$ErrorActionPreference = "Stop"

$firefoxRoots = @(
  "${env:ProgramFiles}\Mozilla Firefox"
  "${env:ProgramFiles(x86)}\Mozilla Firefox"
) | Where-Object { Test-Path $_ }

if ($firefoxRoots.Count -eq 0) {
  throw "Nie znaleziono instalacji Firefox w Program Files."
}

$policy = @{
  policies = @{
    Homepage = @{
      URL      = $HomepageUrl
      Locked   = $true
      StartPage = "homepage"
    }
    DisableFirstRunPage = $true
  }
} | ConvertTo-Json -Depth 5

foreach ($root in $firefoxRoots) {
  $distDir = Join-Path $root "distribution"
  New-Item -ItemType Directory -Path $distDir -Force | Out-Null
  $dest = Join-Path $distDir "policies.json"
  Set-Content -Path $dest -Value $policy -Encoding UTF8
  Write-Host "Zapisano: $dest"
}

Write-Host ""
Write-Host "Gotowe. Firefox na tym komputerze otworzy $HomepageUrl przy starcie każdego profilu."
