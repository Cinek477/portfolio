# Wydajność i weryfikacja

## Zastosowane usprawnienia

- Przejście między podstronami nie czeka na zakończenie żądań API inicjalizowanych modułów.
  Powolne API nie zatrzymuje animacji przejścia ani kolejnej nawigacji.
- Wspólne fragmenty HTML zamiast siedmiu kopii stopki i sześciu skrótów kontaktowych.
- Zapis pozycji przewijania w historii najwyżej raz na 150 ms podczas ruchu;
  wyjście i nawigacja nadal zapisują ją od razu.
- Tło „aurora”: plamy to gradienty radialne o profilu dawnego rozmycia, bez `filter: blur()` na dużej warstwie.
- Zdjęcie profilowe w WebP (640 i 1200 px) przez `srcset`; miniatury galerii ładują się leniwie.
- Każda podstrona ładuje tylko własne treści `pages-data-<strona>.js` zamiast pełnego `pages-data.js`.
- Neon: 60 odrysowań/s (także na ekranach 120–144 Hz) i 48 segmentów zamiast 96.
  Obserwator DOM przeszukuje stronę tylko po zmianach dotyczących przycisków. Dekoracja nie działa poza widokiem,
  przy ukrytej karcie, ograniczonym ruchu ani podczas oglądania zdjęć.
- Jeden pomiar geometrii każdej miniatury przy wybieraniu środkowego zdjęcia.
- Żądanie galerii przerywane wraz z cyklem życia podstrony.
- Pominięcie identycznych aktualizacji ofert, FAQ i kontrolki języka.
- Normalizacja zapytania wyszukiwania raz na filtrację; znormalizowane treści kart są buforowane w WeakMap.
- Zasoby lokalnego serwera mają ETag. Przeglądarka może dostać 304 zamiast ponownie pobierać plik.
  API i dynamiczny HTML zachowują swoje zasady prywatności i odświeżania.
- Usunięcie nieużywanego fontu Outfit, martwych zmiennych lightboxa i infrastruktury Sites.

To zmniejsza wykonywaną pracę, ale nie jest gwarancją płynności na każdym urządzeniu.
Nie podajemy wyniku FPS ani Lighthouse bez pomiaru w rzeczywistej przeglądarce.

## Kontrole automatyczne

```sh
node scripts/check-project.cjs
node --test --test-concurrency=1 tests/*.test.cjs
node scripts/prepare-pages.cjs
```

Odpowiedniki npm: `npm run check`, `npm test`, `npm run pages:prepare`.
Testy serwera potrzebują lokalnych połączeń HTTP i możliwości tworzenia oraz przenoszenia plików tymczasowych.
Każda instancja testowa używa oddzielnego katalogu, nie produkcyjnej bazy.
Jeżeli katalog systemowy jest ograniczony, ustaw `TEMP` i `TMP` na własny katalog roboczy przed testami.

## Kontrola ręczna

1. Przejdź przez wszystkie publiczne podstrony i wróć przyciskiem Wstecz; sprawdź pozycję przewijania.
2. Kilka razy zmień stronę, język i motyw; sprawdź, czy nie przybywa timerów i nasłuchów.
3. Przefiltruj galerię, otwórz album, zmieniaj zdjęcia szybko i zamknij w trakcie ładowania.
4. Sprawdź dotyk, wąski ekran, pion/poziom, Escape, fokus i ograniczenie ruchu.
5. W narzędziach przeglądarki nagraj przewijanie i zmiany podstron przy spowolnionym CPU.
6. Sprawdź eksport pod prefiksem repozytorium: zasoby, albumy, projekty i szkic wiadomości.

Nie oceniaj zacięć tylko po rozmiarze pliku: zwykle istotne są rozmiary dekodowanych zdjęć,
częstotliwość rysowania, odczyty układu oraz liczba przebudów DOM.
