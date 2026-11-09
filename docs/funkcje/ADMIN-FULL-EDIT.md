# ⚙️ Pełna edycja treści w panelu

[← Dokumentacja](../README.md) · [Spis funkcji](README.md) · [Panel administratora](../podstrony/ADMIN.md) · [Katalog pól CMS](POLA-CMS.md)

## 1. Co oznacza pełna edycja

Edytor obsługuje treści przewidziane przez schemat, a nie dowolne HTML i CSS.
Obsługiwane podstrony: Start (`home`), O mnie (`about`), Projekty (`projects`),
Korepetycje (`knowledge`) i Kontakt (`contact`).
Po godzinach ma w tej części panelu tylko podgląd. 404 nie ma zakładki edycji.
Rekordy zdjęć, realizacji i opinii są edytowane w osobnych bazach panelu.

## 2. Wybór podstrony i sekcji

1. Zaloguj się i wybierz podstronę.
2. Wybierz „Edytowana sekcja”; pole wyszukiwania filtruje nazwy sekcji.
3. Edytuj aktualną sekcję. Przełączanie sekcji tej samej podstrony nie zapisuje danych, ale zachowuje formularz.
4. Niepoprawne pole formularza powoduje otwarcie sekcji zawierającej pierwszy błąd.

Lista sekcji obsługuje Escape i strzałki klawiatury. Przy zmianie podstrony aplikacja może poprosić
o odrzucenie niezapisanych zmian. Podczas zapisu nie można przełączyć podstrony.
Edytor korzysta z krótkiego cache odczytu, ale po publikacji i odrzuceniu szkicu pobiera stan ponownie.

## 3. Zakres opcji według podstrony

| Podstrona | Opcje |
| --- | --- |
| Start | Powitanie, nagłówek i wyróżnienie, opis PL/EN, portret i alt, kapsułki, przyciski, „Teraz tworzę”, trzy wyróżnione realizacje, dodatkowe teksty i linki |
| O mnie | Nagłówek, akapity, portret i alt, kapsułki, przyciski, sekcje CV, zwykłe opisy i wpisy osi czasu |
| Projekty | Grupy „Wstęp”, „Doświadczenie”, „W trakcie”; teksty, linki i widoczność; nie rekordy realizacji |
| Korepetycje | Grupy wprowadzenia, zakresu, przebiegu, terminów i ceny, podejścia, pakietów i FAQ; plakietki czterech ofert; lista pytań |
| Kontakt | Nagłówki, opisy i linki, nazwy tematów, zakresów, pytań, ofert i wariantów częstotliwości spotkań |

Pełna lista grup i identyfikatorów pól jest w [katalogu pól CMS](POLA-CMS.md).
Nagłówki opinii na korepetycjach można edytować tutaj, ale treści recenzji i oceny pochodzą z bazy opinii.
W kontakcie ukryto przełącznik widoczności całych grup i wymuszono ich włączenie.

## 4. Pola PL/EN i odnośniki

Pola dwujęzyczne zapisują wartości PL i EN. Formularz zwykle uzupełnia pustą wersję EN tekstem polskim,
ale nie wykonuje tłumaczenia automatycznego. Wymagane pola i maksymalne długości są sprawdzane ponownie na serwerze.
Zależnie od schematu link ma adres, widoczność i opcjonalnie stan aktywności.
Ukryty link znika; nieaktywny może pozostać jako zapowiedź „SOON”.

Dozwolone są bezpieczne adresy HTTP/HTTPS, pojedynczy adres `mailto:`, kotwice,
adresy podstron HTML i plików w `assets/`. Walidator odrzuca m.in. `javascript:`, adresy z poświadczeniami,
przechodzenie przez `..`, niebezpieczne kodowanie ścieżek i odnośniki `//host`.
Nie zakładaj, że każdy adres akceptowany przez przeglądarkę jest dopuszczony przez formularz.

## 5. Listy, kolejność, usuwanie i cofanie

Listy mają przycisk dodania oraz strzałki przesuwania elementu w górę/dół.
Przycisk usunięcia wymaga potwierdzenia i pozostawia opcję „Cofnij usunięcie” w bieżącym formularzu.
To nie globalny kosz rekordów. Po ponownym wczytaniu formularza nie należy oczekiwać takiej samej listy cofnięć.
Przywrócenie elementu jest blokowane, jeśli limit listy jest już wykorzystany.

| Lista | Limit |
| --- | --- |
| Akapity O mnie | 8 |
| Kapsułki | 12 |
| Przyciski | 4 |
| Sekcje CV | 12 |
| Wpisy osi czasu w sekcji | 20 |
| FAQ korepetycji | 20 |
| Wyróżnione realizacje Startu | 3 różne identyfikatory |

