# Galeria, fotografie i albumy

[Spis funkcji](README.md) · [Po godzinach](../podstrony/PO-GODZINACH.md) · [Album z linku](../podstrony/ALBUM.md)

## 1. Dwie strony tej samej funkcji

Publiczna galeria pokazuje fotografie i umożliwia ich oglądanie.
**Bazy danych → Galeria zdjęć** służy do dodawania i zarządzania rekordami.
Operacje bazy zdjęć zapisują dane od razu lokalnie, bez osobnego szkicu podstrony.

## 2. Dodawanie zdjęcia

1. Otwórz galerię panelu i formularz dodawania.
2. Wybierz kategorię, plik i wypełnij metadane.
3. Ustaw kształt miniatury i punkt kadru.
4. Opcjonalnie wpisz nazwę albumu.
5. Zapisz i poczekaj na potwierdzenie. Sprawdź zdjęcie publicznie i w podglądzie.

Plik wejściowy powinien mieć mniej niż 20 MB. Formularz dopuszcza JPG, PNG i WebP.
Przeglądarka dekoduje zdjęcie, zmniejsza dłuższy bok do maksymalnie 2400 px i zapisuje JPEG z jakością 0,85.
Miniatura ma do 800 px szerokości i jest przygotowywana jako WebP z jakością 0,78
(przeglądarka może zwrócić inny obsługiwany format).
Przezroczystość jest składana na białym tle. Nie jest to magazyn niezmienionych oryginałów.
Z próbki obrazu wyznaczany jest kolor dekoracyjnej poświaty.
Backend weryfikuje format i sygnaturę pliku; limit całego żądania wynosi 32 MB.

## 3. Kategorie i pola

| Kategoria | Szczególne zachowanie |
| --- | --- |
| Koncerty (`concerts`) | Wymagany tytuł; dostępne artysta, wydarzenie, obiekt, miasto i data |
| Natura (`nature`) | Wymagane miejsce; brak koncertowych pól artysty i wydarzenia |
| Ludzie (`people`) | Wymagane miejsce; opcjonalny profil Instagram |
| Miejsca (`places`) | Wymagane miejsce; dane miejsca zamiast artysty |

Tytuł, wydarzenie, miasto i opis mają wersje PL/EN; artysta i obiekt są pojedynczym tekstem.
Pusta angielska wersja pól jest uzupełniana polską. Opis ma limit 2000 znaków, większość metadanych 500,
nazwa albumu 160. Dla kategorii innych niż koncerty brak tytułu może zostać zastąpiony opisem miejsca.
Data koncertu jest sprawdzana jako rzeczywista data, nie tylko tekst pasujący do formatu.

Instagram dla fotografii ludzi przyjmuje nazwę, `@nazwę` albo link do profilu, a zapisuje sam uchwyt.
Nieprawidłowa nazwa jest odrzucana. Publiczny link pojawia się tylko dla poprawnego profilu i właściwej kategorii.

## 4. Edycja istniejącego zdjęcia

„Edytuj” wczytuje metadane i kadr. Zapis aktualizuje rekord oraz publiczny eksport.
Obecna edycja istniejącego rekordu nie wysyła nowego pliku zdjęcia; upload jest wykonywany przy dodawaniu.
Nie należy opisywać pola pliku jako działającej podmiany oryginału w już istniejącym rekordzie.
Do wymiany fotografii należy dodać nowy wpis i świadomie przenieść lub usunąć stary.

## 5. Kadrowanie i proporcje

Kształty `regular`, `wide` i `tall` określają układ miniatury, nie proporcje pełnego zdjęcia.
Punkt kadrowania X/Y ma zakres 0–100%; „Wyśrodkuj” ustawia 50%/50%.
Panel pokazuje podglądy kadru. W miniaturach używany jest `object-position`.
Podgląd startuje od kwadratu z tym samym punktem kadru; kliknięcie zdjęcia przełącza na całe zdjęcie w naturalnych proporcjach i z powrotem. Nowe zdjęcie zawsze zaczyna od kwadratu.

## 6. Widoczność — trzy różne sytuacje

| Ustawienie | Efekt |
| --- | --- |
| `visible=false` | Rekord ukryty publicznie, zachowany w bazie panelu |
| `visible=true`, `galleryVisible=true` | Zdjęcie dostępne w głównej galerii oraz w albumie, jeśli jest przypisane |
| `visible=true`, `galleryVisible=false` | Zdjęcie tylko w albumie; wymaga nazwy albumu |

Zdjęcia bez albumu nie mogą pozostać wyłącznie albumowe: usunięcie przypisania przywraca widoczność w galerii.
Ukrycie rekordu nie usuwa pliku z `assets/` i nie jest ochroną prywatności pliku.

