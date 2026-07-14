Strona startowa przy uruchomieniu profilu przeglądarki
======================================================

Adres strony Board (np. http://192.168.1.50:3000) ustaw w skryptach poniżej.

Firefox — jeden profil użytkownika (bez uprawnień admina)
  powershell -ExecutionPolicy Bypass -File .\Set-FirefoxHomepage.ps1 -HomepageUrl "http://192.168.1.50:3000"

Firefox — cały komputer, wszystkie profile (admin, raz na PC)
  powershell -ExecutionPolicy Bypass -File .\Install-FirefoxPolicy.ps1 -HomepageUrl "http://192.168.1.50:3000"

Chrome — profil Default bieżącego użytkownika
  powershell -ExecutionPolicy Bypass -File .\Set-ChromeHomepage.ps1 -HomepageUrl "http://192.168.1.50:3000"

Autostart przy logowaniu do Windows (opcjonalnie, obok profilu przeglądarki)
  powershell -ExecutionPolicy Bypass -File .\Install-WindowsStartup.ps1 -HomepageUrl "http://192.168.1.50:3000" -Browser firefox

Po konfiguracji zamknij przeglądarkę i uruchom ponownie profil.
Identyfikacja komputera (device_id) działa automatycznie — linki zostają przypisane do tej stacji.

Przykładowe pliki polityk (GPO / ręczna instalacja): firefox\policies.json.example, chrome\policies.json.example
