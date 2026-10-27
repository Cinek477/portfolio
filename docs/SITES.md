# Jeden kod: komputer, GitHub i Sites

Główne repozytorium `Cinek477/WDAI-2026` jest źródłem kodu obu wersji.

| Miejsce | Zawartość |
| --- | --- |
| `pages/` i `assets/` | Wspólne strony, style, zdjęcia i skrypty przeglądarki |
| `shared/normalize.cjs` | Wspólna walidacja zdjęć i projektów |
| `server.cjs`, `server/` | Lokalny backend Node.js i SQLite |
| `sites/` | Backend online Workers, D1, R2 i logowanie ChatGPT |
| `sites/.openai/hosting.json` | Powiązanie z istniejącym portfolio Sites; nie zmieniaj project_id |
| `scripts/prepare-sites.cjs` | Przygotowanie wersji online ze wspólnego kodu |

## Codzienna praca

Edytuj strony i zasoby w głównym katalogu. `sites/public/`, `sites/lib/normalize.js` i `sites/lib/seed.json` są generowane, ignorowane przez Git i nadpisywane przy przygotowaniu. Nie edytuj ich ręcznie.

Navbar edytuj w `components/navbar.html`. Znacznik `<!-- component:navbar -->` w stronach jest zastępowany przez lokalny serwer oraz podczas przygotowania Sites; aktywna zakładka dopasowuje się do podstrony. Opublikowane pliki zawierają gotowe menu, bez dodatkowego pobierania przez przeglądarkę. Surowe pliki źródłowe wymagają serwera lub przygotowania przed publikacją na innym hostingu statycznym.

```sh
npm start             # dotychczasowa wersja lokalna, localhost:3000
npm run check
npm test
npm run sites:prepare # przygotowanie wspólnego interfejsu dla Sites
npm run sites:test    # testy backendu online; wymagają Node.js 24+
```

Do budowania wersji Sites zainstaluj jej zależności w `sites/` zgodnie z workflow Sites, następnie uruchom z głównego katalogu:

```sh
npm run sites:build
```

Zależności i konfiguracja wykonania Sites są osobne od bezpakietowego lokalnego serwera. Podgląd Workers wymaga lokalnego profilu wykonania oraz lokalnych migracji D1; nie łączy się z produkcyjną bazą. Zwykłe `npm start` nadal używa istniejącego serwera SQLite.

## Publikacja

GitHub przechowuje wspólny kod. Sites ma własne repozytorium publikacyjne — samo `git push` do GitHuba nie wdraża strony.

1. Zapisz zmiany w głównym repozytorium.
2. W Codex poproś o publikację portfolio do istniejącego Sites. Agent otwiera aktualny checkout Sites i uzyskuje krótkotrwały dostęp, bez zapisywania tokenu.
3. Przekaż wspólny kod do zweryfikowanego checkoutu:

```sh
npm run sites:stage -- --checkout ABSOLUTNY_KATALOG_CHECKOUTU_SITES
```

4. Zbuduj ten checkout, wykonaj testy i workflow Sites (push źródeł, archiwum, zapis wersji, wdrożenie). Zachowaj dotychczasowy project_id, D1/R2 i uprawnienia odwiedzających.

Skrypt przekazuje tylko dozwolone źródła, z pominięciem `.env`, `data/`, haseł, wiadomości, `.git` i lokalnych baz. Usunięte zasoby są usuwane także z przygotowanych katalogów. Nie uruchamiaj starego `.local/prepare-static-site.cjs`: tworzy wersję bez backendu.

Adres: https://marcin-podyma-portfolio.cheekyflint256.chatgpt.site

## Dane pozostają osobne

- Lokalny panel: SQLite w `data/` oraz pliki na komputerze.
- Panel Sites: D1 i zdjęcia R2.
- GitHub: kod, publiczne eksporty oraz zdjęcia przeznaczone do publikacji. Bez prywatnych wiadomości i haseł.

Przygotowanie kodu nie synchronizuje baz. `seed.json` służy tylko do pierwszego zapełnienia pustej bazy online; kolejne publikacje nie nadpisują edycji z panelu ani wiadomości. Identyfikator pierwszego importu `seed-v1` pozostaje niezmieniony. Nie usuwaj zasobów D1/R2 ani nie resetuj migracji przy publikacji.

Automatyczna synchronizacja danych, eksport online do lokalnej bazy oraz automatyczne wdrożenie po pushu nie są jeszcze skonfigurowane.

## Edycja podstron

Pierwszy etap obejmuje Start i „O mnie”. W panelu są wymienione wszystkie podstrony; pozostałe mają podgląd i komunikat o kolejnym etapie. Osobna grupa „Bazy danych” prowadzi do projektów, osiągnięć i galerii, a wiadomości mają własną zakładkę.

Ustawienia Start pozostają pod kluczem `home`, a treść „O mnie” pod `page-about` w tabeli `settings`. API `/api/pages/home` i `/api/pages/about` udostępnia treść publicznie, ale zapis wymaga sesji administratora (lokalnie) albo konta właściciela (Sites). Dotychczasowe `/api/home` nadal działa. `shared/page-defaults.json` zawiera treści początkowe, nie nadpisuje ustawień zapisanych w bazie.

Zdjęcia podstron są lokalnie w `assets/images/pages/2400px/` oraz `800px/`; online korzystają z R2. Lokalny serwer odświeża `assets/js/pages-data.js` oraz `home-data.js` przy zapisie. Domyślne dane, walidacja i wersja statyczna są przygotowywane także dla Sites.
