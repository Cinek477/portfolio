# ⚙️ Zarządzanie projektami i osiągnięciami

[← Dokumentacja](../README.md) · [Spis funkcji](README.md) · [Lista projektów](../podstrony/PROJEKTY.md) · [Szczegóły realizacji](../podstrony/SZCZEGOLY-PROJEKTU.md)

## 1. Lista i wybór rodzaju

W **Bazy danych** wybierz Projekty albo Osiągnięcia.
Oba widoki korzystają z tabeli `projects`, ale filtrują pole `section`.
Karta w panelu pokazuje miniaturę, tytuł, rok i widoczność oraz akcje Edytuj, Pokaż/Ukryj i Usuń.
Wyszukiwanie obejmuje tytuły, opisy, technologie, rok i opis realizacji, w tym teksty PL/EN.
Przejście między rodzajami resetuje formularz i frazę wyszukiwania.

## 2. Dodawanie i edycja pól

1. Wybierz właściwy rodzaj realizacji.
2. Uzupełnij tytuł, rok, podsumowanie i opcjonalny pełny opis.
3. Wpisz technologie, symbol, link i ewentualnie dodaj ilustrację.
4. Uzupełnij EN lub pozostaw pola, które mają odziedziczyć PL.
5. Opcjonalnie włącz szczegółową podstronę i jej opowieść.
6. Zapisz i sprawdź listę publiczną oraz Start, jeśli rekord jest wyróżniony.

| Pole | Zasada |
| --- | --- |
| Tytuł PL/EN | Do 500 znaków; tytuł PL jest wymagany |
| Krótki opis PL/EN | Do 500 znaków |
| Pełny opis PL/EN | Do 5000 znaków |
| Rok | Liczba całkowita 1900–2100 |
| Technologie | Tekst do 500 znaków; na stronie szczegółów rozdzielany przecinkami |
| Symbol | Do 20 znaków; dla wybranych symboli widok stosuje własny zastępnik |
| Link | Do 2000 znaków; HTTP/HTTPS lub ograniczone obsługiwane odnośniki lokalne |
| Widoczność | Ukryty rekord pozostaje w bazie, ale nie jest prezentowany publicznie |

Zapis tej bazy jest bezpośredni, a nie szkicem. Niezapisany formularz ma ostrzeżenie przed porzuceniem.
Ukrywanie z listy jest osobnym szybkim zapisem.

## 3. Ilustracja i miniatura

Nowy plik przechodzi przez ten sam mechanizm przygotowania obrazów co zdjęcia galerii.
Można go dodać lub wymienić w trakcie edycji rekordu. „Usuń obecne zdjęcie” usuwa powiązanie z obrazem,
niekoniecznie sam plik z magazynu. Wybranie nowego pliku odznacza usuwanie.
Brak własnego obrazu może uruchomić domyślną ilustrację dla znanego identyfikatora projektu.
Nie ma automatycznego generowania ilustracji dla każdego nowego wpisu.

## 4. Szczegółowy opis realizacji

Przełącznik „Włącz podstronę i link Poznaj projekt” aktywuje `caseStudy.enabled`.
Uzupełnij nazwę realizacji PL/EN oraz pola: Problem / dla kogo, Rozwiązanie / jak działa,
Mój wkład i Efekt / wynik. Nazwa ma limit 500, pozostałe pola 5000 znaków.
Przy włączonej podstronie jej tytuł jest wymagany. Puste fragmenty opowieści są pomijane publicznie.
Wyłączenie opisu usuwa możliwość jego publicznego otwarcia, ale nie musi usuwać samych zapisanych tekstów.

## 5. Demo i treści zapisane w kodzie

Backend i widok obsługują `demoUrl`, lecz obecny formularz projektów nie udostępnia osobnego pola jego edycji.
Niektóre schematy wyjaśniające istniejące realizacje, ikony technologii i mapowanie ilustracji są zapisane w `project-detail.js`
lub `projects.js`. „Full edit” nie obejmuje automatycznej zmiany tych schematów.

## 6. Relacja ze Startem i treściami podstrony

Wyróżnienie na Starcie przechowuje identyfikator, nie kopię rekordu. Zmiana tytułu lub ilustracji realizacji
wpływa także na jej kartę na Starcie. Ukryta realizacja nie pojawia się tam mimo zapisanego wyboru.
Nagłówki i opisy otaczające listę zmieniasz w **Podstrony → Projekty**, z workflow szkicu i publikacji.

## 7. Usuwanie

„Usuń…” otwiera wybór kosza lub trwałego usunięcia po potwierdzeniu.
Kosz zachowuje dane i poprzednią widoczność; przywracanie nie nadpisuje istniejącego rekordu o tym samym ID.
Trwałe usunięcie wpisu nie kasuje automatycznie jego pliku zdjęcia.
Szczegóły są w [koszu i kopiach](KOPIE-KOSZ.md).

## 8. API, eksport i kontrola

`admin-projects.js`, `shared/normalize.cjs`, `projects.js`, `project-detail.js`.
API: GET/POST `/api/projects`, PUT/DELETE `/api/projects/:id`.
Publiczny eksport: `projects-data.js`; pliki obrazów: `assets/images/projects/`.
Sprawdź oba rodzaje rekordów, wyszukiwanie, widoczność, długi tytuł, zdjęcie i jego usunięcie,
opis realizacji, puste sekcje, linki, EN i wpływ na wyróżnienia Startu.
