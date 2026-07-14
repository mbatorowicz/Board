#Requires -Version 5.1
<#
.SYNOPSIS
  Ustawia stronę startową Board we wszystkich profilach Firefox bieżącego użytkownika.

.DESCRIPTION
  Zapisuje user.js w każdym profilu z katalogu %APPDATA%\Mozilla\Firefox\Profiles.
  Po uruchomieniu Firefox z danego profilu otworzy stronę startową urzędu.

.PARAMETER HomepageUrl
  Adres strony Board, np. http://192.168.1.50:3000 lub http://start.urzad.local

.PARAMETER ProfilePath
  Opcjonalnie — tylko jeden profil (pełna ścieżka do folderu profilu).

.EXAMPLE
  .\Set-FirefoxHomepage.ps1 -HomepageUrl "http://192.168.1.50:3000"
#>
param(
  [Parameter(Mandatory)]
  [ValidatePattern('^https?://')]
  [string]$HomepageUrl,

  [string]$ProfilePath
)

$ErrorActionPreference = "Stop"

$userJsLines = @(
  '// Strona startowa urzędu — wygenerowane przez Board/deploy/profiles/Set-FirefoxHomepage.ps1'
  'user_pref("browser.startup.page", 1);'
  'user_pref("browser.startup.homepage", "{0}");' -f $HomepageUrl
  'user_pref("browser.startup.homepage_override_once", false);'
  'user_pref("browser.newtabpage.enabled", false);'
  'user_pref("browser.newtab.preload", false);'
)

function Set-UserJs {
  param([string]$Dir)

  $userJs = Join-Path $Dir "user.js"
  $marker = "// Strona startowa urzędu"

  if (Test-Path $userJs) {
    $existing = Get-Content $userJs -Raw -Encoding UTF8
    if ($existing -match [regex]::Escape($marker)) {
      $existing = ($existing -split [regex]::Escape($marker))[0].TrimEnd()
    }
    $content = ($existing, ($userJsLines -join "`n")) -join "`n`n"
  } else {
    $content = $userJsLines -join "`n"
  }

  Set-Content -Path $userJs -Value $content -Encoding UTF8 -NoNewline
  Write-Host "  OK: $userJs"
}

function Get-FirefoxProfileDirs {
  if ($ProfilePath) {
    if (-not (Test-Path $ProfilePath)) {
      throw "Nie znaleziono profilu: $ProfilePath"
    }
    return @((Resolve-Path $ProfilePath).Path)
  }

  $profilesRoot = Join-Path $env:APPDATA "Mozilla\Firefox\Profiles"
  if (-not (Test-Path $profilesRoot)) {
    throw "Firefox nie jest zainstalowany lub brak profili w: $profilesRoot"
  }

  return @(Get-ChildItem $profilesRoot -Directory | ForEach-Object { $_.FullName })
}

$dirs = Get-FirefoxProfileDirs
if ($dirs.Count -eq 0) {
  throw "Nie znaleziono profili Firefox."
}

Write-Host "Ustawiam stronę startową: $HomepageUrl"
Write-Host "Profile Firefox ($($dirs.Count)):"

foreach ($dir in $dirs) {
  Write-Host " - $dir"
  Set-UserJs -Dir $dir
}

Write-Host ""
Write-Host "Gotowe. Zamknij Firefox i uruchom ponownie wybrany profil."
