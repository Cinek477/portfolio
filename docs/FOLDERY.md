# Co znajduje się w projekcie

- Główny katalog: plik uruchamiający serwer, README i konfiguracje.
- `pages/`: źródła podstron HTML.
- `server/`: moduły backendu.
- `assets/`: wspólne style, skrypty oraz publiczne zdjęcia.
- `components/`, `shared/`: wspólne elementy i obsługa treści.
- `scripts/`, `tests/`: narzędzia projektu i testy.
- `data/`: prywatna baza i połączenie Spotify. Nie usuwać ani publikować.
- `backups/`: kopie bezpieczeństwa danych i zdjęć. Zachowane podczas porządków.
- `outputs/checklista-portfolio/`: gotowa checklista XLSX.
- `outputs/previews/`: zachowane zrzuty wcześniejszych podglądów.
- `docs/`: instrukcje działania i publikacji.
- `work/checklist/`: źródła generatora checklisty. Zależności usunięto; przed ponownym generowaniem trzeba je odtworzyć.
- `.local/`: lokalny Node, podgląd LAN, logi i narzędzia robocze. Nie jest częścią strony ani repozytorium.
- `docs/POMYSLY.md`: lista pomysłów na rozwój.
- `docs/DESIGN.md`: zasady wyglądu i rozwijania interfejsu.

Porządki 27.10.2026: usunięto odtwarzalne zależności robocze, stare archiwa publikacyjne oraz ZIP z już rozpakowanym Node. Zachowano historię Git, wszystkie źródła, zdjęcia, dane, kopie bezpieczeństwa i dokumenty.

Aktualny spis dokumentacji: [docs/README.md](README.md). W katalogach `podstrony/`, `design/`, `funkcje/` i `techniczne/` znajdują się opisy poszczególnych obszarów.

Porządki 6.11.2026: lokalny katalog Sites i jego narzędzia usunięto. Nowe współdzielone fragmenty znajdują się w `components/footer.html` i `components/contact-fab.html`.
