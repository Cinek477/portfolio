# ⚙️ Katalog pól i grup CMS

[← Dokumentacja](../README.md) · [Spis funkcji](README.md) · [Instrukcja pełnej edycji](ADMIN-FULL-EDIT.md)

Ten rozdział dokumentuje schemat `shared/page-defaults.json`, nie prywatne wartości z lokalnej bazy. Podpisy pokazane jako przykłady służą rozpoznaniu pola. Identyfikatory są kontraktem kodu; nie należy ich zmieniać przy zwykłej edycji tekstu. Po zmianie schematu zaktualizuj ten katalog.

## Pola strukturalne Start i O mnie

| Obszar | Klucze i znaczenie | Zakres |
| --- | --- | --- |
| Wstęp | `greeting`, `heading`, `accent`; Start także `bio` | PL/EN; tytuły, powitanie i opis |
| Zdjęcie | `photo.src`, `thumbUrl`, `visible`, `alt` | Źródła plików zachowuje backend; formularz umożliwia upload, widoczność i alt |
| Akapity | `paragraphs[]` | Do 8; edytor listy na O mnie |
| Kapsułki | `tags[]` | Do 12 par PL/EN |
| Przyciski | `buttons[].label`, `href`, `visible`, `download` | Do 4; etykieta, adres, widoczność i pobieranie |
| Sekcje CV | `sections[].title`, `body`, `visible`, `entries` | Do 12; edytowane na O mnie |
| Oś czasu | `entries[].title`, `date`, `body` | Do 20 wpisów w sekcji |
| Teraz tworzę | `currentWork.visible`, `title`, `text` | Start; ustawienie w modelu `home` |
| Wyróżnienia | `featured[]` | Start; do 3 różnych identyfikatorów projektów |

## Start (`home`)

### Dodatkowe teksty

| Identyfikator | Rozpoznanie pola / adres domyślny |
| --- | --- |
| `extra-0` | Wybrane realizacje |
| `extra-1` | Projekty i osiągnięcia |
| `extra-2` | Wszystkie projekty |
| `extra-3` | Poznaj mnie |
| `extra-4` | Co Cię interesuje? |
| `extra-5` | Projekty i kod |
| `extra-6` | Projekty |
| `extra-7` | Hackathony, programowanie i bazy danych. |
| `extra-8` | Zobacz projekty |
| `extra-9` | Matematyka |
| `extra-10` | Korepetycje |
| `extra-11` | Informacje o nauce i kontakt w sprawie zajęć. |
| `extra-12` | Poznaj ofertę |
| `extra-13` | Poza ekranem |
| `extra-14` | Po godzinach |
| `extra-15` | Fotografia, rower i rzeczy, które robię poza kodowaniem. |
| `extra-16` | Zajrzyj do galerii |
| `extra-17` | O mnie |
| `extra-18` | Poznaj mnie bliżej. |
| `extra-19` | Doświadczenie, edukacja i kompetencje w jednym miejscu. |
| `extra-20` | Przejdź do O mnie |

### Dodatkowe linki

| Identyfikator | Rozpoznanie pola / adres domyślny |
| --- | --- |
| `link-0` | projects.html |
| `link-1` | projects.html |
| `link-2` | knowledge.html |
| `link-3` | hobby.html |
| `link-4` | about.html |

Ta podstrona nie ma dodatkowych zdefiniowanych grup `editor.groups` w domyślnym schemacie; główna edycja korzysta z pól strukturalnych powyżej.

## O mnie (`about`)

Ta podstrona nie ma dodatkowych zdefiniowanych grup `editor.groups` w domyślnym schemacie; główna edycja korzysta z pól strukturalnych powyżej.

## Projekty (`projects`)

### Wstęp — `group-0`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-0-text-0` | Portfolio / Realizacje | Tekst PL/EN |
| `group-0-text-1` | Projekty | Tekst PL/EN |
| `group-0-text-2` | Hackathony, kompetencje i aktualne projekty — poznaj szczegóły mojej p | Tekst PL/EN |
| `group-0-text-3` | Osiągnięcia | Tekst PL/EN |
| `group-0-text-4` | Aktualne projekty | Tekst PL/EN |

| Identyfikator linku | Podpis | Adres domyślny | Dodatkowe opcje |
| --- | --- | --- | --- |
| `group-0-link-0` | Osiągnięcia | `#achievements` | Widoczność |
| `group-0-link-1` | Aktualne projekty | `#projects` | Widoczność |

