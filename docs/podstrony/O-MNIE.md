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
