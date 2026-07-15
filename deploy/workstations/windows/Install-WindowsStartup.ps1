#Requires -Version 5.1
<#
.SYNOPSIS
  Dodaje skrót uruchamiający stronę Board przy logowaniu do Windows (Autostart użytkownika).

.PARAMETER HomepageUrl
  Adres strony Board.

.PARAMETER Browser
  firefox | chrome | default

.EXAMPLE
  .\Install-WindowsStartup.ps1 -HomepageUrl "http://192.168.1.50:3000" -Browser firefox
#>
param(
  [Parameter(Mandatory)]
  [ValidatePattern('^https?://')]
  [string]$HomepageUrl,

  [ValidateSet("firefox", "chrome", "default")]
  [string]$Browser = "default"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcher = Join-Path $scriptDir "Start-Board.ps1"
$startupFolder = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "Strona startowa urzędu.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`" -HomepageUrl `"$HomepageUrl`" -Browser $Browser"
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Otwiera stronę startową urzędu"
$shortcut.Save()

Write-Host "Utworzono skrót autostartu: $shortcutPath"
Write-Host "Strona otworzy się po następnym logowaniu użytkownika do Windows."
