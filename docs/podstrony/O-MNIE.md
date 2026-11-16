# 📄 O mnie

[← Dokumentacja](../README.md) · [Spis podstron](README.md) · [Pełna edycja](../funkcje/ADMIN-FULL-EDIT.md)

## Adres i cel

`/o-mnie`, źródło `pages/about.html`. Rozbudowana wizytówka: przedstawienie autora, edukacja,
działalność, doświadczenie, kompetencje, narzędzia i języki.

## Zawartość i zachowanie

Strona łączy portret, powitanie i akapity z sekcjami CV. Sekcja z wpisami jest renderowana jako oś czasu:
okres, nazwa lub funkcja i opis. Zwykła sekcja bez wpisów otrzymuje tytuł i tekst.
Sekcja o polskim tytule „Kompetencje”, bez wpisów osi czasu, ma specjalny układ grup umiejętności.
Jej treść jest rozdzielana pustymi liniami na grupy, a pierwsza linia każdej grupy staje się nagłówkiem.
Pozostałe linie tworzą listę. Zmiana tego tytułu może więc zmienić sposób renderowania sekcji.

## Co można edytować

**Podstrony → O mnie** umożliwia zmianę nagłówka i wyróżnienia, do ośmiu akapitów,
zdjęcia, alt, widoczności zdjęcia, kapsułek, przycisków i sekcji CV.
Sekcje i wpisy można dodawać, usuwać, przywracać przed zapisem oraz przesuwać strzałkami.
Dozwolone jest do 12 sekcji i do 20 wpisów osi czasu w sekcji.
Niewidoczna sekcja pozostaje w danych, lecz nie jest renderowana publicznie.

## Przykładowa aktualizacja doświadczenia

1. Otwórz edytor „O mnie” i „Sekcje CV”.
2. W sekcji doświadczenia dodaj wpis: nazwa, okres i opis PL/EN.
3. Ustaw kolejność i sprawdź widoczność sekcji.
4. Otwórz podgląd komputerowy i telefoniczny, następnie zapisz szkic.
5. Porównaj z wersją publiczną i opublikuj szkic.

## Pliki i dane

`page-content.js` buduje biografię i sekcje, `content-editor.js` obsługuje przypisane pola CMS.
Dane odczytuje `GET /api/pages/about`; eksport znajduje się w `pages-data.js`.
Szkic obsługuje `/api/page-drafts/about`. Style podstrony są w `portfolio.css`.
Podmiana zdjęcia korzysta ze wspólnego przygotowania obrazów, ale podmiana treści PDF CV jest osobną zmianą pliku.

## Co sprawdzić

Długie opisy i daty, kolejność osi czasu, format grup kompetencji, oba języki,
brak pustych widocznych sekcji, proporcje zdjęcia oraz działanie przycisku CV.

## Zakończenie strony

Pod sekcjami stoi stały blok `.about-next` z przyciskami „Zobacz projekty” i „Napisz do mnie”. Jest wpisany w `pages/about.html` i nie ma pól w panelu.
Kompetencje to karty w układzie bento: przy pięciu grupach w kolejności z panelu (Programowanie, Grafika, Organizacja, Narzędzia, Języki) pierwsza i trzecia zajmują dwa rzędy po bokach, a ostatnia jest szerokim paskiem pod środkiem. Przy innej liczbie grup siatka układa się sama w trzy kolumny. Na tablecie dwie kolumny, na telefonie jedna.
Grupa „Języki”/„Languages” z wpisami „Nazwa — poziom” dostaje paski poziomu (`ojczysty`/`native` = pełny, A1–C2 = 1/6–6/6). Inny format zostaje zwykłą listą. W `pages/about.html` ta grupa jest od razu zapisana jako `.about-skill-languages` z `.about-skill-meters` (ta sama struktura, którą tworzy `page-content.js`), więc przy ładowaniu nic nie przeskakuje.
Tagi i „Pobierz CV” stoją w `.about-story` pod akapitami; `page-content.js` wstawia akapity z panelu przed nimi.
Zdjęcie ma warianty `marcin-about-400.webp` i `marcin-about-800.webp` (kwadrat w ramce bez przechylenia, z zaokrągleniem 28 px — inaczej niż przechylony portret na Starcie) w `srcset`. Po podmianie zdjęcia w panelu skrypt usuwa `srcset` i ładuje nowy plik; warianty trzeba wtedy przygotować ponownie.