Zestawu istniejących pól i grup CMS nie można dowolnie rozszerzyć przez zapis JSON.
Serwer wymaga zgodnych identyfikatorów i liczby pól; rozbudowa schematu jest zmianą kodu.

## 6. Zdjęcie podstrony i przyciski CV

Start i O mnie pozwalają wybrać nowe zdjęcie, zobaczyć podgląd, zmienić alt oraz widoczność.
Przed zapisem zdjęcie jest przygotowywane w przeglądarce. Wybór pliku sam w sobie nie publikuje go.
Zapis szkicu może już utworzyć pliki zdjęcia, ale nie zmienia publicznego wskazania na fotografię.
Przycisk „Pobieraj plik” ustawia zachowanie odnośnika; nie przesyła nowego PDF.
Sam dokument CV wymienia się w `assets/` i sprawdza jego adres.

## 7. Trzy stany treści

| Stan | Gdzie istnieje | Co widzi odbiorca |
| --- | --- | --- |
| Niezapisany formularz | Pamięć bieżącej karty | Dotychczasową wersję publiczną |
| Zapisany szkic | Prywatna tabela `page_drafts` | Nadal dotychczasową wersję publiczną |
| Opublikowana treść | Ustawienia w SQLite i eksporty publiczne | Nową wersję lokalną; hosting po osobnym wdrożeniu |

Nie ma automatycznego zapisywania każdego naciśnięcia klawisza.
Ostrzeżenie przed wyjściem nie jest kopią bezpieczeństwa.

## 8. Podgląd i porównanie

- **Otwórz podstronę** pokazuje zwykłą opublikowaną stronę, nie bieżący formularz.
- **Podgląd niezapisanych zmian** tworzy dialog z iframe i danymi formularza.
  Można przełączyć szerokość Komputer/Telefon. Nowe zdjęcie używa tymczasowego adresu lokalnego.
  Linki na zewnątrz podglądu i wysyłanie są blokowane; podgląd nie jest miejscem testowania wysyłki kontaktu.
- **Porównanie** zestawia opublikowane dane z aktualnym formularzem: przed zmianą i po zmianie.
  Działa także dla niezapisanych zmian i niczego nie zapisuje. Nie jest porównaniem pikselowym wyglądu strony.

Podgląd telefonu zmienia szerokość iframe; nie zastępuje testu dotyku, mobilnej przeglądarki i rzeczywistego urządzenia.

## 9. Zapis, publikacja i odrzucenie

1. Uzupełnij pola i otwórz podgląd.
2. Zapisz jako szkic. Poczekaj na potwierdzenie sukcesu; po błędzie nie zakładaj, że zapis nastąpił.
3. Porównaj treść z publiczną wersją.
4. Opublikuj zapisany szkic i potwierdź operację.

Publikacja jest blokowana, gdy formularz ma nowsze niezapisane zmiany albo nie ma zapisanego szkicu.
Po publikacji szkic znika, a poprzednia opublikowana zawartość może trafić do historii.
**Odrzuć szkic** usuwa zapisany szkic i niezapisane zmiany po potwierdzeniu; nie cofa wersji publicznej.

## 10. Historia wersji

Dla podstrony zachowywane jest do dziesięciu poprzednich wersji opublikowanych danych.
Historia nie jest rejestrem każdego naciśnięcia „Zapisz szkic”.
„Przywróć jako szkic” zastępuje bieżący szkic wskazaną wersją, lecz nie publikuje jej.
Najpierw ją sprawdź i dopiero potem opublikuj. Brak historii przed pierwszą zmianą publicznej treści jest prawidłowy.

## 11. API, pliki i ryzyka

`admin-pages.js` buduje formularz, `shared/page-content.cjs` i `shared/home.cjs` walidują dane.
`GET /api/pages/:page` odczytuje publikację; `/api/page-drafts/:page` obsługuje GET, PUT i DELETE;
podścieżki `/publish`, `/history`, `/restore` odpowiadają za publikację i historię.
Wszystkie operacje szkiców są prywatne. Istnieją również bezpośrednie endpointy PUT treści,
ale interfejs edytora korzysta z workflow szkicu.

Nie ma widocznego mechanizmu scalania równoczesnych zmian z dwóch kart. Unikaj równoległej edycji tej samej podstrony;
przed publikacją odśwież i porównaj dane. Zapis w panelu nie wykonuje commita, pusha ani wdrożenia.

## 12. Scenariusz kontrolny

Zmień tekst PL/EN i zdjęcie, przesuń element listy, usuń go i cofnij usunięcie.
Sprawdź podgląd, porównanie, zapis szkicu, restart serwera, publikację, historię i przywrócenie jako szkic.
Powtórz z niepoprawnym linkiem i przekroczonym limitem listy. Publiczne dane nie powinny zmienić się przed publikacją.
