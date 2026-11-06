# Kreator kontaktu

[Spis funkcji](README.md) · [Podstrona Kontakt](../podstrony/KONTAKT.md) · [Skrzynka](SKRZYNKA.md)

## 1. Wybór tematu

Pierwszy krok ma cztery stałe kategorie: Projekt IT, Fotografia, Korepetycje i Inne.
Własny wybierak obsługuje wyszukiwanie, kliknięcie, Escape i strzałki klawiatury.
Bez tematu nie można przejść dalej. Opcje są powiązane z identyfikatorami, nie z widocznym tłumaczeniem.

## 2. Zakres i pytania zależne od tematu

| Temat | Rodzaje zapytań | Pytania dodatkowe |
| --- | --- | --- |
| Projekt IT | Aplikacja webowa, Hackathon, Inny pomysł | Co stworzyć lub usprawnić; planowany termin |
| Fotografia | Koncert, Portret / Plener, Impreza / Event | Miejsce; termin |
| Korepetycje | Matematyka podstawowa, rozszerzona, akademicka, inny zakres | Temat nauki; jednorazowe lub regularne spotkania |
| Inne | Automatyczny zakres „Inne” | Czego dotyczy sprawa |

Zakres jest wymagany poza uproszczonym wariantem „Inne”. Odpowiedzi dodatkowe są opcjonalne;
tekstowe mają do 250 znaków. Częstotliwość spotkań ma też wariant „Do ustalenia”.
Odpowiedzi są przechowywane osobno dla tematów w pamięci otwartego formularza.
To nie zapis trwały — odświeżenie lub opuszczenie strony może je utracić.

## 3. Wejście z ofert i parametrów

Rozpoznawane parametry:
- `category`: `it`, `photo`, `tutoring`, `other`;
- `details`: identyfikator rodzaju zapytania;
- `package`: `start`, `single`, `regular`, `matura`, dla korepetycji;
- `collaboration`: `paid` lub `accreditation`, dla fotografii.

Przykład: `contact.html?category=tutoring&package=regular#contact-form`.
Poprawny temat otwiera od razu drugi krok. Oferta jest kontekstem zapytania, nie zakupem ani rezerwacją.
Nieprawidłowe wartości nie tworzą nowej opcji. Zmiana tematu na inny niż początkowy ukrywa kontekst wybranej oferty.

## 4. Podsumowanie i nawigacja

Trzeci krok buduje listę z tematem, ofertą, zakresem i niepustymi odpowiedziami.
Użytkownik może wrócić do wcześniejszego kroku i zmienić dane.
Przejście przenosi fokus do nagłówka; na telefonie nagłówek może zostać przewinięty do widoku.
Zmiana PL/EN odświeża etykiety, pytania i podsumowanie bez celowego kasowania odpowiedzi.

## 5. Wysyłka przez lokalny serwer

1. Użytkownik podaje e-mail i ewentualną dodatkową treść.
2. Formularz waliduje pola i składa wiadomość z podsumowania oraz dopisanego tekstu.
3. Nadaje identyfikator żądania i blokuje formularz na czas wysyłki.
4. `POST /api/contact` waliduje dane, zapisuje zgłoszenie i próbuje powiadomienia.
5. Po sukcesie pokazuje potwierdzenie z adresem odpowiedzi i blokuje ponowne wysłanie tego formularza.

Backend wymaga prawidłowego e-maila do 254 znaków, znanej kategorii i zakresu,
wiadomości o długości 10–5000 znaków oraz identyfikatora żądania.
Limit żądania wynosi 32 KB, a liczba nowych zgłoszeń z jednego adresu jest ograniczona do 5 na 15 minut.
Ponowienie z tym samym identyfikatorem nie tworzy kolejnego zgłoszenia.
Zmiana treści przygotowuje nowy identyfikator.

## 6. Błędy i powiadomienia

Po nieudanej wysyłce formularz jest odblokowywany, a odpowiedzi pozostają w bieżącej karcie.
Nie należy odświeżać strony, jeśli użytkownik chce zachować niewysłaną treść.
Błąd powiadomienia pocztowego nie usuwa wiadomości już zapisanej w SQLite.
Sukces formularza nie potwierdza dostarczenia e-maila ani odpowiedzi administratora.
Konfiguracja i ponawianie powiadomień są opisane w [skrzynce](SKRZYNKA.md).

## 7. Zachowanie na GitHub Pages

Eksporter zastępuje wysyłkę API otwarciem `mailto:` z tematem i treścią.
Użytkownik musi mieć klienta pocztowego, sprawdzić szkic i sam zatwierdzić wysyłkę.
Nie powstaje rekord w lokalnej skrzynce. Ograniczenia długości adresów `mailto:` zależą od środowiska pocztowego;
przy długiej treści lub braku klienta należy skorzystać z widocznego adresu e-mail.
Wysyłkę Pages należy testować osobno od lokalnego backendu.

## 8. Co edytuje administrator

**Podstrony → Kontakt** zmienia podpisy tematów, zakresów, pytań, opcji, ofert, nagłówków i przycisków oraz linki kontaktowe.
Dodanie piątego tematu, nowej logiki pytań lub innego sposobu wysyłki wymaga zmiany kodu i walidacji backendu.
Adres wyświetlany w CMS, odbiorca `CONTACT_MAIL_TO` i adres w adaptacji eksportera Pages są odrębnymi ustawieniami.
Przy zmianie e-maila sprawdź wszystkie te miejsca.

## 9. Pliki i testy

`assets/js/contact.js`, `assets/css/contact.css`, `server/inbox.cjs`,
`shared/page-defaults.json`, `scripts/prepare-pages.cjs`.
Testuj każdy temat, brak zakresu, błędny e-mail, przełączenie języka między krokami,
wejście z oferty, ponowienie po błędzie i komunikaty sukcesu w obu trybach hostingu.