### Doświadczenie — `group-1`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-1-text-0` | Doświadczenie | Tekst PL/EN |
| `group-1-text-1` | Projekty i kompetencje | Tekst PL/EN |
| `group-1-text-2` | Najedź lub dotknij, aby poznać szczegóły | Tekst PL/EN |

### W trakcie — `group-2`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-2-text-0` | W trakcie | Tekst PL/EN |
| `group-2-text-1` | Aktualne projekty | Tekst PL/EN |
| `group-2-text-2` | Od pomysłu do działającego rozwiązania | Tekst PL/EN |

## Korepetycje (`knowledge`)

### Wstęp i kapsułki — `group-0`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-0-text-0` | Matematyka — korepetycje | Tekst PL/EN |
| `group-0-text-1` | Mniej  | Tekst PL/EN |
| `group-0-text-2` | stresu | Tekst PL/EN |
| `group-0-text-3` | Więcej  | Tekst PL/EN |
| `group-0-text-4` | zrozumienia | Tekst PL/EN |
| `group-0-text-5` | Matematyka w Twoim tempie. Na maturę, sprawdzian albo po prostu po to, | Tekst PL/EN |
| `group-0-text-6` | Online | Tekst PL/EN |
| `group-0-text-7` | W Twoim tempie | Tekst PL/EN |
| `group-0-text-8` | Jednorazowo lub regularnie | Tekst PL/EN |
| `group-0-text-9` | Poznaj ofertę | Tekst PL/EN |
| `group-0-text-10` | Krok po kroku. Aż zaskoczy. | Tekst PL/EN |

| Identyfikator linku | Podpis | Adres domyślny | Dodatkowe opcje |
| --- | --- | --- | --- |
| `group-0-link-0` | #tutoring-scope | `#tutoring-scope` | Widoczność |

### Zapowiedź kursu — `group-1`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-1-text-0` | W przygotowaniu | Tekst PL/EN |
| `group-1-text-1` | Kurs maturalny. Matematyka podstawowa. | Tekst PL/EN |
| `group-1-text-2` | Pracuję nad kursem przygotowującym do matury na poziomie podstawowym.  | Tekst PL/EN |
| `group-1-text-3` | Zobacz dostępne materiały | Tekst PL/EN |

| Identyfikator linku | Podpis | Adres domyślny | Dodatkowe opcje |
| --- | --- | --- | --- |
| `group-1-link-0` | Dostępne materiały kursu | `knowledge.html#course-title` | Widoczność, aktywność (SOON) |

### W czym mogę pomóc? — `group-2`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-2-text-0` | W czym mogę pomóc? | Tekst PL/EN |
| `group-2-text-1` | Matura podstawowa | Tekst PL/EN |
| `group-2-text-2` | Uporządkuj podstawy i przećwicz zadania maturalne — krok po kroku, z c | Tekst PL/EN |
| `group-2-text-3` | Matura rozszerzona | Tekst PL/EN |
| `group-2-text-4` | Pracuj nad trudniejszymi zadaniami, sposobem rozumowania i doborem met | Tekst PL/EN |
| `group-2-text-5` | Bieżąca nauka | Tekst PL/EN |
| `group-2-text-6` | Nadrób zaległości lub przygotuj się do sprawdzianu i kartkówki z konkr | Tekst PL/EN |

### Przebieg zajęć — `group-3`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-3-text-0` | Jak wyglądają zajęcia? | Tekst PL/EN |
| `group-3-text-1` | Powiedz, czego potrzebujesz | Tekst PL/EN |
| `group-3-text-2` | Napisz, na jakim jesteś poziomie i co sprawia Ci trudność. Możesz prze | Tekst PL/EN |
| `group-3-text-3` | Ustalamy sposób pracy | Tekst PL/EN |
| `group-3-text-4` | Dobieramy zakres materiału i formę zajęć. Korzystam z własnych opracow | Tekst PL/EN |
| `group-3-text-5` | Rozwiązujemy i rozumiemy | Tekst PL/EN |
| `group-3-text-6` | Tłumaczę, wspólnie przechodzimy przez zadania i wracamy do tego, co wy | Tekst PL/EN |