## 7. Albumy i okładka

Album tworzy się przez przypisanie tej samej nazwy wielu zdjęciom.
Nazwy porównywane są po usunięciu skrajnych spacji, normalizacji Unicode i bez rozróżniania wielkości liter.
Filtr albumów pomaga wybrać istniejącą grupę. Zaznaczenie zdjęć i „Przenieś zaznaczone” pozwala
zbiorczo zmienić album; pusta nazwa wypisuje zdjęcia z albumów.
Przeniesienie nie tworzy kopii pliku i nie jest automatycznym przemianowaniem całego albumu.

„Ustaw jako okładkę” wymaga widocznego zdjęcia przypisanego do albumu.
Wybór usuwa oznaczenie okładki z pozostałych zdjęć tej grupy. Okładka jest pokazywana jako pierwsza;
przy braku oznaczenia używana jest kolejność kolekcji.
Zmiana albumu może wyczyścić dotychczasową flagę okładki.

## 8. Kolejność i wyszukiwanie w panelu

Lista umożliwia przesuwanie wpisów. Wyszukiwanie obejmuje m.in. tytuł, album, miejsce i artystę.
Podczas aktywnego wyszukiwania przyciski zmiany kolejności są wyłączone — najpierw wyczyść frazę.
Backend porównuje przesłaną listę identyfikatorów z bieżącą zawartością bazy;
jeśli lista zmieniła się w międzyczasie, odrzuca zapis i prosi o odświeżenie.
Operacje grupowe również odrzucają nieaktualny wybór albo niepoprawne ustawienia.

## 9. Oglądanie publiczne

Filtry obejmują tylko zdjęcia przeznaczone do głównej galerii.
Komputer używa trzech cykli kart do zapętlonego przewijania; telefon jednego cyklu.
W dialogu działają przyciski poprzednie/następne i strzałki klawiatury. Escape i przycisk zamknięcia kończą podgląd.
Kliknięcie poza powierzchnią dialogu również może go zamknąć. Po zamknięciu fokus wraca do zdjęcia.
Brak wyników filtra daje komunikat pustej kategorii.

Metadane zależą od kategorii. Koncert pokazuje dane wydarzenia, inne kategorie skupiają się na miejscu,
opisie i ewentualnym Instagramie. „Samo zdjęcie” ukrywa metadane.
„Zobacz więcej zdjęć” otwiera kolekcję albumu; „Wróć do wszystkich zdjęć” przywraca kolekcję galerii.

## 10. Ładowanie i błędy

Loader współdzieli trwające pobrania i przechowuje do trzech zdekodowanych obrazów.
Na mniejszym ekranie może wybrać miniaturę. Po błędzie próbuje alternatywnego źródła raz.
Poprzedni obraz pozostaje widoczny podczas ładowania następnego.
Przeterminowane żądania nie powinny zastępować nowszego wyboru; zamknięcie anuluje ładowanie.
Limit oczekiwania wynosi 15 sekund. Niepowodzenie pokazuje komunikat i pozwala przejść dalej.
Pobranie następnego kadru z wyprzedzeniem jest pomijane przy oszczędzaniu danych.

## 11. Usuwanie i przechowywanie

„Usuń…” pozwala przenieść wpis do kosza lub trwale usunąć jego opis po dodatkowym potwierdzeniu.
Pliki pozostają w magazynie, także po trwałym usunięciu wpisu.
To zamierzone zabezpieczenie odzyskiwania, nie dowód, że każdą niepodlinkowaną fotografię wolno skasować.
Szczegóły: [kosz i kopie](KOPIE-KOSZ.md).

## 12. Pliki, API i kontrola

Publicznie: `gallery.js`, `lightbox.js`, `photo-loader.js`, `gallery-data.js`, `hobby.css`, `lightbox.css`.
Panel: `admin.js`; walidacja: `shared/normalize.cjs`; dane: `photos` w SQLite.
API: `/api/photos`, `/api/photos/:id`, `/api/photo-management`, `/api/photo-order`, `/api/album-cover`.
Fotografie trafiają do `assets/images/gallery/2400px/` i `800px/`; nie są prywatną częścią bazy.

Sprawdź każdą kategorię, oba języki, pion/poziom/kwadrat, skrajny kadr, pusty filtr,
album z jednym i wieloma zdjęciami, okładkę, zdjęcie tylko albumowe, kopiowanie linku bez schowka,
szybkie zmiany zdjęć, zamknięcie podczas pobierania i przywrócenie wpisu z kosza.
