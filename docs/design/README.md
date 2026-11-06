# Design

Nadrzędne zasady znajdują się w [DESIGN.md](../DESIGN.md). Porządki kodu nie są redesignem.

## Mapa stylów

| Plik | Odpowiedzialność |
| --- | --- |
| `portfolio.css` | Fonty, zmienne motywów, podstawowy układ, menu, start, projekty i korepetycje |
| `brand.css` | Wordmark i monogram marki |
| `controls.css` | Wspólne przyciski, fokus i dekoracja neonowa |
| `hobby.css`, `lightbox.css` | Hobby, Spotify, galeria i podgląd zdjęć |
| `contact.css`, `collaboration.css` | Kontakt i sekcje współpracy |
| `project-detail.css`, `project-intro.css` | Opisy projektów i ilustracja wprowadzająca |
| `admin.css` | Prywatny panel administracyjny |

Nagłówki używają Bricolage Grotesque, tekst Plus Jakarta Sans. Obie rodziny są lokalne.
Usunięto deklaracje i pliki nieużywanego fontu Outfit.

## Zasady zmian

1. Zmieniaj regułę komponentu, nie dopisuj bez końca kolejnych nadpisań.
2. Zachowaj istniejące zmienne kolorów, kontrast i kierunek wizualny.
3. Sprawdź polskie i angielskie teksty oraz jasny i ciemny motyw.
4. Sprawdź wąski ekran, długie tytuły, fokus klawiatury i powiększenie.
5. Pełne zdjęcia zachowują proporcje; kadr miniatury jest osobnym ustawieniem.
6. Ruch uwzględnia ograniczenie animacji i widoczność sekcji; panel pozostaje spokojny.

Skrypt motywu osadzany przez renderer działa przed stylami, żeby uniknąć jasnego błysku przy ciemnym motywie.