### Czas, terminy i cena — `group-4`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-4-text-0` | Zajęcia dopasowane do Twojego planu | Tekst PL/EN |
| `group-4-text-1` | Ile trwają zajęcia? | Tekst PL/EN |
| `group-4-text-2` | Czas pojedynczego spotkania ustalamy indywidualnie — w zależności od z | Tekst PL/EN |
| `group-4-text-3` | Kiedy odbywają się zajęcia? | Tekst PL/EN |
| `group-4-text-4` | Terminy spotkań ustalamy indywidualnie, dopasowując je do naszej wspól | Tekst PL/EN |
| `group-4-text-5` | Jaka jest cena? | Tekst PL/EN |
| `group-4-text-6` | Cenę ustalamy indywidualnie. Zależy od: | Tekst PL/EN |
| `group-4-text-7` | Terminu zajęć | Tekst PL/EN |
| `group-4-text-8` | Regularności spotkań | Tekst PL/EN |
| `group-4-text-9` | Poziomu — podstawowego lub rozszerzonego | Tekst PL/EN |
| `group-4-text-10` | Długości zajęć | Tekst PL/EN |

### Podejście do nauki — `group-5`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-5-text-0` | Podejście dopasowane do Ciebie | Tekst PL/EN |
| `group-5-text-1` | Udzielam korepetycji od 2021 roku. Przygotowywałem licealistów do matu | Tekst PL/EN |
| `group-5-text-2` | Napisz, z czym potrzebujesz pomocy — formę, termin i pozostałe szczegó | Tekst PL/EN |
| `group-5-text-3` | Zapytaj o zajęcia | Tekst PL/EN |

| Identyfikator linku | Podpis | Adres domyślny | Dodatkowe opcje |
| --- | --- | --- | --- |
| `group-5-link-0` | contact.html?category=tutoring&details=maths#contact-form | `contact.html?category=tutoring&details=maths#contact-form` | Widoczność |

### Opinia przykładowa — `group-6`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-6-text-0` | Głosy uczniów | Tekst PL/EN |
| `group-6-text-1` | Jak uczymy się razem? | Tekst PL/EN |
| `group-6-text-2` | 4,5 / 5 | Źródło: baza Opinie; formularz podstrony zachowuje wartość |
| `group-6-text-3` | Przykładowa opinia — podgląd | Źródło: baza Opinie; formularz podstrony zachowuje wartość |
| `group-6-text-4` | W końcu zrozumiałem zadania, które wcześniej wydawały się nie do przej | Źródło: baza Opinie; formularz podstrony zachowuje wartość |
| `group-6-text-5` | Przykładowy uczeń | Źródło: baza Opinie; formularz podstrony zachowuje wartość |
| `group-6-text-6` | Matematyka — matura podstawowa | Źródło: baza Opinie; formularz podstrony zachowuje wartość |

### Nagłówek pakietów — `group-7`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-7-text-0` | Wybierz sposób nauki | Tekst PL/EN |
| `group-7-text-1` | Przykładowe pakiety | Tekst PL/EN |
| `group-7-text-2` | To propozycje współpracy, nie sztywne pakiety godzin. Czas, częstotliw | Tekst PL/EN |

### Pakiet START — `group-8`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-8-text-0` | Poznajmy się na pierwszych zajęciach | Tekst PL/EN |
| `group-8-text-1` | Zobacz, jak możemy pracować razem — pierwsze spotkanie jest bezpłatne. | Tekst PL/EN |
| `group-8-text-2` | Przygotowanie do zajęć z wybranego przez Ciebie materiału | Tekst PL/EN |
| `group-8-text-3` | Lekcja pokazowa i wspólne rozwiązanie przykładowych zadań | Tekst PL/EN |
| `group-8-text-4` | Przedstawienie metod nauki i sposobu prowadzenia zajęć | Tekst PL/EN |
| `group-8-text-5` | Krótkie zapoznanie i rozmowa o Twoich potrzebach | Tekst PL/EN |
| `group-8-text-6` | Pierwsze zajęcia: 0 zł | Tekst PL/EN |
| `group-8-text-7` | Zapytaj o zajęcia START | Tekst PL/EN |

| Identyfikator linku | Podpis | Adres domyślny | Dodatkowe opcje |
| --- | --- | --- | --- |
| `group-8-link-0` | contact.html?category=tutoring&details=maths#contact-form | `contact.html?category=tutoring&details=maths&package=start#contact-form` | Widoczność |

### Jedno spotkanie — `group-9`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-9-text-0` | Jedno spotkanie | Tekst PL/EN |
| `group-9-text-1` | Gdy potrzebujesz pomocy z konkretnym tematem. | Tekst PL/EN |
| `group-9-text-2` | Wybrany dział lub zadania | Tekst PL/EN |
| `group-9-text-3` | Przygotowanie do sprawdzianu | Tekst PL/EN |
| `group-9-text-4` | Bez zobowiązania do kolejnych zajęć | Tekst PL/EN |
| `group-9-text-5` | Wycena indywidualna | Tekst PL/EN |
| `group-9-text-6` | Zapytaj o zajęcia | Tekst PL/EN |

