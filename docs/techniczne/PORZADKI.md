# 🏗️ Porządki — 6 listopada 2026

[← Dokumentacja](../README.md)

## Usunięte i uproszczone

- Lokalny katalog `sites/`, jego konfiguracja, zależności, komponenty i wygenerowane pliki.
- Skrypty `prepare-sites.cjs`, `stage-sites.cjs`, `run-sites.cjs`, polecenia `sites:*` i nieaktualna instrukcja Sites.
- Nieużywane fonty Outfit wraz z deklaracjami CSS.
- Kopie stopki i skrótu kontaktowego w podstronach: zastępują je wspólne komponenty.
- Martwe zmienne lightboxa, powtórzone sprawdzenie otwartego dialogu i ponowne obliczanie warunku nagłówka.
- Powielone endpointy zapisu edytora kontaktu i projektów: wspólna obsługa bez zmiany adresów API.

## Celowo zachowane

- Prywatna baza, tokeny, lokalna konfiguracja i kopie zapasowe.
- Zdjęcia, w tym pliki możliwe do odzyskania z kosza lub szkiców.
- Publiczne eksporty i domyślne treści, potrzebne dla inicjalizacji i publikacji statycznej.
- Ilustracje i warianty obrazów dla metadanych społecznościowych, których nazwy są wyliczane w kodzie.
- Materiały robocze poza aktywną stroną, których przeznaczenia nie potwierdza sam brak linku w HTML.
- Historia głównego repozytorium Git. Dawny kod Sites można odzyskać z poprzednich commitów.

Usunięcie lokalnego katalogu Sites nie usuwa ani nie wyłącza opublikowanej witryny lub zewnętrznej bazy.
Nie wykonywano wdrożenia ani zmian na zewnętrznym hostingu.
