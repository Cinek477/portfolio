# 📄 Korepetycje

[← Dokumentacja](../README.md) · [Spis podstron](README.md) · [Pakiety, rabaty, FAQ i opinie](../funkcje/KOREPETYCJE-OPINIE.md)

## Adres i sekcje

`/korepetycje`, źródło `pages/knowledge.html`.
Strona przedstawia podejście do matematyki, zakres pomocy, sposób prowadzenia zajęć,
czas i terminy, informację o cenie, pakiety, opinie oraz FAQ.
Ma też zapowiedź kursu i animowaną ilustrację wykresu.

## Interakcje

Przyciski pakietów kierują do kreatora kontaktowego z kontekstem zajęć.
Plakietka rabatu jest wyświetlana tylko po włączeniu i podaniu tekstu.
FAQ to niezależnie rozwijane pytania. Opinie zmienia się przyciskiem; nie jest to formularz publicznego dodawania recenzji.
Wykres pokazuje funkcję kwadratową, sinus i funkcję odwrotną; zatrzymuje animację poza widokiem.

## Edycja

**Podstrony → Korepetycje** zawiera grupy tekstów i linków, cztery plakietki rabatów oraz listę FAQ.
Nazwy i opisy pakietów są treścią CMS; identyfikatory czterech pakietów są stałe.
**Bazy danych → Opinie** jest właściwym miejscem edycji autorów, treści i ocen.
Sekcja opinii w edytorze podstrony nie zastępuje tej bazy.
Włączanie niektórych linków ma odrębne znaczenie od ich widoczności: nieaktywny link może pokazywać stan „SOON”.

## Dane i pliki

`tutoring.js`: wykres; `tutoring-offers.js`: rabaty i FAQ; `tutoring-reviews.js`: opinie;
`content-editor.js`: pozostałe treści. API: `/api/pages/knowledge`, `/api/reviews`.
Eksport: `pages-data.js`. Style: `portfolio.css` i wspólne kontrolki.

## Ograniczenia i kontrola

Nie ma płatności online, automatycznego grafiku ani potwierdzenia rezerwacji.
Kliknięcie pakietu rozpoczyna zapytanie, nie zakup.
Sprawdź cztery pakiety, aktywny/nieaktywny link kursu, rabaty w obu językach, FAQ, brak opinii,
oceny połówkowe i kontekst oferty w kontakcie.
