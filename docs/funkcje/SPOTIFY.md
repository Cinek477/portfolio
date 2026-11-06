# Integracja Spotify

[Spis funkcji](README.md) · [Po godzinach](../podstrony/PO-GODZINACH.md)

## 1. Zakres

Publiczny widok przedstawia bieżący utwór oraz do pięciu najczęściej słuchanych nagrań
z zakresu `short_term` zwróconego przez Spotify. Nie odtwarza muzyki, nie steruje odtwarzaczem i nie sprzedaje dostępu.
Linki prowadzą do Spotify. Dekoracyjny winyl nie zawiera obracającej się okładki Spotify.

## 2. Konfiguracja w panelu

1. Zaloguj się i otwórz **Spotify**.
2. Przygotuj aplikację Spotify z dostępem do Web API.
3. Do jej konfiguracji wpisz dokładny Redirect URI pokazany przez panel.
4. Wklej 32-znakowy Client ID, nie Client Secret, i zapisz.
5. Kliknij „Połącz ze Spotify” i zatwierdź zgodę w serwisie.
6. Po powrocie użyj „Sprawdź połączenie” i otwórz publiczną sekcję muzyczną.

To opis mechanizmu aplikacji, nie gwarancja dostępności dostępu po stronie Spotify;
wymagania kont i uprawnień usługi mogą się zmieniać.
Client ID można też ustawić przez `SPOTIFY_CLIENT_ID` w środowisku — wówczas panel nie nadpisze konfiguracji.
`SPOTIFY_REDIRECT_URI` pozwala określić adres powrotu; domyślny korzysta z `127.0.0.1` i portu serwera.

## 3. Przepływ autoryzacji

Backend tworzy żądanie autoryzacji z PKCE i stanem sesji połączenia.
Callback sprawdza stan i czas ważności przed wymianą kodu na tokeny.
Token dostępu jest odświeżany z użyciem refresh tokena.
Zmiana Client ID może usunąć wcześniejsze połączenie — trzeba zalogować konto ponownie.
Nie wpisuj tokenów ani sekretów do plików HTML i publicznych eksportów.

## 4. Zapis i odłączenie

Ustawienia i tokeny są w prywatnych `data/spotify-config.json` i `data/spotify-auth.json`.
Serwer nie udostępnia ich jako zasobów statycznych. Dane publiczne nie zawierają tokenów.
„Odłącz konto” wymaga potwierdzenia i usuwa lokalnie zapisane połączenie.
Nie jest to tym samym co cofnięcie zgody aplikacji na koncie Spotify; zgodę można cofnąć także w samym serwisie.
Kopie z panelu obejmują SQLite i zdjęcia, nie te dodatkowe pliki tokenów.

## 5. Publiczne stany widoku

- Brak połączenia: nie wyświetlaj informacji jak dla aktywnego słuchania.
- Połączenie i bieżący utwór: osobna okładka, nazwa, artyści, album i link.
- Połączenie, ale brak aktywnego utworu: stan „teraz nic nie gra”.
- Brak wystarczających danych listy: informacja, że pojawi się później.
- Tymczasowa niedostępność: komunikat przerwy lub ostatnia udana lista oznaczona jako nieaktualna.

Przycisk „Co gra?” rozwija szczegóły bieżącego utworu. Linki otwierają serwis zewnętrzny.
Błąd pobrania okładki nie powinien uniemożliwiać wyświetlenia tekstowych metadanych.

## 6. Częstotliwość i wydajność

Frontend próbuje odświeżać dane co minutę, ale pomija ukrytą kartę, niewidoczną sekcję,
trwające pobieranie i opuszczoną podstronę. Obserwator ma margines przygotowania sekcji.
Backend współdzieli równoczesne zapytania i buforuje wynik przez około minutę.
Przy ograniczeniu liczby zapytań uwzględnia czas ponowienia wskazany przez usługę.
Animacja winyla uwzględnia widoczność, stan odtwarzania i zasady ruchu w stylach.

## 7. Eksport i błędy

GitHub Pages nie ma tego backendu: eksporter wyłącza funkcję na żywo i pozostawia nieruchomą dekorację oraz link do profilu.
„Sprawdź połączenie” w panelu sprawdza status konfiguracji, a nie uruchamia muzyki.
Przy błędzie sprawdź Redirect URI, port, Client ID i zgodę konta; następnie połącz konto ponownie.
Nie publikuj prywatnych logów z tokenami.

## 8. Pliki i API

`server/spotify.cjs`, `admin-spotify.js`, `spotify.js`, `hobby.css`.
Publiczny odczyt: `GET /api/spotify`; prywatne zarządzanie: `/api/spotify/status`, `/config`, `/connect`, `/disconnect`;
callback: `/api/spotify/callback`.
Testy obejmują PKCE, stan, odświeżanie tokenów, współdzielony cache, prywatność i odłączenie.
