# 🌐 GitHub Pages

[← Dokumentacja](README.md) · [Publikacja i kontrola](funkcje/PUBLIKACJA-KONTROLA.md)

> Kod zostaje na `main`. Workflow `.github/workflows/github-pages.yml` buduje osobny artefakt tylko z publiczną stroną — bez gałęzi `gh-pages` i bez publikowania całego repozytorium.

**Adres strony:** https://cinek477.github.io/portfolio/

## 🚀 Pierwsze uruchomienie

1. W repozytorium otwórz **Settings → Pages**.
2. **Custom domain** zostaw puste, chyba że masz własną, skonfigurowaną domenę (samo `portfolio` nie jest domeną).
3. W **Build and deployment → Source** wybierz **GitHub Actions**.
4. W **Actions → Publish portfolio to GitHub Pages** kliknij **Run workflow**, jeśli nie ruszył sam po pushu.
5. Po publikacji użyj adresu z zakończonego zadania `deploy`.

> [!NOTE]
> Repozytorium prywatne wymaga planu GitHub z Pages dla prywatnych repozytoriów.

## 🔁 Kolejne aktualizacje

Edytuj kod i treści lokalnie, a potem świadomie wypchnij zmiany i publiczne eksporty na `main`. Workflow robi kontrolę projektu, testy i eksport; nowa wersja zastępuje poprzednią.

> [!IMPORTANT]
> Sam zapis w panelu lokalnym niczego nie publikuje — potrzebny jest commit i push.

## ✅ Co działa / ❌ czego nie ma

| ✅ Działa | ❌ Ograniczenia |
| --- | --- |
| Podstrony, języki, motywy i animacje | Brak panelu zapisu, prywatnej skrzynki i bazy — pod adresem panelu jest informacja o edycji lokalnej |
| Projekty, fotografie, albumy, opinie, pakiety i FAQ | Treści to migawka ostatniego eksportu, nie połączenie z bazą |
| Kreator kontaktu otwiera szkic przez `mailto:` (adres e-mail widoczny jako alternatywa) | Wiadomość wysyła użytkownik ze swojej poczty; strona nie deklaruje dostarczenia |
| Dawne adresy HTML i aliasy katalogowe, np. `o-mnie/`, `projekty/swoja-droga/` | Spotify bez danych na żywo — zostaje link do profilu i nieruchoma dekoracja |

Lokalna strona działa bez zmian — adaptacje dotyczą wyłącznie wygenerowanych plików Pages.

## 💻 Eksport na komputerze

```sh
npm run pages:prepare
```

| | |
| --- | --- |
| **Wynik** | `dist/github-pages/` (ignorowany przez Git) |
| **Prefiks** | Domyślnie `/portfolio/`; workflow bierze właściwy z ustawień Pages. Dla domeny głównej ustaw `PAGES_BASE_PATH=/` |
| **Kopiowane** | Tylko źródła publicznych stron i `assets/` |
| **Pomijane** | `data/`, `backups/`, `.env`, historia Git, kod serwera |
| **API** | Zapisy zastąpione odczytem plików JSON w `static-api/` — to nie są działające endpointy |
| **Filtrowanie** | Ukryte i zarchiwizowane zdjęcia, projekty i opinie nie trafiają do list |
| **Testy** | `tests/github-pages.test.cjs` |

> [!WARNING]
> Pliki zdjęć w `assets/` pozostają publiczne, nawet gdy wpis usunięto z listy. Nie trzymaj tam prywatnych plików i nie edytuj ręcznie wygenerowanego folderu.
