# Lokalny panel portfolio

Uruchom w PowerShell w folderze projektu:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-gallery.ps1
```

- Portfolio: http://localhost:3000
- Galeria: http://localhost:3000/hobby.html
- Panel dodawania i edycji: http://localhost:3000/admin.html
- Zatrzymanie: Ctrl+C w oknie serwera.

Instancję uruchomioną w tle z zapisanym plikiem PID możesz zatrzymać poleceniem `powershell -ExecutionPolicy Bypass -File .\scripts\stop-gallery.ps1`, a potem ponownie uruchomić przez `scripts/start-gallery.ps1`.

Serwer używa Node.js 24 i wbudowanego SQLite. Lokalna kopia Node znajduje się w `.local`; na innym komputerze zainstaluj Node.js 24 LTS. Nie trzeba instalować pakietów npm.

Przy pierwszym uruchomieniu zdjęcia z `assets/js/gallery-data.js` są importowane do bazy. Potem galeria przez lokalny serwer korzysta z bazy. Po każdej zmianie w panelu serwer eksportuje aktualne opisy do `assets/js/gallery-data.js`. Dzięki temu galeria działa również jako statyczna strona, np. na GitHub Pages.

Panel pozwala dodawać zdjęcia, edytować metryczki i usuwać wpisy. Przy dodawaniu obraz jest zmniejszany do maksymalnie 2400 px i zapisywany jako JPG. Powstaje również miniatura WebP (lub JPEG, jeśli przeglądarka nie obsługuje WebP) do 800 px szerokości, ze znacznikiem `_thumb` w nazwie. Pole `thumbUrl` zapisuje się w SQLite i eksportach. Karty korzystają z miniatur, a lightbox z pełnej wersji. Poświata jest obliczana z pikseli. Usunięcie wpisu nie usuwa jego plików zdjęć z dysku.

## Logowanie

Panel otworzysz wyłącznie przez adres `/admin.html`, np. http://localhost:3000/admin.html. Możesz zapisać go w zakładkach przeglądarki. Publiczna nawigacja nie ma skrótu do administracji; ikona menu na telefonie wyłącznie rozwija i zwija linki. Przy pierwszym wejściu ustaw własne hasło (minimum 10 znaków) dla loginu `admin`. Potem panel wymaga logowania. Hasło jest zapisane jako skrót scrypt z losową solą w lokalnej bazie i nie trafia do eksportu ani GitHuba. Sesja trwa do 8 godzin; restart serwera wymaga ponownego logowania. Przycisk „Wyloguj się” kończy sesję.

## Kopia zapasowa

Zatrzymaj serwer i skopiuj `data/`, aby zachować bazę SQLite ze zdjęciami, projektami, prywatnymi wiadomościami i kontem administratora. Zdjęcia w `assets/images/gallery/` i `assets/images/projects/` oraz eksporty `assets/js/gallery-data.js` i `assets/js/projects-data.js` są uwzględniane w Git. Sama baza `data/gallery.sqlite`, konfiguracja `.env` i lokalne kopie w `backups/` pozostają poza Git.

## Wysyłanie galerii na GitHub

Zdjęcia i opisy zapisane w panelu stają się zmianami widocznymi dla Git. Trafiają na GitHub dopiero po commit i push. Panel nie wysyła niczego automatycznie do GitHuba. Na GitHub Pages dostępna będzie wyeksportowana galeria, a panel i baza nadal działają lokalnie.

Usunięcie wpisu usuwa go również z eksportu, ale pozostawia plik zdjęcia. Jeśli plik był już opublikowany, pozostaje w repozytorium do osobnego usunięcia.

Serwer nasłuchuje wyłącznie na Twoim komputerze (`127.0.0.1`). Panel nie jest przygotowany do publikowania w internecie; hosting wymaga logowania i osobnej konfiguracji.
## Projekty w panelu

Po zalogowaniu do `admin.html` wybierz zakładkę **Projekty**. Możesz dodawać, edytować i usuwać wpisy w sekcjach „Aktualne projekty” oraz „Projekty i kompetencje”. Formularz obsługuje tytuł, krótki i pełny opis, technologie, link, rok, symbol oraz opcjonalne zdjęcie. Zdjęcie można zastąpić nowym lub usunąć z kafelka. Wersja angielska jest opcjonalna.

Projekty zapisują się w SQLite i automatycznie eksportują do `assets/js/projects-data.js`. Strona główna odczytuje lokalne API, a na GitHub Pages korzysta z eksportu. Aby opublikować zmiany, dodaj eksport i zdjęcia z `assets/images/projects/` do commita, a następnie wykonaj push. Usunięcie wpisu nie usuwa jego pliku zdjęcia z dysku.

## Wiadomości i poczta

Kreator kontaktowy wysyła zgłoszenia do lokalnego API. Zakładka **Wiadomości** pozwala je czytać, oznaczać jako przeczytane i otwierać odpowiedź w aplikacji pocztowej. Wiadomości nie są eksportowane na GitHub. Powiadomienia e-mail wymagają konfiguracji usługi w `.env`; szczegóły opisuje [CONTACT-MESSAGES.md](CONTACT-MESSAGES.md).

## Kosz i bezpieczne usuwanie

Przycisk „Usuń…” otwiera okno z tytułem wpisu i wyborem: przeniesienie do kosza, trwałe usunięcie albo anulowanie. Trwałe usunięcie wymaga wpisania `USUŃ`. Usuwany jest wpis z opisami, a pliki zdjęć pozostają w magazynie — okno wyraźnie informuje o tym przed decyzją.

Kosz jest prywatny i wymaga sesji administratora. Zachowuje pełne dane zdjęć, projektów i osiągnięć, identyfikator, pozycję oraz datę usunięcia. Wpisy w koszu nie trafiają do publicznych list ani eksportów. „Przywróć” odtwarza poprzedni wpis i jego widoczność; ponowne przywrócenie nie tworzy duplikatu. Kosz nie opróżnia się automatycznie. Prywatna tabela `trash` jest objęta kopią całej bazy SQLite.

W edytorze podstron usunięcie elementu listy wymaga potwierdzenia. Przed zapisaniem dostępne jest „Cofnij usunięcie”, które przywraca także niezapisane wartości pól. Te elementy formularza nie trafiają do trwałego kosza: po zapisaniu podstrony cofnięcie jest niedostępne. Można też odrzucić cały niezapisany formularz.

Wersja Sites ma analogiczne API i wymaga migracji `0001_recoverable_trash.sql` przed wdrożeniem nowego backendu. Lokalne uruchomienie tworzy tabelę automatycznie bez usuwania istniejących danych. Publikacja online jest osobnym krokiem.

## Podstrony najważniejszych projektów

W edycji projektu lub osiągnięcia rozwiń „Podstrona projektu — opis realizacji”. Włącz podstronę i uzupełnij nazwę, problem, rozwiązanie, swój wkład i wynik (PL/EN). Puste sekcje są ukryte. Grafika korzysta z obrazu wpisu, a zewnętrzny przycisk z dotychczasowego linku. Treść zapisuje się w `caseStudy` tego samego rekordu SQLite/D1 i w publicznym eksporcie projektów. Nie powstaje druga kopia wpisu.

Kafelki z włączoną podstroną pokazują „Poznaj projekt”, np. `project.html?id=achievements-1`. Ukrycie, przeniesienie do kosza lub wyłączenie podstrony powoduje, że szablon nie wyświetla tej podstrony. Wyłączenie podstrony nie jest mechanizmem ochrony poufnych danych: treść publicznego wpisu pozostaje częścią jego danych API. Przywrócenie wpisu zachowuje również opis realizacji. Samo wyłączenie podstrony nie usuwa zapisanych pól. Wersja statyczna wymaga publikacji aktualnych eksportów.
