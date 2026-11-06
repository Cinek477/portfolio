# Kontakt

[Spis podstron](README.md) · [Kreator krok po kroku](../funkcje/KONTAKT-KREATOR.md) · [Skrzynka](../funkcje/SKRZYNKA.md)

## Adres i przeznaczenie

`/kontakt`, źródło `pages/contact.html`. Umożliwia kontakt bezpośredni oraz przygotowanie uporządkowanego zapytania.
Nie ma pływającego przycisku prowadzącego do samej siebie. Menu i stopka są wspólne z resztą portfolio.

## Zawartość i kroki

Strona ma nagłówki i opisy kontaktowe, link e-mail, GitHub i Instagram oraz kreator:
1. wybór tematu;
2. dopasowany zakres i pytania;
3. podsumowanie, e-mail do odpowiedzi i dodatkowa wiadomość.

Przejście z pakietu korepetycji lub oferty fotograficznej może od razu ustawić temat i otworzyć drugi krok.
Zmiana języka zachowuje bieżące odpowiedzi w otwartym kreatorze.

## Edycja w panelu

**Podstrony → Kontakt** udostępnia teksty PL/EN, przyciski, dane kontaktowe, nazwy tematów,
rodzajów zapytań, pytań dodatkowych, ofert i częstotliwości spotkań.
Struktura kategorii i logika pytań są ustalone w kodzie. Samo przemianowanie tematu nie dodaje nowego procesu.
Przełączanie widoczności całych grup kontaktu jest w formularzu ukryte; grupy pozostają włączone.
Zmiana adresu kontaktowego w CMS nie zmienia automatycznie odbiorcy powiadomień serwera ani adresu `mailto:` w eksporterze Pages.

## Wysyłka lokalna a Pages

Lokalnie `/api/contact` zapisuje zgłoszenie w prywatnej bazie i próbuje opcjonalnego powiadomienia e-mail.
Sukces zapisu nie jest potwierdzeniem odczytania wiadomości przez autora.
Na Pages kreator otwiera szkic w programie pocztowym. Użytkownik musi sam go wysłać;
wiadomość nie zostaje zapisana do lokalnej skrzynki.

## Pliki i kontrola

`contact.js`: kreator i treści CMS; `contact.css`: wygląd; `server/inbox.cjs`: zapis i powiadomienia.
API konfiguracji: `/api/pages/contact`; szkic: `/api/page-drafts/contact`.
Sprawdź wszystkie cztery tematy, powrót między krokami, niepoprawny e-mail, błąd wysyłki,
zachowanie treści po błędzie, oba języki i osobno wersję Pages z klientem poczty.
