# 🎨 Wygląd portfolio

[← Dokumentacja](README.md) · [Design w praktyce](design/README.md)

> Kierunek wizualny i zasady kolejnych zmian. Źródłem konkretnych wartości są arkusze w `assets/css/`.

## ✨ Charakter

Niebieskie portfolio łączące programowanie, fotografię i matematykę.

- **Jasny motyw** — chłodna, prawie biała baza z błękitno-lawendową poświatą, białe karty i gradient na nazwisku.
- **Ciemny motyw** — granat z cyjanową poświatą.

Szklane panele, zaokrąglenia i subtelne animacje mają wspierać treść, a nie z nią konkurować.

## 🎨 Kolory

Podstawowe zmienne z `assets/css/portfolio.css`:

| Zmienna | Jasny motyw | Ciemny motyw |
| --- | --- | --- |
| `--bg` | `#eef4fc` | `#091526` |
| `--panel` | `#e1effc` | `#10243e` |
| `--text` | `#0b1a33` | `#e2efff` |
| `--muted` | `#4a5d78` | `#98aec8` |
| `--line` | `#d3e0f0` | `#233d5b` |
| `--accent` | `#1d5fe0` | `#7bb5ff` |
| `--card` | `#f5faff` | `#102039` |

> [!TIP]
> Używaj zmiennych zamiast wpisywać osobne kolory dla kolejnych sekcji. Niebieskie akcenty zostają niebieskie również w jasnym motywie.

- Wartości jasnego motywu nadpisuje blok „Jasny motyw” w `portfolio.css`.
- W ciemnym motywie karty z ilustracjami mają ten sam układ, ale kolor projektu jest przyciemniony: ten sam odcień, nasycenie ×0,9, jasność ×0,3 (`hsl(from …)`).
- Ilustracje projektów mają własne pastelowe tła i ciemne podpisy.

### Ilustracje

| Krok | Polecenie |
| --- | --- |
| Dekoracje tła (plamy, pierścień, kropki) — można uruchamiać wielokrotnie | `node scripts/decorate-illustrations.cjs` |
| Ciemne warianty `*-dark.svg` — po każdej zmianie ilustracji | `node scripts/make-dark-illustrations.cjs` |

W ciemnym motywie plamy są ciemnym pastelem jaśniejszym od tła, a kropki i pierścień stonowanym jasnym pastelem. Przełączanie wariantu przy zmianie motywu obsługuje `window.portfolioThemedImage` w `theme.js`.

## 🔤 Typografia

| Rola | Font | Zmienna |
| --- | --- | --- |
| Nagłówki | Bricolage Grotesque | `--font-display` |
| Tekst | Plus Jakarta Sans | `--font-body` |

- Fonty są lokalne (WOFF2), z polskimi znakami i `font-display: swap`.
- Długie tytuły zawijają się naturalnie — nie rozbijaj nazw w środku słowa, jeśli można zmniejszyć tekst lub zmienić układ.
- Układ musi pomieścić zarówno polskie, jak i angielskie teksty.

## 🧱 Panele, karty i przyciski

- Promienie: karta **22 px**, panel **24 px**, kapsułki w pełni zaokrąglone.
- Wspólne kontrolki są w `assets/css/controls.css`; rozmiary i układ należą do stylów podstron.
- Stany aktywny, hover i fokus muszą być rozpoznawalne w obu motywach. Obsługa nie może zależeć wyłącznie od myszy.
- Kafelki projektów zostawiają miejsce na rok, symbol, ilustrację i podpis. W sąsiednich kartach wyrównuj ilustracje i nagłówki; sprawdzaj tytuły jedno- i dwuwierszowe.

> [!WARNING]
> Nie dodawaj kolejnych końcowych nadpisań CSS dla każdej drobnej korekty. Przy większej zmianie połącz reguły komponentu i usuń nieaktualne wyjątki.

## 📸 Fotografia

- **Kadr** — miniatury mogą mieć kadr ustawiony w panelu. Podgląd otwiera zdjęcie w kwadracie wykadrowanym tym samym punktem; kliknięcie (lub <kbd>Enter</kbd>/<kbd>Spacja</kbd>) pokazuje całe zdjęcie bez rozciągania. Podpowiedź w rogu mówi, co pokaże kliknięcie.
- **Poświata** — kolor wyliczany z fotografii w panelu (`glowColor`). Ramka zdjęcia nie może mieć `overflow: hidden`, bo przycięłaby poświatę.
- **Telefon** — podgląd jest kartą z zamknięciem i przyciskami zmiany zdjęcia. Kolejne zdjęcie pojawia się dopiero po załadowaniu, bez czarnego ekranu.
- **Informacje** — tytuł, opis i przyciski nie zasłaniają fotografii. Metryczka to zwarta siatka (ikona, podpis, wartość), opis jest cytatem z akcentem w kolorze poświaty, a „więcej zdjęć z wydarzenia” to główna akcja.
- **Jakość** — podgląd ładuje pełną rozdzielczość, chyba że miniatura wystarcza dla gęstości ekranu albo włączono oszczędzanie danych.
- Nie sugeruj obróbki ani historii zdjęcia, których autor nie potwierdził.

## 🌀 Ruch i wydajność

- Dekoracje są związane z treścią: matematyka przy korepetycjach, krajobraz w hobby, winyl przy Spotify.
- Animuj `transform` i `opacity`. Unikaj ciężkich filtrów, dużych rozmyć i animowania wymiarów na telefonie.
- Animacje uwzględniają `prefers-reduced-motion` i zatrzymują się poza ekranem, gdy to możliwe.
- Panel administratora używa spokojnych, statycznych kontrolek.
- Winyl obraca się podczas słuchania; okładka Spotify jest osobno i się nie obraca. Przy zmianach integracji sprawdź aktualne wytyczne Spotify.

## 📱 Telefon i dostępność

- Na wąskim ekranie projekty w jednej kolumnie — nie zmniejszaj kart, żeby zachować układ komputerowy.
- Animacje, menu i formularze nie mogą wychodzić poza ekran.
- Cele dotykowe co najmniej **44 × 44 px**, widoczny fokus, czytelne podpisy.
- Link „Przejdź do treści” na każdej podstronie; tekst zgodny z kontrastem WCAG AA.
- Semantyczne przyciski i odnośniki, <kbd>Esc</kbd> w dialogach i powrót fokusu po zamknięciu.
- Sprawdzaj obie orientacje, oba motywy, oba języki i długie treści. Testy automatyczne nie zastępują oceny na telefonie.

## 🛠️ Gdzie zmieniać wygląd

| Miejsce | Zakres |
| --- | --- |
| `pages/` | Struktura podstron |
| `components/navbar.html` | Wspólne menu |
| `assets/css/portfolio.css` | Zmienne, typografia i wspólny układ |
| `assets/css/controls.css` | Wygląd kontrolek |
| Pozostałe `assets/css/` | Konkretne podstrony i komponenty |
| `assets/js/` | Interakcje, animacje i renderowanie treści |

> [!IMPORTANT]
> Po zmianie uruchom `npm run check` i sprawdź komponent na komputerze oraz telefonie. Eksport Pages generuje się ze źródeł — nie poprawiaj ręcznie `dist/github-pages/`.
