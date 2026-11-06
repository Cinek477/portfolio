# Album otwierany z linku

[Spis podstron](README.md) · [Obsługa galerii i albumów](../funkcje/GALERIA-ALBUMY.md)

## Adres i model danych

Adres `/album/:id` wykorzystuje `pages/hobby.html`, nie osobny szablon albumu.
Identyfikator wskazuje zdjęcie przypisane do albumu. Alternatywą jest parametr `?album=:id`.
Album jest grupą zdjęć o tej samej znormalizowanej nazwie, a nie osobnym rekordem z własnym identyfikatorem.
Porównanie nazw pomija skrajne spacje, uwzględnia normalizację znaków i ignoruje wielkość liter.

## Otwieranie i nawigacja

Po wejściu strona wyszukuje wskazane widoczne zdjęcie i otwiera jego album w dialogu.
Okładka ma pierwszeństwo w kolejności. Strzałki poruszają się po kolekcji albumu,
również po zdjęciach niewystawionych w głównej galerii.
„Wróć do wszystkich zdjęć” przełącza kolekcję z albumu na aktualną galerię.
Nie oznacza przejścia do osobnej podstrony listy albumów.

## Udostępnianie i niedostępność

Przycisk kopiuje link do schowka. Jeśli schowek jest niedostępny, wyświetla zaznaczalne pole z adresem.
Usunięcie lub ukrycie zdjęcia wskazywanego przez link może go unieważnić, nawet jeśli inne zdjęcia albumu nadal istnieją.
W takim przypadku pojawia się informacja o niedostępnym albumie i możliwość oglądania pozostałych zdjęć.

## Edycja, eksport i kontrola

Nazwę albumu, przypisania i okładkę zmienia się w galerii panelu.
Zmiana nazwy jednego zdjęcia nie jest automatycznym przemianowaniem wszystkich zdjęć tej grupy.
Pages tworzy katalogowe adresy albumów na podstawie publicznych danych w chwili eksportu.
Lokalny serwer generuje metadane udostępniania dla albumu; eksport statyczny nie uruchamia lokalnego generatora metadanych.
Sprawdź link po przeniesieniu, ukryciu i usunięciu zdjęcia, a także zachowanie albumu z jednym kadrem.
