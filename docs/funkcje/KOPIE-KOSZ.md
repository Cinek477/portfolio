# ⚙️ Kosze, archiwum i kopie bezpieczeństwa

[← Dokumentacja](../README.md) · [Spis funkcji](README.md) · [Skrzynka](SKRZYNKA.md) · [Edycja podstron](ADMIN-FULL-EDIT.md)

## 1. Cztery różne mechanizmy odzyskiwania

| Mechanizm | Co obejmuje | Czego nie robi |
| --- | --- | --- |
| Cofnięcie usunięcia w formularzu | Element listy edytora przed zapisem | Nie przywraca całej bazy |
| Historia podstrony | Poprzednie opublikowane treści jako nowy szkic | Nie przywraca wiadomości i wszystkich zdjęć |
| Kosz / archiwum rekordów | Zdjęcia i projekty w koszu; opinie w archiwum; osobny kosz wiadomości | Nie są jednym wspólnym folderem |
| Pełna kopia panelu | SQLite i zawartość magazynu zdjęć | Nie jest kopią wszystkich plików projektu i ustawień środowiska |

## 2. Kosz zdjęć, projektów i osiągnięć

„Usuń…” na rekordzie umożliwia anulowanie, przeniesienie do kosza albo trwałe usunięcie.
Kosz zachowuje pełne dane i pozycję wpisu, a usuwa go z aktywnej tabeli i publicznych list.
Zakładka **Kosz** pokazuje rodzaj, tytuł, miniaturę, opis i datę usunięcia.

„Przywróć” odtwarza rekord z dawnym identyfikatorem, opisem, pozycją i widocznością.
Wpis wcześniej ukryty może więc po przywróceniu nadal być ukryty.
Jeśli identyfikator już istnieje w aktywnej tabeli, backend odmawia nadpisania.
„Usuń trwale…” wymaga wpisania `USUŃ`. Trwałe usunięcie nie jest odwracalne przez ten kosz.
Pliki zdjęć pozostają na dysku również po trwałym skasowaniu rekordu.

## 3. Osobny kosz wiadomości i archiwum opinii

Wiadomości trafiają do kosza w obrębie zakładki Wiadomości, nie do kosza fotografii.
Przywrócenie i opróżnianie opisano w [instrukcji skrzynki](SKRZYNKA.md).
Opinie można archiwizować i przywracać z archiwum; nie używają tej samej tabeli kosza.
Nie należy opisywać przywracania opinii jako przywracania projektu.

## 4. Co obejmuje pełna kopia

**Kopie zapasowe** zapisują `gallery.sqlite` oraz cały wskazany magazyn zdjęć.
Baza zawiera m.in. treści, zdjęcia i projekty jako rekordy, wiadomości i notatki,
konto administratora, opinie, ustawienia, szkice, historię i kosz.
Folder kopii zawiera również `manifest.json` z identyfikatorem, datą, powodem, rozmiarem i liczbą plików.
Domyślnie kopie są w `backups/project-snapshots/`; panel pokazuje rzeczywistą ścieżkę.

Nie jest kopiowany cały katalog projektu: `.env`, pliki konfiguracji i tokenów Spotify w `data/`,
kod, fonty, CV i historia Git wymagają osobnej strategii kopii.
Kopie z panelu są prywatne i nie trafiają do publicznego eksportu.

## 5. Kopia ręczna

1. Otwórz **Kopie zapasowe**.
2. Kliknij „Utwórz kopię bazy i zdjęć”.
3. Poczekaj na sukces, nie zamykając serwera.
4. Sprawdź nowy wpis na liście; „Odśwież” ponownie pobiera stan.

Ręczne kopie nie są usuwane przez limit pięciu kopii automatycznych.
Nie ma tu automatycznego wysyłania kopii na dysk zewnętrzny lub do chmury ani przycisku eksportowania ZIP.
Kopia na tym samym dysku nie zabezpiecza przed awarią całego dysku.

## 6. Kopie automatyczne

W standardowym lokalnym uruchomieniu serwer wykonuje kopie przed wybranymi operacjami:
publikacją szkicu, zmianami publicznych treści, zdjęć i projektów, operacjami albumów i kolejności oraz wybranym usuwaniem.
To nie harmonogram i nie kopia po każdym naciśnięciu klawisza.
Zachowywanych jest pięć najnowszych kopii z powodem `automatic`;
kopie ręczne i zabezpieczenie sprzed przywrócenia mają osobne powody i nie wchodzą do tej puli.
Instancje testowe mogą wyłączać automatyczne kopie.

## 7. Przywracanie pełnej kopii

1. Wybierz kopię według daty i opisu.
2. Przeczytaj ostrzeżenie i wpisz `PRZYWRÓĆ`.
3. Serwer sprawdza format i integralność bazy oraz strukturę wymaganych tabel.
4. Najpierw tworzy kopię obecnego stanu z powodem `before-restore`.
5. Kopiuje obrazy z wybranej kopii, przywraca SQLite i regeneruje publiczne eksporty.
6. Unieważnia sesje; zaloguj się ponownie hasłem obowiązującym w przywróconej bazie.

Przywrócenie zastępuje również wiadomości, notatki, szkice i konto administratora.
Nie jest operacją scalania nowych rekordów ze starymi.
Kopiowanie zdjęć nie czyści automatycznie każdego dodatkowego pliku z obecnego magazynu.
Przy błędzie po utworzeniu zabezpieczenia backend próbuje odtworzyć poprzednią bazę i obrazy.
Nie traktuj tego jako gwarancji odzyskania danych po awarii dysku lub przerwaniu procesu systemowego.

## 8. Blokady i ograniczenia

Kopia/przywracanie ma stan zajętości; konkurencyjne operacje są odrzucane, a zapisy mogą chwilowo zwracać błąd.
Poczekaj na zakończenie, zamiast klikać wielokrotnie. Dowiązania symboliczne i niepoprawne identyfikatory kopii są odrzucane.
Nie publikuj kopii w `assets/`, bo mogą zawierać prywatną korespondencję i hasła w postaci skrótów.

## 9. Pliki i testy

`server/backups.cjs`, `admin-dashboard.js`, `admin-trash.js`, `admin-delete.js`, `server.cjs`.
API: `/api/backups`, `/api/backups/:id/restore`, `/api/trash` oraz `/api/trash/:kind/:id[/restore]`.
Wymagana sesja administratora. Test przywracania wykonuj wyłącznie na odizolowanych danych:
utwórz kopię, zmień rekord, przywróć, sprawdź konto, wiadomości, zdjęcia, eksporty i ponowne logowanie.
