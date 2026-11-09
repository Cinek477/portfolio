# ⚙️ Dodatkowe funkcje

[← Dokumentacja](../README.md)

To spis pełnych instrukcji działania, nie tylko skrót funkcji. Każdy rozdział obejmuje
obsługę, warianty, zapis, błędy, ograniczenia oraz powiązane pliki.

## Rozdziały szczegółowe

1. [Pełna edycja w adminie](ADMIN-FULL-EDIT.md) — zakres, formularze, listy, PL/EN, zdjęcia, podgląd, porównanie, szkic, publikacja i historia.
2. [Katalog wszystkich pól CMS](POLA-CMS.md) — identyfikatory, grupy, podpisy i opcje linków według schematu.
3. [Galeria i albumy](GALERIA-ALBUMY.md) — dodawanie, formaty, metadane, kadrowanie, widoczność, kolejność, operacje grupowe, podgląd i udostępnianie.
4. [Kreator kontaktu](KONTAKT-KREATOR.md) — tematy, pytania, oferty, podsumowanie, walidacja, ponowienia i Pages.
5. [Prywatna skrzynka](SKRZYNKA.md) — foldery, wyszukiwanie, statusy spraw, notatki, odpowiedzi, powiadomienia i usuwanie.
6. [Projekty i osiągnięcia](PROJEKTY.md) — pola, ilustracje, widoczność, opisy realizacji i wyróżnienia.
7. [Korepetycje i opinie](KOREPETYCJE-OPINIE.md) — pakiety, rabaty, FAQ, oceny, archiwum i wykresy.
8. [Kosz i kopie](KOPIE-KOSZ.md) — odzyskiwanie, trwałe usuwanie, kopie ręczne/automatyczne i przywracanie.
9. [Spotify](SPOTIFY.md) — konfiguracja, autoryzacja, stany widoku, cache, prywatność i odłączenie.
10. [Nawigacja, motyw i język](NAWIGACJA-MOTYW-JEZYK.md) — menu, router, historia, przewijanie, PL/EN, animacje i metadane.
11. [Kontrola i publikacja](PUBLIKACJA-KONTROLA.md) — preflight, zakres kontroli, eksport i różnica między zapisem a wdrożeniem.

## Najważniejsze rozróżnienia

- Zapis szkicu nie publikuje podstrony. Zapis rekordu galerii, projektu lub opinii działa od razu lokalnie.
- Publikacja lokalna nie wdraża strony na hosting.
- Ukryty rekord nie oznacza prywatnego pliku w `assets/`.
- Podgląd niezapisanych zmian nie jest zwykłym odnośnikiem do publicznej strony.
- Hobby i 404 nie mają pełnego edytora tekstów w adminie.
- Funkcje backendu lokalnego nie są automatycznie dostępne na statycznym GitHub Pages.

## Skrót orientacyjny

## Język i motyw

`portfolio.js` obsługuje PL/EN, menu i zwijanie nawigacji; `theme.js` przełącza motyw.
Preferencje są zapisywane w `localStorage`, ale brak dostępu do magazynu nie blokuje strony.
Treści używają par PL/EN oraz atrybutów `data-pl`, `data-en` i osobnych etykiet dostępności.

## Projekty i edycja treści

`projects.js` renderuje karty i zapamiętuje ich rozwinięcie w historii przeglądarki.
`project-detail.js` wyświetla opublikowane opisy realizacji i powiązane projekty.
Panel edytuje sekcje, kolejność i widoczność. Szkic pozostaje prywatny do publikacji;
historia przechowuje do dziesięciu poprzednich wersji danej podstrony.

## Galeria i albumy

`gallery.js` odpowiada za filtry, wybór zdjęcia, albumy i sterowanie dialogiem.
`lightbox.js` renderuje fotografię i informacje, a `photo-loader.js` zarządza ładowaniem.
Loader współdzieli trwające żądania, dekoduje obrazy asynchronicznie i przechowuje do trzech gotowych obrazów.
Zamknięcie przerywa ładowanie; rozmiar obrazu zależy od ekranu. Następny kadr jest pobierany z wyprzedzeniem,
chyba że przeglądarka sygnalizuje oszczędzanie danych. Tryb „Samo zdjęcie” ukrywa metadane.

Na komputerze trzy cykle miniaturek umożliwiają przewijanie w obie strony; to celowe powielenie widoku,
nie trzy osobne kopie danych. Telefon używa jednego cyklu i przycisków zmiany zdjęcia.

## Korepetycje

`tutoring-offers.js` nakłada promocje i FAQ, `tutoring-reviews.js` obsługuje opinie,
`tutoring.js` rysuje wykresy. Animacja zatrzymuje się poza ekranem i przy ograniczonym ruchu.
Ponowna identyczna odpowiedź ofert nie przebudowuje FAQ ani odznak.

## Kontakt i skrzynka

Kreator zbiera temat, szczegóły i adres odpowiedzi. Lokalnie zapisuje zapytanie przez API.
Powiadomienia e-mail są opcjonalne i nie zastępują zapisu w skrzynce.
Na Pages formularz otwiera szkic w programie pocztowym — nie wysyła wiadomości do lokalnego panelu.
Skrzynka ma statusy spraw, notatki, wyszukiwanie, spam i kosz.
Szczegóły: [wiadomości](../CONTACT-MESSAGES.md).

## Spotify

Integracja jest opcjonalna: ustawienia i tokeny pozostają w prywatnym `data/`.
Wyświetla metadane bieżącego utworu i listę najczęściej słuchanych, bez odtwarzania.
Zapytania są współdzielone i buforowane na backendzie. Widok odświeża dane co minutę,
gdy sekcja i karta są widoczne. Eksport Pages wyłącza funkcję na żywo.

## Kopie i bezpieczeństwo edycji

Panel ostrzega o niezapisanych zmianach i wymaga potwierdzenia trwałego usunięcia.
Kosz pozwala przywracać wpisy. Pliki zdjęć pozostają na dysku po usunięciu wpisu — nie usuwaj ich
automatycznie tylko dlatego, że nie występują w publicznym eksporcie.
Kopie zawierają bazę i zdjęcia; przywrócenie może także przywrócić wcześniejsze hasło.
Szczegóły: [panel i kopie](../LOCAL-GALLERY.md).
