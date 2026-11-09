# 🗂️ Mapa folderów

[← Dokumentacja](README.md)

> Co znajduje się w projekcie i czego nie wolno ruszać.

## Struktura

| Folder | Zawartość | Uwagi |
| --- | --- | --- |
| `/` | Plik uruchamiający serwer, README, konfiguracje | |
| `pages/` | Źródła podstron HTML | |
| `server/` | Moduły backendu | |
| `assets/` | Style, skrypty, publiczne zdjęcia | Wszystko tutaj jest publiczne |
| `components/`, `shared/` | Wspólne elementy i obsługa treści | m.in. `footer.html`, `contact-fab.html` |
| `scripts/`, `tests/` | Narzędzia projektu i testy | |
| `docs/` | Dokumentacja i zrzuty do README | |
| `data/` | Prywatna baza i połączenie Spotify | ⚠️ Nie usuwać i nie publikować |
| `backups/` | Kopie bezpieczeństwa danych i zdjęć | Zachowywane podczas porządków |
| `outputs/checklista-portfolio/` | Gotowa checklista XLSX | |
| `outputs/previews/` | Zrzuty wcześniejszych podglądów | |
| `work/checklist/` | Źródła generatora checklisty | Zależności usunięte — przed generowaniem trzeba je odtworzyć |
| `.local/` | Lokalny Node, podgląd LAN, logi | Poza stroną i repozytorium |

Opisy poszczególnych obszarów są w `docs/podstrony/`, `docs/design/`, `docs/funkcje/` i `docs/techniczne/` — zobacz [spis dokumentacji](README.md).

## 🧹 Historia porządków

| Data | Zmiana |
| --- | --- |
| 27.10.2026 | Usunięto odtwarzalne zależności robocze, stare archiwa publikacyjne i ZIP z rozpakowanym Node. Zachowano historię Git, źródła, zdjęcia, dane, kopie i dokumenty. |
| 6.11.2026 | Usunięto lokalny katalog Sites i jego narzędzia. Wspólne fragmenty trafiły do `components/`. |
