# Marcin Podyma — portfolio

Portfolio z projektami, fotografią, korepetycjami i kreatorem kontaktowym. Panel zarządza treścią PL/EN, zdjęciami, opiniami i wiadomościami.

## Uruchomienie lokalne

Wymagany Node.js 24+. Lokalny serwer używa wbudowanego SQLite i nie wymaga instalowania pakietów npm.

```sh
npm start
```

Windows z lokalnym Node w `.local/`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-gallery.ps1
```

Strona: http://127.0.0.1:3000/ · Panel: http://127.0.0.1:3000/admin

Zatrzymanie serwera uruchomionego w oknie: Ctrl+C. Serwer nasłuchuje wyłącznie lokalnie. Osobny podgląd `.local/lan-preview.cjs` wymaga aktualnego adresu Wi-Fi i nie udostępnia administracji.

## Adresy lokalne

| Widok | Adres |
| --- | --- |
| Start | `/` |
| O mnie | `/o-mnie` |
| Projekty | `/projekty` |
| Korepetycje | `/korepetycje` |
| Po godzinach | `/po-godzinach` |
| Kontakt | `/kontakt` |
| Swoją Drogą | `/projekty/swoja-droga` |
| AI KrakHack | `/projekty/krakhack` |
| Album | `/album/IDENTYFIKATOR_ZDJECIA` |

Dawne adresy HTML przekierowują na nowe. Pliki źródłowe zachowują nazwy. Na innym hostingu obsługę nowych adresów trzeba skonfigurować osobno.

## Funkcje

- Edycja sekcji podstron, szkice i porównanie z opublikowaną treścią.
- Projekty i osiągnięcia z osobnymi opisami realizacji.
- Galeria z filtrami, albumami, okładkami, kadrem miniatur i udostępnianiem. Podgląd zachowuje proporcje zdjęć; na telefonie zdjęcia zmienia się przyciskami.
- Oferta korepetycji, promocje, opinie z oceną i FAQ.
- Kreator kontaktu dopasowany do tematu. Prywatna skrzynka ze statusami spraw, notatkami, spamem i koszem.
- Kopie ręczne oraz automatyczne przed wybranymi większymi zmianami; pięć najnowszych kopii automatycznych.
- Kontrola treści przed publikacją.
- Opcjonalne Spotify: bieżący utwór i najczęściej słuchane utwory, bez odtwarzania muzyki.

## Struktura

| Folder | Przeznaczenie |
| --- | --- |
| `pages/` | Źródła podstron HTML |
| `server/`, `server.cjs` | Moduły backendu i plik uruchamiający |
| `assets/` | Style, skrypty, zdjęcia i publiczne eksporty |
| `components/`, `shared/` | Wspólne elementy, walidacja i treści domyślne |
| `scripts/`, `tests/` | Uruchamianie i kontrole |
| `docs/` | Instrukcje |
| `sites/` | Źródła backendu online |
| `data/`, `backups/` | Prywatne dane i kopie bezpieczeństwa |
| `outputs/checklista-portfolio/` | Gotowa checklista XLSX |
| `outputs/previews/` | Zrzuty wcześniejszych podglądów |
| `work/checklist/` | Źródła generatora checklisty |
| `.local/` | Lokalny Node, logi i narzędzia robocze |
| `docs/POMYSLY.md` | Pomysły na rozwój |

[Mapa folderów](docs/FOLDERY.md).

[Zasady wyglądu](docs/DESIGN.md).

## Panel i dane

Panel wymaga logowania. Pierwsze uruchomienie bez konta pozwala je utworzyć. Operacje zapisu wymagają sesji administratora i sprawdzenia pochodzenia żądania.

Lokalna baza: `data/gallery.sqlite`. Dane, hasła, tokeny Spotify, `.env` i kopie bezpieczeństwa są prywatne i ignorowane przez Git. Publiczne eksporty `gallery-data.js`, `projects-data.js`, `home-data.js`, `pages-data.js` oraz zdjęcia są przeznaczone do publikacji.

- [Dane, galeria i kopie](docs/LOCAL-GALLERY.md)
- [Wiadomości i konfiguracja poczty](docs/CONTACT-MESSAGES.md)

## Sprawdzanie

```sh
npm run check
node --test --test-concurrency=1 tests/*.test.cjs
```

Kontrole sprawdzają składnię, zasoby i działanie backendu na odizolowanych danych. Nie zastępują sprawdzenia wyglądu na rzeczywistym telefonie.

## Wersja online

```sh
npm run sites:prepare
```

Przygotowanie plików i wysłanie kodu do GitHuba nie publikuje strony. Sites ma osobny backend i bazę; lokalne treści nie synchronizują się automatycznie. Budowanie online wymaga osobnych zależności. Zależności usunięte ze starych kopii roboczych można w razie potrzeby zainstalować ponownie.

[Instrukcja wersji online](docs/SITES.md).

## GitHub Pages

Publiczna wersja statyczna jest przygotowywana przez GitHub Actions z gałęzi main. W ustawieniach Pages wybierz Source: GitHub Actions. Panel i backend pozostają lokalnie; kreator kontaktu otwiera szkic w programie pocztowym.

[Instrukcja uruchomienia GitHub Pages](docs/GITHUB-PAGES.md).
