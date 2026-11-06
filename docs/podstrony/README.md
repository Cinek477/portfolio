# Podstrony

Dokumentacja jest rozpisana na osobne rozdziały, nie tylko na listę adresów.
Każdy rozdział opisuje zawartość, interakcje, zakres edycji, ograniczenia i weryfikację.

## Rozdziały

1. [Start](START.md)
2. [O mnie](O-MNIE.md)
3. [Projekty i osiągnięcia](PROJEKTY.md)
4. [Szczegóły pojedynczego projektu](SZCZEGOLY-PROJEKTU.md)
5. [Korepetycje](KOREPETYCJE.md)
6. [Po godzinach](PO-GODZINACH.md)
7. [Album otwierany z linku](ALBUM.md)
8. [Kontakt](KONTAKT.md)
9. [Panel administratora](ADMIN.md)
10. [Strona błędu 404](404.md)

Szczegółowe instrukcje poszczególnych mechanizmów znajdują się w [dokumentacji funkcji](../funkcje/README.md).
Opisujemy stan zaimplementowany w kodzie; obecność zakładki w panelu nie oznacza, że wszystkie jej opcje są już dostępne.

| Widok | Adres lokalny | Źródło | Działanie |
| --- | --- | --- | --- |
| Start | `/` | `pages/index.html` | Wizytówka, wyróżnione projekty, skróty do sekcji, aktualna aktywność |
| O mnie | `/o-mnie` | `pages/about.html` | Zdjęcie, opis, kompetencje, edukacja i doświadczenie, CV |
| Projekty | `/projekty` | `pages/projects.html` | Osiągnięcia i projekty, rozwijane szczegóły, repozytoria i demo |
| Opis projektu | `/projekty/:slug` | `pages/project.html` | Problem, rozwiązanie, wkład, rezultat, technologie i powiązane realizacje |
| Korepetycje | `/korepetycje` | `pages/knowledge.html` | Pakiety, promocje, opinie, FAQ i animowany wykres |
| Po godzinach | `/po-godzinach` | `pages/hobby.html` | Galeria, filtry, albumy, podgląd zdjęć i Spotify |
| Album | `/album/:id` | `pages/hobby.html` | Galeria z od razu otwartym albumem zdjęcia wskazanego przez identyfikator |
| Kontakt | `/kontakt` | `pages/contact.html` | Kreator zapytania zależny od tematu i linki kontaktowe |
| Panel | `/admin` | `pages/admin.html` | Prywatna edycja treści, plików i skrzynki po zalogowaniu |
| Nie znaleziono | nieznany adres | `pages/404.html` | Informacja o błędzie i powrót na start |

Przykładowe opisy projektów: `/projekty/swoja-droga`, `/projekty/krakhack`.
Aliasami zarządza `shared/pretty-routes.cjs`. Stare adresy HTML przekierowują na adresy lokalne.
Eksport Pages tworzy osobne katalogi z `index.html`; uwzględnia prefiks repozytorium.

## Wspólne elementy

Znaczniki `<!-- component:navbar -->`, `<!-- component:footer -->` i
`<!-- component:contact-fab -->` są zastępowane przez `shared/render-page.cjs`.
Stopkę zmieniaj w `components/footer.html`, nie w każdej podstronie.
Kontakt nie ma pływającego skrótu do samego siebie; 404 nie ma stopki.

Każdy moduł publiczny rejestruje inicjalizator w `window.portfolioPages`.
Router wymienia `main`, stopkę, skrót kontaktowy i dialog galerii, bez przeładowania wspólnego menu.
Skrypty danej podstrony są uruchamiane ponownie; ich zasoby trzeba zwalniać przy wyjściu.

Nie otwieraj źródłowego HTML jako głównego podglądu przez `file://`: wspólne fragmenty składa serwer lub eksporter.
