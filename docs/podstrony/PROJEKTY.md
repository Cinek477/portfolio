# 📄 Projekty i osiągnięcia

[← Dokumentacja](../README.md) · [Spis podstron](README.md) · [Zarządzanie realizacjami](../funkcje/PROJEKTY.md)

## Adres i zawartość

`/projekty`, źródło `pages/projects.html`. Zawiera wstęp, ilustrację projektową,
osiągnięcia, aktualne projekty oraz treści o doświadczeniu i pracach w toku.
Rekordy mają sekcję `achievements` albo `projects`; to nie dwa osobne typy bazy.

## Karta realizacji

Wyświetla rok, symbol, tytuł i krótki opis. Może mieć zdjęcie lub przypisaną ilustrację.
Po rozwinięciu pokazuje pełny opis, technologie i dostępne odnośniki.
„Poznaj projekt” pojawia się dla włączonej podstrony realizacji.
Link repozytorium i link demo są niezależne; nie są udostępniane, jeśli brak poprawnego adresu.
Mysz może otwierać stan hover, ale obsługa dotykiem i klawiaturą korzysta z przycisku szczegółów.
Rozwinięte karty są zapamiętywane w historii przeglądarki.

## Dwa miejsca edycji

- **Podstrony → Projekty**: nagłówki, opisy sekcji, linki i widoczność grup treści. Zapis przez szkic i publikację.
- **Bazy danych → Projekty / Osiągnięcia**: konkretne rekordy, ilustracje, rok, widoczność i opisy realizacji.
  Zapis rekordów aktualizuje dane publiczne od razu lokalnie.

Zmiana tekstu nad listą nie zmienia jej rekordów. Zmiana rekordu wpływa również na Start,
jeśli jest wyróżniony, i na jego szczegółową podstronę.

## Pliki i API

`projects.js`: renderowanie kart i zachowanie rozwinięcia; `project-intro.js`: animacja ilustracji.
`content-editor.js`: treści sekcji. API: `/api/projects`, `/api/pages/projects` oraz szkice `projects`.
Eksporty: `projects-data.js`, `pages-data.js`. Podstawowe style kart: `portfolio.css`; ilustracja: `project-intro.css`.

## Ograniczenia i kontrola

Lista publiczna pomija ukryte rekordy. Brak widocznych rekordów daje komunikat pustej listy.
Domyślne ilustracje są przypisane konkretnym identyfikatorom; nowy rekord nie otrzyma automatycznie dowolnej ilustracji.
Sprawdź długie tytuły, rozwijanie dotykiem, dostępność fokusu, poprawność linków i ukrywanie realizacji.
