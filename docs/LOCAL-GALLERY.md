# 🖼️ Lokalny panel portfolio

[← Dokumentacja](README.md) · [Galeria i albumy](funkcje/GALERIA-ALBUMY.md) · [Kopie i kosz](funkcje/KOPIE-KOSZ.md)

> Panel do dodawania zdjęć, projektów i treści. Działa wyłącznie na Twoim komputerze.

## ▶️ Uruchomienie

W PowerShell, w folderze projektu:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-gallery.ps1
```

| Widok | Adres |
| --- | --- |
| Portfolio | http://localhost:3000 |
| Galeria | http://localhost:3000/po-godzinach |
| Panel | http://localhost:3000/admin |

Zatrzymanie: <kbd>Ctrl</kbd>+<kbd>C</kbd> w oknie serwera. Instancję w tle (z plikiem PID) zatrzymasz przez `scripts/stop-gallery.ps1`.

- Wymagany **Node.js 24** z wbudowanym SQLite — bez pakietów npm. Lokalna kopia Node leży w `.local/`; na innym komputerze zainstaluj Node.js 24 LTS.
- Serwer nasłuchuje tylko na `127.0.0.1`. Panel nie jest przygotowany do publikacji w internecie.

## 📸 Zdjęcia

- Przy pierwszym uruchomieniu zdjęcia z `assets/js/gallery-data.js` są importowane do bazy; potem galeria korzysta z bazy.
- Po każdej zmianie serwer eksportuje opisy z powrotem do `gallery-data.js`, więc galeria działa też jako strona statyczna.

| Wersja | Rozmiar | Format | Użycie |
| --- | --- | --- | --- |
| Pełna | do 2400 px | JPG | Podgląd (lightbox) |
| Miniatura `_thumb` | do 800 px szer. | WebP (lub JPEG) | Karty galerii, pole `thumbUrl` |

Poświata jest liczona z pikseli zdjęcia.

> [!NOTE]
> Usunięcie wpisu nie usuwa plików zdjęć z dysku. Jeśli plik był już opublikowany, zostaje w repozytorium do osobnego usunięcia.

## 🔐 Logowanie

- Panel jest dostępny tylko pod `/admin` — publiczna nawigacja nie ma do niego skrótu.
- Przy pierwszym wejściu ustawiasz hasło (min. **10 znaków**) dla loginu `admin`.
- Hasło jest zapisane jako skrót scrypt z losową solą w lokalnej bazie — nie trafia do eksportu ani na GitHub.
- Sesja trwa do **8 godzin**; restart serwera wymaga ponownego logowania.

## 💾 Kopia zapasowa

Zatrzymaj serwer i skopiuj `data/` — to baza ze zdjęciami, projektami, wiadomościami i kontem administratora.

| W Git | Poza Git |
| --- | --- |
| `assets/images/gallery/`, `assets/images/projects/` | `data/gallery.sqlite` |
| `assets/js/gallery-data.js`, `assets/js/projects-data.js` | `.env`, `backups/` |

## ⬆️ Publikacja zmian

Zmiany z panelu pojawiają się w Git jako zmienione pliki i trafiają na GitHub dopiero po **commit i push** — panel niczego nie wysyła sam. Na GitHub Pages dostępny jest eksport, a panel i baza zostają lokalnie.

## 💻 Projekty

W zakładce **Projekty** dodajesz, edytujesz i usuwasz wpisy w sekcjach „Aktualne projekty” oraz „Projekty i kompetencje”.

- Pola: tytuł, krótki i pełny opis, technologie, link, rok, symbol i opcjonalne zdjęcie (można je zastąpić lub usunąć). Wersja angielska jest opcjonalna.
- Projekty zapisują się w SQLite i eksportują do `assets/js/projects-data.js`. Do publikacji dodaj eksport i zdjęcia z `assets/images/projects/` do commita.

### Podstrony projektów

W edycji projektu lub osiągnięcia rozwiń **„Podstrona projektu — opis realizacji”**, włącz ją i uzupełnij nazwę, problem, rozwiązanie, swój wkład i wynik (PL/EN).

- Puste sekcje są ukryte. Grafika pochodzi z obrazu wpisu, przycisk — z jego linku.
- Treść zapisuje się w polu `caseStudy` tego samego rekordu i w eksporcie — bez drugiej kopii wpisu.
- Kafelek pokazuje „Poznaj projekt”, np. `project.html?id=achievements-1`.
- Ukrycie, kosz lub wyłączenie podstrony ukrywa ją; wyłączenie nie usuwa zapisanych pól, a przywrócenie wpisu zachowuje opis.

> [!WARNING]
> Wyłączenie podstrony nie chroni poufnych danych — treść publicznego wpisu nadal jest w danych API.

## ✉️ Wiadomości

Zakładka **Wiadomości** pozwala czytać zgłoszenia z kreatora, oznaczać je jako przeczytane i odpowiadać. Szczegóły i konfiguracja poczty: [CONTACT-MESSAGES.md](CONTACT-MESSAGES.md).

## 🗑️ Kosz i bezpieczne usuwanie

„Usuń…” otwiera okno z wyborem: **do kosza**, **trwale** (wymaga wpisania `USUŃ`) albo **anuluj**. Usuwany jest wpis z opisami — pliki zdjęć zostają, o czym okno informuje.

- Kosz jest prywatny, wymaga administratora i nie opróżnia się sam.
- Zachowuje pełne dane, identyfikator, pozycję i datę usunięcia; wpisy z kosza nie trafiają do list ani eksportów.
- „Przywróć” odtwarza wpis i jego widoczność, bez duplikatów. Tabela `trash` jest objęta kopią bazy.

**Edytor podstron:** usunięcie elementu listy wymaga potwierdzenia, a przed zapisem działa „Cofnij usunięcie” (przywraca też niezapisane wartości). Po zapisie cofnięcie jest niedostępne. Można też odrzucić cały niezapisany formularz.
