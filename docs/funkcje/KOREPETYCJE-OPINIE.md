# ⚙️ Pakiety korepetycji, rabaty, FAQ i opinie

[← Dokumentacja](../README.md) · [Spis funkcji](README.md) · [Podstrona Korepetycje](../podstrony/KOREPETYCJE.md)

## 1. Treści i stałe identyfikatory ofert

**Podstrony → Korepetycje** edytuje grupy treści i linki oraz cztery istniejące pakiety:
`start`, `single`, `regular`, `matura`.
Podpisy można zmieniać, ale nie dodaje się piątego identyfikatora samym formularzem.
Nazwy ofert przekazywane do kontaktu mają też odpowiadające pola w edytorze Kontaktu;
po przemianowaniu pakietu sprawdź spójność obu miejsc.

## 2. Plakietki rabatu

Dla każdej oferty jest przełącznik „Pokazuj plakietkę rabatu” i tekst PL/EN do 100 znaków.
Włączenie wymaga uzupełnionego tekstu. Wyłączenie nie usuwa karty pakietu, tylko plakietkę.
Treść rabatu jest informacyjna: strona nie liczy ceny końcowej, nie realizuje płatności i nie prowadzi koszyka.
Identyczna odpowiedź API nie powinna ponownie przebudowywać odznak.

## 3. FAQ

Można dodać do 20 pytań, przesuwać je, ukrywać i usuwać z formularza.
Pytanie ma do 300 znaków, odpowiedź do 3000, obie wersje PL/EN.
Usunięcie przed zapisem można cofnąć z poziomu formularza.
Po publikacji wyświetlane są widoczne pytania w zapisanej kolejności.
Kliknięcie pytania rozwija odpowiedź; nie jest wymagane zamknięcie pozostałych pytań.

Rabaty, FAQ i grupy treści podstrony zapisują się razem jako szkic `knowledge` i wymagają publikacji.
Nie myl tej ścieżki z bezpośrednim zapisem opinii.

## 4. Baza opinii

Otwórz **Bazy danych → Opinie**. Wypełnij podpis autora, treść, kontekst zajęć i ocenę.
Opcjonalnie podaj tekst i kontekst po angielsku.
Publikuj tylko uzgodnione opinie; panel nie jest formularzem zgód ani narzędziem ich zbierania.

| Pole | Limit / reguła |
| --- | --- |
| Podpis | Wymagany, do 100 znaków |
| Treść | Wymagana, do 2000 znaków |
| Kontekst | Do 160 znaków |
| Treść EN | Do 2000 znaków |
| Kontekst EN | Do 160 znaków |
| Ocena | 0–5, krok 0,5 |
| Liczba rekordów | Do 500 |

„Zapisz opinię” zapisuje od razu w bazie i aktualizuje eksport; nie wymaga publikacji szkicu korepetycji.
„Nowa / anuluj edycję” resetuje formularz. Niezapisane zmiany są objęte ostrzeżeniem.

## 5. Widoczność i archiwum opinii

Widoczność i archiwizacja to osobne ustawienia. Publiczna lista wymaga opinii widocznej i niearchiwalnej.
Archiwizacja zachowuje rekord i nie jest tym samym co kosz fotografii lub kosz wiadomości.
Przywrócenie z archiwum nie powinno być mylone z przywróceniem całej kopii bazy.
Interfejs zarządzania opiniami nie oferuje takiej samej ścieżki trwałego usuwania jak zdjęcia i projekty.

## 6. Wyświetlanie publiczne

Widok pokazuje ocenę liczbową i gwiazdki, cytat, autora i kontekst.
Przycisk zmiany jest dostępny przy co najmniej dwóch opiniach. Licznik pokazuje bieżącą pozycję.
Brak opinii uruchamia stan pusty. Jeśli EN nie jest uzupełnione, widok wykorzystuje tekst polski.
Animacja zmiany respektuje ograniczenie ruchu. Zmiana języka odświeża treść.
Opinie nie przesuwają się same w nieskończonej automatycznej karuzeli.

## 7. Pozostałe opcje korepetycji

Zapowiedź kursu może mieć link widoczny, lecz nieaktywny („SOON”), jeśli tak przewiduje schemat.
Ilustracja matematyczna jest dekoracją: funkcja kwadratowa, sinus i funkcja odwrotna.
Nie jest kalkulatorem ucznia. Timery i rysowanie zatrzymują się przy ukrytej sekcji, karcie i ograniczonym ruchu.
Przyciski ofert rozpoczynają kreator zapytania, nie rezerwują zajęć.

## 8. Pliki i kontrola

`admin-pages.js`, `admin-reviews.js`, `tutoring-offers.js`, `tutoring-reviews.js`, `tutoring.js`,
`shared/page-content.cjs`. API: `/api/pages/knowledge`, `/api/page-drafts/knowledge`, `/api/reviews` i `/api/reviews/:id`.
Publiczne opinie, FAQ i oferty trafiają do `pages-data.js` oraz `pages-data-knowledge.js`, który ładuje podstrona Korepetycje.
Testuj rabat włączony/wyłączony, brak EN, limit FAQ, ocenę 4,5, ukrytą i archiwalną opinię,
stan z zerem/jedną/wieloma opiniami i przejście z każdego pakietu do kontaktu.
