#Requires -Version 5.1
<#
.SYNOPSIS
  Uruchamia stronę Board w domyślnej przeglądarce (skrót / autostart Windows).

.PARAMETER HomepageUrl
  Adres strony Board.

.PARAMETER Browser
  firefox | chrome | default

.EXAMPLE
  .\Start-Board.ps1 -HomepageUrl "http://192.168.1.50:3000" -Browser firefox
#>
param(
  [Parameter(Mandatory)]
  [ValidatePattern('^https?://')]
  [string]$HomepageUrl,

  [ValidateSet("firefox", "chrome", "default")]
  [string]$Browser = "default"
)

$ErrorActionPreference = "Stop"

switch ($Browser) {
  "firefox" {
    $firefox = @(
      "${env:ProgramFiles}\Mozilla Firefox\firefox.exe"
      "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if (-not $firefox) {
      throw "Nie znaleziono firefox.exe"
    }
    Start-Process $firefox -ArgumentList $HomepageUrl
  }
  "chrome" {
    $chrome = @(
      "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
      "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if (-not $chrome) {
      throw "Nie znaleziono chrome.exe"
    }
    Start-Process $chrome -ArgumentList $HomepageUrl
  }
  default {
    Start-Process $HomepageUrl
  }
}
