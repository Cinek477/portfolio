# Po godzinach

[Spis podstron](README.md) · [Galeria i albumy](../funkcje/GALERIA-ALBUMY.md) · [Spotify](../funkcje/SPOTIFY.md)

## Adres i zawartość

`/po-godzinach`, źródło `pages/hobby.html`.
Zawiera wprowadzenie autora, fotografię, galerię z kategoriami, oferty współpracy fotograficznej,
opis przebiegu współpracy i sekcję muzyczną.

## Galeria i współpraca

Filtry wybierają wszystkie zdjęcia lub jedną z kategorii: koncerty, natura, ludzie, miejsca.
Kliknięcie zdjęcia otwiera dialog z fotografią, metadanymi i nawigacją.
Z dialogu można przejść do albumu, skopiować jego adres i przełączyć „Samo zdjęcie”.
Linki ofert fotograficznych kierują do kontaktu z kontekstem współpracy płatnej lub akredytacji.
Nie oznaczają automatycznego przyjęcia zlecenia.

## Sekcja muzyczna

Opcjonalnie pokazuje bieżący utwór i do pięciu najczęściej słuchanych nagrań.
Kliknięcia prowadzą do Spotify; strona nie odtwarza muzyki.
Obrót winyla jest dekoracją, a nie odtwarzaczem ani obracającą się okładką.

## Rzeczywisty zakres edycji

Zakładka **Podstrony → Po godzinach** obecnie umożliwia tylko otwarcie podglądu.
Nie ma obsługi pełnej edycji tekstów, szkiców ani publikacji tej podstrony.
Zdjęcia, opisy, albumy i kadrowanie edytuje się w **Bazy danych → Galeria zdjęć**;
połączenie muzyczne w **Spotify**. Wprowadzenie, oferty i opis współpracy zmienia się w HTML.

## Pliki, ograniczenia i kontrola

Skrypty: `gallery.js`, `lightbox.js`, `photo-loader.js`, `spotify.js`, `gallery-data.js`.
Style: `hobby.css`, `lightbox.css`, `collaboration.css` i style wspólne.
Na Pages galeria korzysta z eksportu; funkcja Spotify na żywo jest wyłączona.
Sprawdź filtry, skrajne proporcje fotografii, telefon, szybkie przełączanie zdjęć,
link do albumu i powrót do wszystkich zdjęć. Instrukcje szczegółowe są w dokumentacji galerii.
