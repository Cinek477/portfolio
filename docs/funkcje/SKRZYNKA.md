# Prywatna skrzynka i obsługa spraw

[Spis funkcji](README.md) · [Kreator kontaktu](KONTAKT-KREATOR.md) · [Konfiguracja poczty](../CONTACT-MESSAGES.md)

## 1. Zakres i dostęp

Zakładka **Wiadomości** jest dostępna po zalogowaniu. Pokazuje zgłoszenia z lokalnego `/api/contact`.
Nie jest interfejsem Gmaila i nie pobiera automatycznie zwykłych e-maili.
Treści, adresy nadawców, statusy i notatki pozostają w prywatnej tabeli `messages`.
Nie trafiają do eksportów publicznych ani do Pages.

## 2. Lista i odświeżanie

Rekord pokazuje temat i zakres, adres e-mail, datę, treść, status przeczytania i stan powiadomienia.
Daty są wyświetlane według strefy Europe/Warsaw.
Lista pobiera do 100 najnowszych wiadomości wybranego folderu. Nie ma w tym widoku paginacji starszych zgłoszeń.
Liczniki folderów obejmują całą ich zawartość, nie tylko wczytane karty.

„Odśwież” pobiera dane od razu. Timer co 30 sekund sprawdza możliwość aktualizacji:
nie odświeża przy ukrytej karcie, wylogowaniu ani otwartym obszarze edycji sprawy.
To ogranicza nadpisywanie bieżącego formularza, ale nie stanowi systemu współpracy wielu administratorów.

## 3. Foldery

| Folder | Dostępne działania |
| --- | --- |
| Odebrane | Odczyt, odpowiedź, status i notatka, spam, kosz, ponowienie powiadomienia gdy dostępne |
| Spam | Odczyt, status i notatka, przywrócenie do Odebranych, kosz |
| Kosz wiadomości | Odczyt, przywrócenie do Odebranych, trwałe usunięcie, opróżnienie całego kosza |

Spam jest oznaczany ręcznie. Nie blokuje nadawcy ani następnych zgłoszeń.
Kosz nie opróżnia się automatycznie. Foldery nie zmieniają e-maili dostarczonych już do zewnętrznej poczty.
Licznik nowych zgłoszeń obejmuje tylko nieprzeczytane w Odebranych.

## 4. Przeczytanie, status sprawy i notatka

„Oznacz jako przeczytaną/nową” zmienia `is_read`. To coś innego niż etap obsługi sprawy.
W rozwijanym obszarze sprawy można wybrać:
- Nowe (`new`);
- Do odpowiedzi (`reply`);
- Ustalone (`agreed`);
- Zakończone (`done`).

Notatka prywatna ma do 4000 znaków. „Zapisz status i notatkę” zapisuje oba pola.
Notatka nie jest wysyłana nadawcy, nie staje się odpowiedzią i nie zmienia treści otrzymanego zgłoszenia.
Niezapisane formularze spraw są pamiętane w bieżącej karcie, a wyjście może wywołać ostrzeżenie.
Nie jest to trwały szkic w bazie: po zamknięciu karty niezapisane dane mogą przepaść.

## 5. Wyszukiwanie i filtr statusu

Wybór statusu ogranicza listę do określonego etapu. Pole wyszukiwania filtruje wczytane karty,
uwzględniając m.in. e-mail, treść, temat, datę i notatki.
Obsługuje polskie znaki i wiele słów. Nie wykonuje wyszukiwania starszych rekordów poza limitem listy.
Przy braku wyników sprawdź folder, status i frazę; rekord nie musi być usunięty.

## 6. Odpowiedź

„Odpowiedz” otwiera program pocztowy z adresem nadawcy i tematem odpowiedzi.
Panel nie wysyła tej odpowiedzi sam, nie zapisuje jej treści ani nie oznacza automatycznie sprawy jako zakończonej.
Po wysłaniu odpowiedzi użytkownik powinien sam zaktualizować status lub notatkę.

## 7. Powiadomienia e-mail

Powiadomienie informuje właściciela o nowym zgłoszeniu. Odbiorca pochodzi z konfiguracji serwera,
a e-mail wpisany przez gościa trafia do Reply-To, nie do pola dowolnego odbiorcy.
W `.env` używane są `RESEND_API_KEY`, `CONTACT_MAIL_FROM`, opcjonalnie `CONTACT_MAIL_TO`.
Po zmianie konfiguracji wymagany jest restart serwera. Nie wpisuj kluczy w publicznym kodzie.

| Status | Znaczenie |
| --- | --- |
| `pending` | Próba powiadomienia jest jeszcze w toku albo pozostała niedokończona |
| `sent` | Usługa pocztowa przyjęła żądanie; nie jest to dowód dostarczenia ani odczytu |
| `failed` | Próba powiadomienia zakończyła się błędem |
| `not_configured` | Brak aktywnej konfiguracji poczty; zgłoszenie nadal jest w bazie |

„Ponów powiadomienie” pojawia się dla odpowiednich zgłoszeń w Odebranych, gdy poczta jest skonfigurowana
i poprzedni status nie jest `sent`. Najpierw przywróć zgłoszenie ze spamu/kosza, jeśli chcesz ponowić powiadomienie.
Ponowienie nie wysyła odpowiedzi do klienta i nie tworzy nowego zgłoszenia.

## 8. Kosz i trwałe usuwanie

Przeniesienie pojedynczej wiadomości do kosza wymaga potwierdzenia.
„Nie pytaj ponownie” dotyczy wyłącznie tego działania, tej przeglądarki i tego adresu strony.
„Przywróć potwierdzenia” kasuje preferencję.
Trwałe usuwanie zawsze wymaga osobnego potwierdzenia przez wpisanie `USUŃ` i jest możliwe tylko w koszu.

„Opróżnij kosz” usuwa wszystkie zgłoszenia z kosza — również starsze niż 100 pokazanych rekordów
i niewidoczne przez filtr. Pozostawia Odebrane i Spam bez zmian.
Serwer sprawdza migawkę identyfikatorów; zmiana zawartości kosza wymaga ponownego potwierdzenia.
Zniknięcie zgłoszenia z panelu nie usuwa wcześniej wysłanego powiadomienia z poczty.

## 9. Pliki, API i kontrola

`admin-messages.js`, `admin-search.js`, `admin-delete.js`, `server/inbox.cjs`.
API: `GET /api/messages?folder=...`, `PUT /api/messages/:id`, `POST /api/messages/:id/notify`,
`DELETE /api/messages/:id`, `DELETE /api/messages` dla opróżnienia kosza.
Wszystkie wymagają sesji administratora.

Testuj brak dostępu bez sesji, zapis przy niedziałającej poczcie, liczniki, foldery,
odczyt niezależny od statusu, zapis notatki, odpowiedź przez klienta poczty,
powrót ze spamu i kosza, usuwanie oraz konflikt migawki przy opróżnianiu.
