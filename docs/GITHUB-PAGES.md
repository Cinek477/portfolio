# GitHub Pages

Kod pozostaje na gałęzi `main`. Workflow `.github/workflows/github-pages.yml` buduje osobny artefakt zawierający wyłącznie publiczną stronę. Nie potrzeba gałęzi `gh-pages` i nie należy publikować całego katalogu repozytorium.

## Pierwsze uruchomienie

1. W repozytorium otwórz **Settings → Pages**.
2. Pole **Custom domain** pozostaw puste, chyba że masz własną, poprawnie skonfigurowaną domenę. Samo `portfolio` nie jest domeną.
3. W **Build and deployment → Source** wybierz **GitHub Actions**.
4. W **Actions → Publish portfolio to GitHub Pages** uruchom **Run workflow**, jeśli nie rozpoczął się automatycznie po wysłaniu kodu.
5. Po udanej publikacji użyj adresu wskazanego w zakończonym zadaniu `deploy`.

Dla repozytorium `Cinek477/WDAI-2026` domyślny adres to `https://cinek477.github.io/WDAI-2026/`. Repozytorium prywatne wymaga planu GitHub umożliwiającego Pages z prywatnych repozytoriów.

## Kolejne aktualizacje

Edytuj kod i treści lokalnie, a następnie świadomie wyślij zmiany oraz publiczne eksporty do `main`. Workflow wykonuje kontrolę projektu, testy i eksport. Nowy eksport zastępuje poprzednią wersję strony. Sam zapis w panelu lokalnym nie publikuje zmian.

## Co działa

- Publiczne podstrony, języki, motywy i animacje.
- Zapisane projekty, fotografie, albumy, opinie, pakiety i FAQ.
- Kreator kontaktu przygotowujący szkic przez `mailto:`. Użytkownik wysyła wiadomość ze swojego programu pocztowego; strona nie deklaruje dostarczenia jej do skrzynki panelu. Konieczny jest skonfigurowany klient poczty; adres e-mail pozostaje widoczny jako alternatywa.
- Tradycyjne adresy HTML oraz katalogowe aliasy, np. `o-mnie/` i `projekty/swoja-droga/`.

## Ograniczenia

- Brak panelu zapisu, prywatnej skrzynki i bazy na Pages. Pod adresem panelu wyświetlana jest informacja o edycji lokalnej.
- Brak Spotify na żywo; pozostaje link do profilu i nieruchoma dekoracja.
- Publiczne treści są migawką ostatniego eksportu, nie połączeniem z lokalną bazą.
- Lokalna strona i backend Sites zachowują swoje działanie; adaptacje dotyczą wyłącznie wygenerowanych plików Pages.

## Eksport na komputerze

```sh
npm run pages:prepare
```

Wynik: `dist/github-pages/`, ignorowany przez Git. Domyślny prefiks to `/WDAI-2026/`; workflow otrzymuje właściwy prefiks z ustawień Pages. Dla domeny głównej ustaw `PAGES_BASE_PATH=/` w środowisku przed uruchomieniem eksportu.

Eksporter kopiuje tylko źródła publicznych stron i `assets/`. Nie kopiuje `data/`, `backups/`, `.env`, historii Git ani kodu serwera. Zapisy API w publicznych modułach są zastępowane odczytem jawnych plików JSON w `static-api/`; nie są to działające endpointy serwera. Niewidoczne i zarchiwizowane zdjęcia, projekty i opinie są odfiltrowane z eksportowanych list. Pliki zdjęć obecne w `assets/` pozostają publiczne, nawet jeśli wpis usunięto z listy.

Nie przechowuj prywatnych plików w `assets/`. Nie edytuj ręcznie wygenerowanego folderu. Kontrole eksportu znajdują się w `tests/github-pages.test.cjs`.
