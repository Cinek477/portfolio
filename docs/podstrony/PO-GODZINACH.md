# 📄 Po godzinach

[← Dokumentacja](../README.md) · [Spis podstron](README.md) · [Galeria i albumy](../funkcje/GALERIA-ALBUMY.md) · [Spotify](../funkcje/SPOTIFY.md)

## Adres i zawartość

`/po-godzinach`, źródło `pages/hobby.html`.
Zawiera wprowadzenie autora, fotografię, galerię z kategoriami, oferty współpracy fotograficznej,
opis przebiegu współpracy i sekcję muzyczną.

## Galeria i współpraca

Filtry wybierają wszystkie zdjęcia lub jedną z kategorii: koncerty, natura, ludzie, miejsca.
Kliknięcie zdjęcia otwiera dialog z fotografią, metadanymi i nawigacją.
Z dialogu można przejść do albumu i skopiować jego adres. Nawigacja to strzałki, klawiatura, licznik i pasek małych miniatur (na komputerze, przy dowolnej liczbie zdjęć: przewija się w bok, bieżąca miniatura stoi na środku, miniatury ładują się leniwie). Po zmianie zdjęcia fokus zostaje na tym samym przycisku lub miniaturze. Tło okna ma trzy plamy w kolorze poświaty zdjęcia (`glowColor`) na stałym ciemnym tle, więc kontrast tekstu nie zależy od zdjęcia; w tym kolorze są też etykiety, bieżąca miniatura i cień głównego przycisku. Treść kolumny zawsze stoi od góry: etykieta, tytuł, miejsce, opis.
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

## Układ galerii na komputerze

Pasek ma dwa rzędy. Gdy liczba zwykłych kadrów (ani `tall`, ani `wide`) jest nieparzysta, `gallery.js` rozciąga ostatni z nich na oba rzędy, żeby pod nim nie zostawało puste pole. Kształt zapisany w panelu się nie zmienia.

## Podgląd zdjęcia — informacje

Nad tytułem stoją znaczniki z ikonami: kategoria (w kolorze zdjęcia), miejsce (przy koncertach „obiekt, miasto”) i data; każdy ma ukrytą etykietę dla czytników ekranu. Pod nazwiskiem artysty jest nazwa wydarzenia. Na komputerze przyciski albumu stoją tuż nad paskiem miniatur, a na lewym marginesie okna (pionowo, pod strzałką „wstecz”) biegnie konturowy znak wodny z nazwiskiem artysty (albo tytułem zdjęcia). Na telefonie zdjęcie jest u góry, a opis w dolnym panelu z uchwytem; stuknięcie uchwytu albo przesunięcie panelu w dół chowa opis (zdjęcie dostaje cały ekran, na dole zostaje tytuł ze strzałką w górę), przesunięcie w górę lub stuknięcie przywraca go. Zdjęcia zmienia się przesunięciem palcem w bok (zdjęcie jedzie za palcem); to samo działa na komputerze z ekranem dotykowym, a mysz i klawiatura dalej używają strzałek. Na telefonie strzałki są schowane wizualnie (zostają dla klawiatury i czytników ekranu), pod panelem zostaje licznik.