| Identyfikator linku | Podpis | Adres domyślny | Dodatkowe opcje |
| --- | --- | --- | --- |
| `group-9-link-0` | contact.html?category=tutoring&details=maths#contact-form | `contact.html?category=tutoring&details=maths&package=single#contact-form` | Widoczność |

### Regularna nauka — `group-10`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-10-text-0` | Regularna nauka | Tekst PL/EN |
| `group-10-text-1` | Gdy chcesz pracować systematycznie, w swoim tempie. | Tekst PL/EN |
| `group-10-text-2` | Częstotliwość spotkań do ustalenia | Tekst PL/EN |
| `group-10-text-3` | Praca nad bieżącym materiałem i zaległościami | Tekst PL/EN |
| `group-10-text-4` | Sposób pracy dopasowany do Twoich potrzeb | Tekst PL/EN |
| `group-10-text-5` | Wycena indywidualna | Tekst PL/EN |
| `group-10-text-6` | Zapytaj o zajęcia | Tekst PL/EN |

| Identyfikator linku | Podpis | Adres domyślny | Dodatkowe opcje |
| --- | --- | --- | --- |
| `group-10-link-0` | contact.html?category=tutoring&details=maths#contact-form | `contact.html?category=tutoring&details=maths&package=regular#contact-form` | Widoczność |

### Przygotowanie do matury — `group-11`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-11-text-0` | Przygotowanie do matury | Tekst PL/EN |
| `group-11-text-1` | Gdy chcesz uporządkować materiał przed egzaminem. | Tekst PL/EN |
| `group-11-text-2` | Poziom podstawowy lub rozszerzony | Tekst PL/EN |
| `group-11-text-3` | Zadania maturalne i omówienie rozwiązań | Tekst PL/EN |
| `group-11-text-4` | Zakres i tempo dopasowane do terminu matury | Tekst PL/EN |
| `group-11-text-5` | Wycena indywidualna | Tekst PL/EN |
| `group-11-text-6` | Zapytaj o zajęcia | Tekst PL/EN |

| Identyfikator linku | Podpis | Adres domyślny | Dodatkowe opcje |
| --- | --- | --- | --- |
| `group-11-link-0` | contact.html?category=tutoring&details=maths#contact-form | `contact.html?category=tutoring&details=maths&package=matura#contact-form` | Widoczność |

### FAQ — `group-12`

Widoczność grupy: przełącznik w edytorze.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `group-12-text-0` | Mały nagłówek FAQ | Tekst PL/EN |
| `group-12-text-1` | Tytuł FAQ | Tekst PL/EN |

## Kontakt (`contact`)

### Kontakt — nagłówki, opisy i przyciski — `copy`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `copy-text-0` | Kontakt | Tekst PL/EN |
| `copy-text-1` | Zaczynamy od rozmowy | Tekst PL/EN |
| `copy-text-2` | Porozmawiajmy. | Tekst PL/EN |
| `copy-text-3` | Masz pomysł na wspólny projekt, potrzebujesz zdjęć albo wsparcia w nauce? Wybierz temat i opowiedz mi, co planujesz. | Tekst PL/EN |
| `copy-text-4` | Napiszmy coś razem | Tekst PL/EN |
| `copy-text-5` | W czym mogę Ci pomóc? | Tekst PL/EN |
| `copy-text-6` | Wybierz temat — zadam tylko kilka pasujących pytań. | Tekst PL/EN |
| `copy-text-7` | Wybierz temat | Tekst PL/EN |
| `copy-text-12` | Dalej | Tekst PL/EN |
| `copy-text-13` | Opowiedz mi trochę więcej | Tekst PL/EN |
| `copy-text-14` | Nie znasz jeszcze szczegółów? Pola dodatkowe możesz zostawić puste. | Tekst PL/EN |
| `copy-text-15` | Rodzaj zapytania | Tekst PL/EN |
| `copy-text-16` | Wstecz | Tekst PL/EN |
| `copy-text-17` | Dalej | Tekst PL/EN |
| `copy-text-18` | Sprawdźmy i wyślijmy | Tekst PL/EN |
| `copy-text-19` | Na jaki e-mail mam odpisać? | Tekst PL/EN |
| `copy-text-20` | Co jeszcze chcesz dodać? (opcjonalnie) | Tekst PL/EN |
| `copy-text-21` | Wstecz | Tekst PL/EN |
| `copy-text-22` | Wyślij wiadomość | Tekst PL/EN |
| `copy-text-23` | Do wiadomości dołączę powyższe podsumowanie. Twój e-mail służy do odpowiedzi. | Tekst PL/EN |
| `copy-address-0` | podyma.marcin33@gmail.com | Tekst PL/EN |
| `copy-address-1` | Cinek477 | Tekst PL/EN |
| `copy-address-2` | @47.cinek | Tekst PL/EN |

