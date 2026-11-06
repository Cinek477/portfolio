# Architektura i dane

## Stos

Publiczny interfejs to HTML, CSS i JavaScript bez frameworka i bez zależności npm.
`server.cjs` uruchamia lokalny serwer HTTP na `127.0.0.1`, używając SQLite z Node.js 24+.
Moduły `server/` obsługują skrzynkę, Spotify, kopie, kontrolę publikacji, metadane i zasoby statyczne.
`shared/` zawiera walidację, domyślne treści, renderer fragmentów HTML i aliasy adresów.

## Przepływ treści

1. Pierwsze uruchomienie importuje publiczne zdjęcia i projekty do prywatnej bazy.
2. Panel zapisuje zwalidowane zmiany w SQLite. Szkice mają osobne tabele.
3. Zmiany opublikowanych danych aktualizują publiczne pliki `*-data.js`.
4. Interfejs korzysta z eksportów jako danych początkowych i odświeża je przez API.
5. Eksporter Pages tworzy HTML i migawki `static-api/*.json` w `dist/github-pages/`.

Eksporty nie są zbędną duplikacją bazy: umożliwiają statyczną publikację i działanie bez lokalnego API.
Nie poprawiaj ich ręcznie, gdy źródłem prawdy jest lokalny panel.

## Publiczne i prywatne pliki

- Publiczne: `assets/`, w tym zdjęcia, CV i eksporty opublikowanych treści.
- Prywatne: `data/`, `backups/`, `.env`, sesje i tokeny. Nie trafiają do eksportu.
- Odtwarzalne: `dist/`, pobrane zależności, logi i cache.
- Robocze: `.local/`, `work/`, `output/`, `outputs/`; nie są źródłem publicznej strony.

Ukrycie wpisu nie oznacza prywatności pliku w `assets/`. Nie umieszczaj tam poufnych materiałów.

## Cykl życia podstrony

Router tworzy `window.portfolioPageScope` z `signal` i `cleanup(fn)`.
Po wyjściu przerywa sygnał i wykonuje funkcje sprzątające. Podpinaj do niego globalne nasłuchy,
żądania, obserwatory, animacje i timery. Nie przechowuj odłączonego DOM w globalnych zmiennych.
Nowe moduły rejestruj w `window.portfolioPages` i dołącz w HTML z `defer`.

## Zasady komentarzy

Opisuj odpowiedzialność modułu, powód ograniczenia i nietypowe zachowanie, zamiast komentować każdą instrukcję.
Nie usuwaj sprawdzeń autoryzacji, walidacji, potwierdzeń ani mechanizmów kompatybilności jako „zbędnych”.
Zmianę wspólnego renderera sprawdzaj zarówno lokalnie, jak i w eksporcie Pages.
