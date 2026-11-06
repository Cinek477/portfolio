# Panel administratora

[Spis podstron](README.md) · [Pełna edycja treści](../funkcje/ADMIN-FULL-EDIT.md)

## Adres i dostęp

Lokalny adres: `/admin`; źródło `pages/admin.html`. Panel jest osobną aplikacją, nie widokiem publicznego routera.
Nie ma publicznego odnośnika administracyjnego w menu.
Pierwsze uruchomienie bez konta pozwala ustawić hasło konta `admin` i wymaga powtórzenia hasła.
Hasło ma mieć 10–128 znaków. Przy kolejnych uruchomieniach wymagane jest logowanie.

Hasło jest przechowywane jako scrypt z losową solą, nie jawny tekst.
Sesja w pamięci serwera trwa do ośmiu godzin; restart ją kończy. Wylogowanie unieważnia sesję.
Po ośmiu nieudanych próbach z danego adresu obowiązuje blokada do końca 15-minutowego okna prób.
Zapisy API wymagają poprawnego lokalnego pochodzenia żądania i sesji tam, gdzie jest wymagana.

## Mapa obszarów panelu

| Obszar | Operacje i dokumentacja |
| --- | --- |
| Podstrony: Start, O mnie, Projekty, Korepetycje, Kontakt | [Edycja pól, szkice, podgląd, porównanie, publikacja, historia](../funkcje/ADMIN-FULL-EDIT.md) |
| Podstrony: Po godzinach | Podgląd; pełny edytor tekstów jeszcze niezaimplementowany |
| Projekty i osiągnięcia | [Dodawanie, edycja, widoczność, okładki, opisy realizacji](../funkcje/PROJEKTY.md) |
| Galeria zdjęć | [Upload, metadane, kadrowanie, albumy, okładka, kolejność, operacje grupowe](../funkcje/GALERIA-ALBUMY.md) |
| Opinie | [Treści, oceny, widoczność i archiwizacja](../funkcje/KOREPETYCJE-OPINIE.md) |
| Wiadomości | [Odczyt, odpowiedzi, foldery, status sprawy, notatki, powiadomienia](../funkcje/SKRZYNKA.md) |
| Kosz | [Przywracanie zdjęć i realizacji, trwałe usuwanie](../funkcje/KOPIE-KOSZ.md) |
| Spotify | [Client ID, połączenie, sprawdzenie i odłączenie](../funkcje/SPOTIFY.md) |
| Przed publikacją | [Kontrola treści i plików](../funkcje/PUBLIKACJA-KONTROLA.md) |
| Kopie zapasowe | [Tworzenie, lista i przywracanie](../funkcje/KOPIE-KOSZ.md) |

## Statystyki i wyszukiwanie

Pulpit pokazuje liczbę szkiców, ukrytych zdjęć, zdjęć tylko w albumach i nieprzeczytanych wiadomości.
Wyszukiwanie list obsługuje wiele słów, teksty PL/EN i polskie znaki.
Nie jest wyszukiwarką całej prywatnej bazy: filtruje karty wczytane do danej listy.
Ograniczenie to ma znaczenie zwłaszcza dla skrzynki pokazującej do 100 ostatnich wiadomości z folderu.

## Zabezpieczenia podczas edycji

Formularze zdjęć, projektów i opinii ostrzegają przed porzuceniem niezapisanych zmian.
Edytor podstron ma osobny stan zmian i ostrzeżenia; nie jest to automatyczny zapis.
Na czas zapisu odpowiednie formularze i listy są blokowane, aby nie wysłać sprzecznych operacji.
Usuwanie elementów i przywracanie kopii korzysta z potwierdzeń; szczegóły opisano w rozdziałach funkcji.

## Zakres „full edit”

Panel nie jest edytorem dowolnego HTML/CSS. Zmienia pola, które aplikacja przewiduje w schemacie.
Nie udostępnia pełnej edycji tekstów hobby, strony 404, wspólnego menu i stopki, arkuszy stylów ani przesyłania PDF CV.
Nie ma też interfejsu zarządzania wieloma kontami ani odzyskiwania zapomnianego hasła e-mailem.
Nie należy mylić zapisania rekordu bazy, publikacji szkicu podstrony i wdrożenia na GitHub Pages.

## Pliki, prywatność i testowanie

Główna obsługa: `assets/js/admin.js`; kolejne obszary: `admin-pages.js`, `admin-projects.js`,
`admin-messages.js`, `admin-reviews.js`, `admin-trash.js`, `admin-dashboard.js`, `admin-spotify.js`.
Wspólne zabezpieczenia: `admin-delete.js`, `admin-unsaved.js`, `admin-search.js`. Style: `admin.css` i kontrolki.
SQLite jest w `data/gallery.sqlite`. Nie publikuj danych, tokenów, `.env` ani kopii.
Na Pages zamiast panelu wyświetlana jest informacja o lokalnej edycji.
Kontroluj logowanie, odmowę dostępu bez sesji, wylogowanie, ostrzeżenia o zmianach i każdą operację zapisu na danych testowych.
