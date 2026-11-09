# 📄 Start

[← Dokumentacja](../README.md) · [Spis podstron](README.md) · [Pełna edycja w panelu](../funkcje/ADMIN-FULL-EDIT.md)

## Adres i przeznaczenie

Adres lokalny: `/`. Źródło: `pages/index.html`; dawny adres `index.html` przekierowuje na start.
Strona przedstawia autora i prowadzi do projektów, korepetycji, fotografii oraz informacji o doświadczeniu.

## Zawartość

- Powitanie, nagłówek z wyróżnioną częścią i opis autora.
- Portret z opisem alternatywnym, kapsułki opisujące zainteresowania i przyciski, w tym pobranie CV.
- „Teraz tworzę”: aktualna aktywność, osobny tytuł, opis i przełącznik widoczności.
- Wyróżnione realizacje: do trzech wybranych projektów lub osiągnięć.
- Ścieżki „Co Cię interesuje?” prowadzące do kolejnych podstron.
- Sekcja zachęcająca do otwarcia „O mnie”.
- Wspólne menu, stopka i pływający skrót do kontaktu.

## Działanie i interakcje

Karty korzystają z tych samych rekordów co lista projektów. Przycisk szczegółów rozwija opis,
a włączony opis realizacji udostępnia „Poznaj projekt”. Wyboru kafelków nie wykonuje się przez kopiowanie treści karty.
Przycisk z kotwicą przewija do sekcji; przycisk pobrania ma flagę `download`.
Zmiana języka aktualizuje teksty i opisy dostępności. Motyw i język są wspólne dla publicznej strony.

## Edycja w panelu

Wybierz **Podstrony → Start**. Możesz zmienić powitanie, tytuły, opis, zdjęcie i jego alt,
kapsułki, przyciski i ich kolejność, sekcję „Teraz tworzę”, wybór wyróżnionych realizacji oraz pozostałe teksty i linki.
Wyróżnione identyfikatory muszą być różne i wskazywać istniejące rekordy; ukryty projekt nie pojawi się publicznie.
Wygląd karty i samą realizację zmieniasz w bazie projektów, nie w polu wyboru wyróżnień.
Zmiany podstrony wymagają zapisu szkicu i osobnej publikacji.

## Dane i pliki

- `shared/home-defaults.json`, `shared/home.cjs`: ustawienia domyślne i walidacja Startu.
- `shared/page-defaults.json`: domyślna zawartość podstrony.
- `assets/js/page-content.js`, `projects.js`, `content-editor.js`: renderowanie.
- `assets/js/home-data.js`, `pages-data.js`, `projects-data.js`: publiczne eksporty.
- API: `GET /api/pages/home` oraz mechanizm `/api/page-drafts/home`.
- Style: `portfolio.css`, `controls.css`, `brand.css`.

## Ograniczenia i kontrola

Edytor treści nie zmienia automatycznie układu CSS ani samego pliku PDF z CV.
Sprawdź oba języki, portret, pobranie CV, przyciski, kolejność wyróżnień i powrót z projektu przyciskiem Wstecz.
Na Pages widoczna jest ostatnia opublikowana i wyeksportowana zawartość, nie prywatny szkic.
