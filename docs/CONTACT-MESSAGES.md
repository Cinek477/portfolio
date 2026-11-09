# ✉️ Wiadomości z formularza

[← Dokumentacja](README.md) · [Kreator kontaktu](funkcje/KONTAKT-KREATOR.md) · [Skrzynka](funkcje/SKRZYNKA.md)

> Formularz na stronie kontaktu zapisuje wiadomości przez `POST /api/contact` w lokalnej bazie SQLite.

## 📥 Skrzynka w panelu

Po zalogowaniu otwórz zakładkę **Wiadomości**. Zobaczysz treść, e-mail, temat, datę, stan przeczytania i status powiadomienia pocztowego.

- Skrzynka odświeża się co **30 sekund**; „Odśwież” pobiera wiadomości od razu.
- „Odpowiedz” otwiera aplikację pocztową.

> [!NOTE]
> Wiadomości są prywatne: odczyt wymaga zalogowania, eksporty ich nie zawierają i nie trafiają na GitHub. Kopia folderu `data/` (po zatrzymaniu serwera) obejmuje też skrzynkę.

## 🔔 Powiadomienia na pocztę

Integracja korzysta z [API Resend](https://resend.com/docs/api-reference/emails/send-email), bez dodatkowych pakietów npm.

1. Utwórz konto Resend i klucz API z uprawnieniem wysyłania.
2. Skopiuj `.env.example` do `.env` w katalogu projektu.
3. Uzupełnij zmienne:

   | Zmienna | Wartość |
   | --- | --- |
   | `RESEND_API_KEY` | Klucz API z Resend |
   | `CONTACT_MAIL_FROM` | Adres nadawcy zaakceptowany przez Resend (własna domena wymaga weryfikacji) |
   | `CONTACT_MAIL_TO` | Odbiorca powiadomień — ustawiony na `podyma.marcin33@gmail.com` |

4. Zrestartuj serwer. Panel pokaże, czy konfiguracja poczty jest obecna.

> [!WARNING]
> Klucza nie wpisuj do HTML/JS przeglądarki ani na czacie. `.env` jest wykluczony z Git i niedostępny przez lokalny serwer. Testowy nadawca `onboarding@resend.dev` wysyła tylko na adres konta Resend.

**Jak to działa:**

- Wiadomość zapisuje się nawet wtedy, gdy powiadomienie się nie powiedzie — panel pokazuje błąd i pozwala ponowić wysyłkę.
- „Przyjęte przez pocztę” oznacza przyjęcie przez usługę, nie dostarczenie do skrzynki.
- Adres nadawcy formularza trafia do `Reply-To`; odbiorca zawsze pochodzi z konfiguracji serwera.

## 🏠 Zakres lokalny

Wysyłanie działa przez lokalny serwer, np. `http://localhost:3000/kontakt`. GitHub Pages nie uruchamia tego API — publiczne przyjmowanie wiadomości wymaga osobnego backendu.

- Limit: **5 zgłoszeń na 15 minut** z jednego adresu, z ograniczonym rozmiarem danych.
- Ponowienie identycznego żądania z tym samym identyfikatorem nie tworzy duplikatu.

## 🗃️ Foldery wiadomości

| Folder | Zachowanie |
| --- | --- |
| **Odebrane** | Licznik nowych obejmuje tylko nieprzeczytane w tym folderze |
| **Spam** | Oznaczenie ręczne, dotyczy jednego zgłoszenia — nie blokuje nadawcy |
| **Kosz** | Nie opróżnia się automatycznie; trwałe usunięcie tylko stąd |

- Spam i kosz można przywrócić do Odebranych bez utraty treści i danych nadawcy.
- Foldery dotyczą bazy panelu — nie zmieniają powiadomień, które dotarły już do Gmaila.
- Dostęp do folderów i zmian wymaga administratora. Wiadomości bez folderu dostają Odebrane przy starcie serwera.

### Usuwanie

- „Do kosza” wymaga potwierdzenia w oknie panelu. Opcja „Nie pytaj ponownie” dotyczy tylko pojedynczych wiadomości, w tej przeglądarce i pod tym adresem; „Przywróć potwierdzenia” włącza je ponownie.
- Trwałe usunięcie i „Opróżnij kosz” zawsze wymagają wpisania `USUŃ`.
- Opróżnienie obejmuje cały kosz, także wiadomości spoza ostatnich 100. Jeśli zawartość zmieniła się od wyświetlenia, trzeba ją sprawdzić i potwierdzić ponownie. Odebrane i Spam pozostają bez zmian.
