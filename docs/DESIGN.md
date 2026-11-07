# Wygląd portfolio

Dokument opisuje obecny kierunek wizualny i zasady kolejnych zmian. Źródłem konkretnych wartości są arkusze w `assets/css/`.

## Charakter

Niebieskie portfolio łączące programowanie, fotografię i matematykę. Jasny motyw opiera się na chłodnej, prawie białej bazie z błękitno-lawendową poświatą, białych kartach i gradiencie na nazwisku; ciemny na granacie z cyjanową poświatą. Szklane panele, zaokrąglenia i subtelne animacje mają wspierać treść, a nie konkurować z nią.

## Kolory

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

Wartości jasnego motywu nadpisuje blok „Jasny motyw” w `portfolio.css`. W ciemnym motywie karty z ilustracjami mają ten sam układ co w jasnym, ale kolor projektu jest przyciemniony: ten sam odcień, nasycenie ×0,9, jasność ×0,3 (`hsl(from …)` w CSS). Ilustracje mają ciemne warianty `*-dark.svg` z tym samym tłem — po zmianie ilustracji uruchom `node scripts/make-dark-illustrations.cjs`. Dekoracje tła (miękkie plamy, pierścień, kropki w kolorach pochodnych od tła) dodaje `node scripts/decorate-illustrations.cjs` — skrypt podmienia poprzednią grupę dekoracji, więc można go uruchamiać wielokrotnie; potem wygeneruj ciemne warianty. W ciemnym motywie plamy są ciemnym pastelem jaśniejszym od tła, a kropki i pierścień stonowanym jasnym pastelem. Przełączanie wariantu przy zmianie motywu obsługuje `window.portfolioThemedImage` w `theme.js`.

Używaj zmiennych zamiast wpisywać osobne kolory dla kolejnych sekcji. Niebieskie akcenty pozostają niebieskie również w jasnym motywie. Ilustracje projektów mają własne pastelowe tła i ciemne podpisy.

## Typografia

- Nagłówki: Bricolage Grotesque, przez `--font-display`.
- Tekst: Plus Jakarta Sans, przez `--font-body`.
- Fonty są dostarczane lokalnie w WOFF2, z obsługą polskich znaków i `font-display: swap`.
- Długie tytuły muszą zawijać się naturalnie. Nie rozbijaj nazw w środku słowa, jeżeli można zmniejszyć tekst lub zmienić układ.
- Układ musi pomieścić zarówno polskie, jak i angielskie teksty.

## Panele, karty i przyciski

- Podstawowe promienie: karta 22 px, panel 24 px. Kapsułki mają pełne zaokrąglenie.
- Wspólne kontrolki znajdują się w `assets/css/controls.css`; rozmiary i układ należą do stylów podstron.
- Stan aktywny, hover i fokus powinny być rozpoznawalne w obu motywach. Obsługa nie może zależeć wyłącznie od najechania myszą.
- Kafelki projektów muszą zostawiać miejsce na rok, symbol, ilustrację i podpis. W sąsiednich kartach wyrównuj obszary ilustracji i nagłówków; sprawdzaj tytuły jedno- i dwuwierszowe.
- Nie dodawaj kolejnych końcowych nadpisań CSS dla każdej drobnej korekty. Przy większej zmianie połącz reguły komponentu i usuń nieaktualne wyjątki.

## Fotografia

- Miniatury mogą mieć kadr ustawiony w panelu. Podgląd otwiera zdjęcie w kwadracie wykadrowanym tym samym punktem; kliknięcie (lub Enter/Spacja) pokazuje całe zdjęcie w oryginalnych proporcjach, bez rozciągania. Podpowiedź w rogu mówi, co pokaże kliknięcie.
- Wokół zdjęcia w podglądzie jest poświata w kolorze wyliczonym z fotografii w panelu (`glowColor`). Ramka zdjęcia nie może mieć `overflow: hidden`, bo przycięłaby poświatę.
- Mobilny podgląd jest kartą z zamknięciem i przyciskami zmiany zdjęcia. Kolejne zdjęcie pojawia się dopiero po załadowaniu; nie zastępuj poprzedniego czarnym ekranem.
- Tytuł, opis i przyciski albumu nie powinny zasłaniać fotografii. Informacje w podglądzie to zwarta siatka (ikona, podpis, wartość), opis jest cytatem z akcentem w kolorze poświaty, a „więcej zdjęć z wydarzenia” jest główną akcją. Podgląd ładuje pełną rozdzielczość, chyba że miniatura wystarcza dla gęstości ekranu albo włączono oszczędzanie danych.
- Nie sugeruj obróbki ani historii zdjęcia, których autor nie potwierdził.

## Ruch i wydajność

- Dekoracje są związane z treścią: matematyka przy korepetycjach, krajobraz w hobby, winyl przy Spotify.
- Preferuj animowanie `transform` i `opacity`. Unikaj ciężkich filtrów, dużych rozmyć i animowania wymiarów na telefonie.
- Animacje uwzględniają `prefers-reduced-motion` i powinny zatrzymywać się poza ekranem, gdy jest to możliwe.
- Panel administratora używa spokojnych, statycznych kontrolek.
- Dekoracyjny winyl obraca się podczas aktywnego słuchania. Okładka Spotify pozostaje osobno i nie obraca się. Przy zmianach integracji trzeba ponownie sprawdzić aktualne wytyczne Spotify.

## Telefon i dostępność

- Projekty na wąskim ekranie układaj w jednej kolumnie. Nie zmniejszaj całych kart tylko po to, by zachować układ komputerowy.
- Kontroluj szerokość animacji, menu i formularzy; nie mogą wychodzić poza ekran.
- Podstawowe cele dotykowe projektuj na co najmniej 44 × 44 px. Zapewnij widoczny fokus i czytelne podpisy.
- Zachowuj semantyczne przyciski i odnośniki, obsługę Escape w dialogach oraz powrót fokusu po zamknięciu.
- Sprawdzaj obie orientacje ekranu, oba motywy, oba języki i długie treści. Testy automatyczne nie zastępują oceny wizualnej na telefonie.

## Gdzie zmieniać wygląd

| Miejsce | Zakres |
| --- | --- |
| `pages/` | Struktura podstron |
| `components/navbar.html` | Wspólne menu |
| `assets/css/portfolio.css` | Zmienne, typografia i wspólny układ |
| `assets/css/controls.css` | Wygląd kontrolek |
| Pozostałe pliki w `assets/css/` | Konkretne podstrony i komponenty |
| `assets/js/` | Interakcje, animacje i renderowanie treści |

Po zmianie wykonaj kontrolę projektu i sprawdź zmieniony komponent na komputerze oraz telefonie. Eksport Pages generuje się ze źródeł; nie poprawiaj ręcznie `dist/github-pages/`.
