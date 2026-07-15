#Requires -Version 5.1
<#
.SYNOPSIS
  Ustawia stronę startową Board w profilu Chrome bieżącego użytkownika.

.DESCRIPTION
  Modyfikuje plik Preferences w profilu Chrome (Default lub wskazany).
  Po uruchomieniu Chrome otworzy stronę startową urzędu.

.PARAMETER HomepageUrl
  Adres strony Board.

.PARAMETER ProfileName
  Nazwa folderu profilu Chrome (domyślnie: Default).

.EXAMPLE
  .\Set-ChromeHomepage.ps1 -HomepageUrl "http://192.168.1.50:3000"
#>
param(
  [Parameter(Mandatory)]
  [ValidatePattern('^https?://')]
  [string]$HomepageUrl,

  [string]$ProfileName = "Default"
)

$ErrorActionPreference = "Stop"

$localStatePath = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data\Local State"
$userDataRoot = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data"
$profileDir = Join-Path $userDataRoot $ProfileName
$prefsPath = Join-Path $profileDir "Preferences"

if (-not (Test-Path $prefsPath)) {
  throw "Nie znaleziono profilu Chrome: $prefsPath`nUruchom Chrome raz, aby utworzyć profil."
}

$prefs = Get-Content $prefsPath -Raw -Encoding UTF8 | ConvertFrom-Json

if (-not $prefs.PSObject.Properties["session"]) {
  $prefs | Add-Member -NotePropertyName "session" -NotePropertyValue ([pscustomobject]@{})
}
$prefs.session.restore_on_startup = 4
$prefs.session.startup_urls = @($HomepageUrl)

if (-not $prefs.PSObject.Properties["homepage"]) {
  $prefs | Add-Member -NotePropertyName "homepage" -NotePropertyValue $HomepageUrl
} else {
  $prefs.homepage = $HomepageUrl
}

if (-not $prefs.PSObject.Properties["homepage_is_newtabpage"]) {
  $prefs | Add-Member -NotePropertyName "homepage_is_newtabpage" -NotePropertyValue $false
} else {
  $prefs.homepage_is_newtabpage = $false
}

$json = $prefs | ConvertTo-Json -Depth 20 -Compress:$false
Set-Content -Path $prefsPath -Value $json -Encoding UTF8

Write-Host "Ustawiono stronę startową w profilu Chrome: $ProfileName"
Write-Host "URL: $HomepageUrl"
Write-Host ""
Write-Host "Zamknij Chrome całkowicie i uruchom ponownie."
