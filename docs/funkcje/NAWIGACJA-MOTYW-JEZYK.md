# ⚙️ Nawigacja, motyw, język i zachowania wspólne

[← Dokumentacja](../README.md) · [Spis funkcji](README.md) · [Design](../design/README.md)

## 1. Wspólne menu i stopka

`components/navbar.html`, `footer.html` i `contact-fab.html` są składane przez `shared/render-page.cjs`.
Publiczne menu oznacza bieżący odnośnik. Opis projektu zaznacza dział Projekty, a 404 nie zaznacza żadnej pozycji.
Na telefonie logo/przycisk menu rozwija nawigację; Escape, kliknięcie poza menu lub wybór odnośnika ją zamyka.
Przy przejściu do szerokiego układu menu jest resetowane.
Stopka ma odnośniki społecznościowe, znak marki i informację o prawach autorskich.
Wygląd nieaktywnego odnośnika nie oznacza gotowej integracji z danym serwisem.

## 2. Nawigacja bez pełnego przeładowania

Router przechwytuje zwykłe kliknięcia w obsługiwane publiczne adresy tego samego pochodzenia.
Nie przechwytuje pobierania plików, linków zewnętrznych, panelu, otwierania w nowej karcie ani kliknięć z klawiszami modyfikującymi.
Pobiera HTML, przygotowuje style i skrypty, wymienia treść oraz aktualizuje tytuł, menu i historię.
Przy błędzie próbuje zwykłej nawigacji przeglądarki.
Powolne żądanie API modułu nie powinno blokować zakończenia przejścia podstrony.

Każda podstrona otrzymuje zakres życia z sygnałem anulowania i funkcjami sprzątającymi.
Po wyjściu należy przerwać żądania i globalne nasłuchy oraz wyłączyć obserwatory, timery i animacje.
To wymaganie dla nowych modułów, nie funkcja edytowalna w panelu.

## 3. Historia, kotwice i pozycja przewijania

Wstecz/Dalej przywraca zapisany widok i pozycję. Podczas przewijania historia jest aktualizowana
co najwyżej raz na 150 ms; wyjście i nawigacja zapisują pozycję od razu.
Przy ponownym załadowaniu router próbuje odtworzyć pozycję przez krótki czas zmian układu.
Dotknięcie, kółko, klawisz lub inne wejście użytkownika kończy automatyczne odtwarzanie.
Odnośnik z kotwicą wybiera wskazany element zamiast wymuszać górę strony.
Po zmianie podstrony fokus trafia do `main` bez niepotrzebnego przewijania.

## 4. Zwijanie nawigacji

Pasek zmienia stan po przekroczeniu progów przewijania, a nie przebudowuje układu w każdej klatce.
Różne progi wejścia i wyjścia ograniczają drganie stanu na granicy.
Animacja desktopowa używa pomiarów przed/po zmianie i transformacji. Na telefonie i przy ograniczonym ruchu jest uproszczona.

## 5. Język PL/EN

Przełącznik zmienia `lang`, teksty, etykiety dostępności i tytuł strony.
Preferencja jest zapisywana jako `portfolio-language`; domyślnym językiem jest polski.
Brak dostępu do localStorage nie blokuje obsługi, ale preferencja może nie przetrwać odświeżenia.
Teksty wprowadzone przez autora nie są tłumaczone przez usługę AI — EN musi być podane lub odziedziczy PL zgodnie z modułem.
Panel administracyjny nie jest pełną angielską wersją aplikacji publicznej.

## 6. Motyw jasny/ciemny

`portfolio-theme` przechowuje wybór. Przy braku poprawnej preferencji używany jest motyw systemowy w chwili inicjalizacji.
Skrypt osadzony przez renderer ustawia kolory przed CSS, aby ograniczyć błysk niewłaściwego tła.
`theme.js` aktualizuje motyw, favicon i kolor paska przeglądarki oraz opcjonalnie animuje przejście.
Podczas innych aktywnych przejść kolejne kliknięcie może być pominięte, by nie nakładać animacji.
Nie należy zakładać automatycznego śledzenia każdej późniejszej zmiany motywu systemowego — kod inicjalizuje wybór przy uruchomieniu.

## 7. Ruch i neon

`prefers-reduced-motion` ogranicza animacje menu, przejść, ilustracji i zdjęć.
Neon przycisków korzysta z canvas, do 60 odrysowań/s i 48 segmentów. W jasnym motywie smuga jest niebieska (biała na wypełnionych niebieskich przyciskach i po najechaniu), w ciemnym cyjanowa.
Obejmuje główne i drugorzędne przyciski CTA, także CV, oferty i Instagram. Link do Spotify (`.music-link`) jest celowo bez smugi.
Po zmianie języka odtwarza warstwę smugi, zachowując informację o widoczności przycisku.
Zatrzymuje się przy ukrytej karcie, braku widocznych kontrolek, ograniczeniu ruchu lub otwartym podglądzie fotografii.
Wykres i ilustracja projektowa mają własne obserwatory widoczności.
Animacje dekoracyjne nie powinny być niezbędne do odczytania informacji lub wykonania akcji.

## 8. Metadane i cache

Lokalny backend generuje metadane udostępniania dla stron, realizacji i albumów.
`PUBLIC_SITE_URL` może ustalić publiczne pochodzenie linków. Wybrane SVG mają warianty PNG do udostępniania.
Nie jest to osobny edytor SEO w panelu. Eksport Pages nie uruchamia dynamicznego backendu metadanych.
Zasoby statyczne lokalnego serwera obsługują ETag i odpowiedź 304; prywatne API pozostaje `no-store`.

## 9. Pliki i kontrola

`router.js`, `portfolio.js`, `theme.js`, `neon.js`, `shared/render-page.cjs`,
`shared/pretty-routes.cjs`, `server/social-meta.cjs`, `server/static-assets.cjs`.
Sprawdź nowe karty, Ctrl+klik, CV, zewnętrzne linki, telefon, Wstecz/Dalej, odświeżenie w połowie strony,
oba motywy i języki, zablokowany magazyn preferencji oraz ograniczenie ruchu.
