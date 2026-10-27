# Wygląd portfolio

Dokument opisuje obecny kierunek wizualny i zasady kolejnych zmian. Źródłem konkretnych wartości są arkusze w `assets/css/`.

## Charakter

Niebieskie portfolio łączące programowanie, fotografię i matematykę. Jasny motyw opiera się na błękitnych powierzchniach, ciemny na granacie. Szklane panele, zaokrąglenia i subtelne animacje mają wspierać treść, a nie konkurować z nią.

## Kolory

Podstawowe zmienne z `assets/css/portfolio.css`:

| Zmienna | Jasny motyw | Ciemny motyw |
| --- | --- | --- |
| `--bg` | `#edf6ff` | `#091526` |
| `--panel` | `#e1effc` | `#10243e` |
| `--text` | `#142e50` | `#e2efff` |
| `--muted` | `#56718d` | `#98aec8` |
| `--line` | `#c9ddef` | `#233d5b` |
| `--accent` | `#1769e8` | `#7bb5ff` |
| `--card` | `#f5faff` | `#102039` |

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

- Miniatury mogą mieć kadr ustawiony w panelu. Pełny podgląd zachowuje proporcje oryginału: poziom, pion lub kwadrat, bez rozciągania i przycinania.
- Mobilny podgląd jest kartą z zamknięciem i przyciskami zmiany zdjęcia. Kolejne zdjęcie pojawia się dopiero po załadowaniu; nie zastępuj poprzedniego czarnym ekranem.
- Tytuł, opis i przyciski albumu nie powinny zasłaniać fotografii.
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

Po zmianie wykonaj kontrolę projektu i sprawdź zmieniony komponent na komputerze oraz telefonie. Podgląd Sites generuje się ze źródeł; nie poprawiaj ręcznie `sites/public/`.