| Identyfikator linku | Podpis | Adres domyślny | Dodatkowe opcje |
| --- | --- | --- | --- |
| `copy-link-0` | podyma.marcin33@gmail.com | `mailto:podyma.marcin33@gmail.com` | Widoczność |
| `copy-link-1` | Cinek477 | `https://github.com/Cinek477` | Widoczność |
| `copy-link-2` | @47.cinek | `https://www.instagram.com/47.cinek/` | Widoczność |

### Kreator — tematy — `topics`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `topics-it` | Projekt IT | Tekst PL/EN |
| `topics-photo` | Fotografia | Tekst PL/EN |
| `topics-tutoring` | Korepetycje | Tekst PL/EN |
| `topics-other` | Inne | Tekst PL/EN |

### Kreator — rodzaje zapytań: Projekt IT — `details-it`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `details-it-web` | Aplikacja webowa | Tekst PL/EN |
| `details-it-hackathon` | Hackathon | Tekst PL/EN |
| `details-it-other` | Inny pomysł | Tekst PL/EN |

### Kreator — rodzaje zapytań: Fotografia — `details-photo`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `details-photo-concert` | Koncert | Tekst PL/EN |
| `details-photo-portrait` | Portret / Plener | Tekst PL/EN |
| `details-photo-event` | Impreza / Event | Tekst PL/EN |

### Korepetycje — zakres nauki — `details-tutoring`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `details-tutoring-basic` | Matematyka podstawowa | Tekst PL/EN |
| `details-tutoring-advanced` | Matematyka rozszerzona | Tekst PL/EN |
| `details-tutoring-university` | Matematyka akademicka | Tekst PL/EN |
| `details-tutoring-other` | Inny zakres | Tekst PL/EN |

### Kreator — rodzaje zapytań: Inne — `details-other`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `details-other-other` | Inna sprawa | Tekst PL/EN |

### Korepetycje — dodatkowe pytania — `questions-tutoring`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `questions-tutoring-topic` | Jaki temat chcesz przećwiczyć? | Tekst PL/EN |
| `questions-tutoring-frequency` | Jak chcesz się spotykać? | Tekst PL/EN |

### Pytania: Fotografia — `questions-photo`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `questions-photo-place` | Gdzie planujesz sesję lub wydarzenie? | Tekst PL/EN |
| `questions-photo-timing` | Jaki termin masz na myśli? | Tekst PL/EN |

### Pytania: Projekt IT — `questions-it`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `questions-it-idea` | Co chcesz stworzyć lub usprawnić? | Tekst PL/EN |
| `questions-it-timing` | Czy masz planowany termin? | Tekst PL/EN |

### Pytania: Inne — `questions-other`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `questions-other-topic` | Czego dotyczy Twoja sprawa? | Tekst PL/EN |

### Nazwy ofert korepetycji — `packages`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `packages-start` | START — lekcja pokazowa | Tekst PL/EN |
| `packages-single` | Jedno spotkanie | Tekst PL/EN |
| `packages-regular` | Regularna nauka | Tekst PL/EN |
| `packages-matura` | Przygotowanie do matury | Tekst PL/EN |

### Nazwy ofert fotograficznych — `photo-offers`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `photo-offers-paid` | Sesja lub impreza prywatna | Tekst PL/EN |
| `photo-offers-accreditation` | Akredytacja na koncert / event | Tekst PL/EN |

### Korepetycje — forma spotkań — `choices-tutoring-frequency`

Widoczność całej grupy: wymuszona jako włączona w formularzu kontaktu.

| Identyfikator pola | Podpis / rozpoznanie | Rodzaj |
| --- | --- | --- |
| `choices-tutoring-frequency-option-0` | Jednorazowe zajęcia | Tekst PL/EN |
| `choices-tutoring-frequency-option-1` | Regularne spotkania | Tekst PL/EN |

## Poza tym katalogiem

Galeria, projekty i opinie mają osobne modele rekordów opisane w instrukcjach funkcji. Hobby nie ma pełnego edytora tekstów; 404, wspólne menu i stopka wymagają edycji źródeł. Zmiana etykiet kreatora kontaktu nie dodaje nowych kategorii lub gałęzi procesu.
