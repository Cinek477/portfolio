# Szczegóły pojedynczego projektu

[Spis podstron](README.md) · [Edycja projektów](../funkcje/PROJEKTY.md)

## Adresowanie

Wspólny szablon: `pages/project.html`. Lokalny adres to `/projekty/:slug`.
`achievements-1` ma alias `swoja-droga`, a `achievements-0` alias `krakhack`.
Pozostałe identyfikatory mogą pełnić funkcję sluga. Dawny `project.html?id=...` przekierowuje na adres opisowy.

## Warunek wyświetlenia

Rekord musi istnieć, być widoczny i mieć `caseStudy.enabled: true`.
W innym przypadku strona pokazuje „Projekt niedostępny” i ukrywa sekcje realizacji.
Ten stan aplikacji nie jest tożsamy ze stroną HTTP 404; szablon może zostać zwrócony poprawnie, choć rekord jest niedostępny.

## Sekcje opisu

- Nazwa realizacji i podsumowanie.
- Wyróżnienie wyniku dla osiągnięć.
- Dla wybranych istniejących realizacji: schemat wyjaśniający pomysł i przepływ działania.
- Okładka, gdy rekord ma obraz.
- Problem i odbiorcy, rozwiązanie, osobisty wkład, rezultat.
- Technologie rozdzielone przecinkami, renderowane jako osobne kafelki.
- Repozytorium, demo i — dla rozpoznanego linku YouTube — osadzenie wideo.
- Do dwóch innych dostępnych realizacji; priorytet mają wpisy z tej samej sekcji.

Puste pola opowieści są ukrywane. Schematy konkretnych realizacji i mapowanie ikon technologii są częściowo zapisane w kodzie,
nie w ogólnym edytorze podstron.

## Edycja i ograniczenia

Otwórz rekord w **Bazy danych → Projekty / Osiągnięcia**, włącz podstronę i uzupełnij jej pola PL/EN.
Jest to zapis rekordu, a nie mechanizm szkiców strony Start.
Obecny formularz nie udostępnia osobnego pola `demoUrl`, mimo że backend i widok potrafią je obsłużyć.
Nie należy opisywać tego jako dostępnego przycisku edycji w panelu.

## Pliki i weryfikacja

`project-detail.js`, `project-detail.css`, `projects-data.js`, API `/api/projects`, aliasy `shared/pretty-routes.cjs`.
Sprawdź link bezpośredni, ukryty rekord, wyłączony opis, brak okładki, tłumaczenia, demo,
powiązane realizacje i powrót do listy. Pages generuje adresy dla włączonych, publicznych opisów.
