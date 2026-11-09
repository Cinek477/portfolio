# ⚙️ Kontrola treści i publikacja

[← Dokumentacja](../README.md) · [Spis funkcji](README.md) · [Pełna edycja](ADMIN-FULL-EDIT.md) · [GitHub Pages](../GITHUB-PAGES.md)

## 1. Trzy poziomy zapisu

1. **Zapis szkicu** zachowuje prywatną wersję podstrony.
2. **Publikacja szkicu / zapis rekordu bazy** aktualizuje lokalną publiczną treść i eksporty.
3. **Wdrożenie GitHub Pages** publikuje wygenerowaną statyczną wersję po osobnym wysłaniu kodu i uruchomieniu workflow.

Przycisk w panelu nie wykonuje automatycznie commita ani pusha. Obecnie nie ma lokalnego katalogu Sites ani jego narzędzi.
Usunięcie tego katalogu nie jest wyłączeniem zewnętrznej witryny.

## 2. Kontrola „Przed publikacją”

Po wejściu do zakładki lub kliknięciu „Sprawdź ponownie” aplikacja odczytuje zapisane publiczne treści i lokalne pliki.
Sprawdza m.in. brak tłumaczenia w parach PL/EN, brakujące lokalne obrazy i linkowane pliki,
puste adresy/podpisy przycisków i wskazane odnośniki CV.
Ukryte i nieaktywne elementy są w odpowiednich fragmentach kontroli pomijane.

Wyświetla liczbę sprawdzonych elementów, listę uwag i do 20 największych rozpoznanych obrazów.
Orientacyjne progi ostrzegania: 300 KB dla miniatur i 1500 KB dla pozostałych zdjęć.
To wskazówki do optymalizacji, nie limit zapisu zdjęć i nie pomiar faktycznego czasu ładowania.

## 3. Czego kontrola nie potwierdza

- Nie kontroluje bieżących niezapisanych formularzy ani prywatnych szkiców jako wersji do wdrożenia.
- Nie potwierdza dostępności zewnętrznych serwisów i poprawnego dostarczania poczty.
- Nie porównuje wyglądu na telefonie i komputerze.
- Nie zastępuje testów bezpieczeństwa, dostępności i wydajności w przeglądarce.
- Nie publikuje strony i nie blokuje automatycznie każdej publikacji z uwagami.

## 4. Eksport statyczny

`node scripts/prepare-pages.cjs` / `npm run pages:prepare` tworzy `dist/github-pages/`.
Eksporter składa wspólne fragmenty HTML, kopiuje publiczne zasoby, przygotowuje aliasy katalogowe,
opisy realizacji, albumy oraz migawki JSON w `static-api/`.
Prefiks adresów ustala `PAGES_BASE_PATH`; domyślnie `/portfolio/`.
Panel zastępuje komunikatem o lokalnej edycji, kontakt adaptuje do `mailto:`, Spotify na żywo wyłącza.

Nie kopiuje SQLite, `.env`, kodu serwera, kopii ani historii Git.
Filtruje niewidoczne/archiwalne rekordy z publicznych list, ale pliki obrazów obecne w `assets/` pozostają publiczne.
Nie przechowuj prywatnych zdjęć w tym katalogu w oczekiwaniu, że ukryta karta je zabezpieczy.

## 5. Zalecana kolejność pracy

1. Zapisz i opublikuj wybrane szkice; sprawdź bezpośrednio zapisane rekordy galerii, realizacji i opinii.
2. Uruchom kontrolę w panelu i przejrzyj uwagi.
3. Wykonaj kontrolę projektu i testy, następnie eksport.
4. Sprawdź statyczny podgląd z właściwym prefiksem, oba języki i kluczowe linki.
5. Przejrzyj zmiany Git, upewnij się, że nie ma prywatnych plików, i świadomie wykonaj commit/push.
6. Sprawdź wynik workflow publikacji. Nie utożsamiaj udanego lokalnego eksportu z udanym wdrożeniem.

## 6. Narzędzia i testy

`admin-dashboard.js`, `server/preflight.cjs`, `scripts/check-project.cjs`,
`scripts/prepare-pages.cjs`, `.github/workflows/github-pages.yml`.
Kontrola projektu sprawdza JS, odnośniki HTML, kotwice, zasoby CSS, eksportowane zdjęcia i odnośniki dokumentacji.
Testy Pages weryfikują kompletność eksportu, prefiksy i brak prywatnych plików.
