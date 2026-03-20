# Faza 1: Notatki z sesji terapeutycznych + Załączniki

## Kontekst

Panel klienta Szlak Rozwoju (Supabase backend, vanilla JS frontend) ma zaimplementowaną Fazę 0 (auth + szkielet). Faza 1 dodaje system notatek z sesji terapeutycznych z możliwością dołączania plików (zdjęcia, dokumenty).

**Użytkownicy:**
- **Terapeuta** (Dorota Kluz) — tworzy, edytuje, usuwa notatki i załączniki dla każdego klienta
- **Klient** — odczytuje swoje notatki i załączniki (read-only)

**Zależności od Fazy 0:**
- Tabela `profiles` z kolumną `role` i RLS (w tym polityka "Therapist can read all profiles" umożliwiająca pobranie listy klientów)
- Funkcja `is_therapist()` z SECURITY DEFINER
- Hash router z auth guards
- Auth z `onAuthStateChange()`

## Architektura

Podejście: **widok z sidebariem**. Nowa trasa `#/notes` z podziałem na sidebar (lista klientów) i główny panel (notatki wybranego klienta). Klient widzi tylko swoje notatki bez sidebara.

Wzorzec reużywalny w kolejnych fazach (grafik wizyt).

### Nowe pliki

| Plik | Opis |
|------|------|
| `panel/js/notes.js` | CRUD notatek, renderowanie widoków terapeuta/klient |
| `panel/js/attachments.js` | Upload, podgląd, lightbox, pobieranie załączników |

### Modyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `panel.html` | Dodanie widoku `#view-notes` (HTML) + script tagi dla notes.js i attachments.js. Zmiana kafelka "Notatki z sesji" z "Wkrótce dostępne" na aktywny link do `#/notes`. |
| `panel/js/router.js` | Rozszerzenie `routes.protected` o `#/notes` |
| `panel/css/panel.css` | Nowe style: sidebar, karty notatek, formularz, dropzone, lightbox |

## Baza danych

### Tabela `notes`

```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    session_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notes_client_id ON notes(client_id);
CREATE INDEX idx_notes_session_date ON notes(session_date DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Decyzje projektowe:**
- `content` domyślnie pusty string (nie NOT NULL) — terapeuta może dodać notatkę z samym tytułem, datą i załącznikami
- `author_id ON DELETE RESTRICT` — nie pozwala usunąć profilu terapeuty, który ma notatki (bezpieczeństwo danych)

### Tabela `note_attachments`

```sql
CREATE TABLE note_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_note_attachments_note_id ON note_attachments(note_id);
```

**Decyzje projektowe:**
- Załączniki są immutable — nie ma UPDATE policy. Aby zmienić plik, trzeba usunąć i wgrać nowy.
- `ON DELETE CASCADE` na `note_id` — usunięcie notatki kasuje metadane załączników (pliki ze Storage usuwane w kodzie JS przed usunięciem notatki).
- Max **10 załączników** na notatkę (walidacja client-side).

### RLS — tabela `notes`

```sql
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Klient czyta swoje notatki
CREATE POLICY "Client reads own notes"
    ON notes FOR SELECT
    USING (client_id = auth.uid());

-- Terapeuta czyta wszystkie notatki
CREATE POLICY "Therapist reads all notes"
    ON notes FOR SELECT
    USING (public.is_therapist());

-- Terapeuta tworzy notatki
CREATE POLICY "Therapist creates notes"
    ON notes FOR INSERT
    WITH CHECK (public.is_therapist() AND author_id = auth.uid());

-- Terapeuta edytuje swoje notatki
CREATE POLICY "Therapist updates own notes"
    ON notes FOR UPDATE
    USING (public.is_therapist() AND author_id = auth.uid());

-- Terapeuta usuwa swoje notatki
CREATE POLICY "Therapist deletes own notes"
    ON notes FOR DELETE
    USING (public.is_therapist() AND author_id = auth.uid());
```

### RLS — tabela `note_attachments`

```sql
ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;

-- Klient czyta załączniki do swoich notatek
CREATE POLICY "Client reads own attachments"
    ON note_attachments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM notes WHERE notes.id = note_attachments.note_id AND notes.client_id = auth.uid()
    ));

-- Terapeuta czyta wszystkie załączniki
CREATE POLICY "Therapist reads all attachments"
    ON note_attachments FOR SELECT
    USING (public.is_therapist());

-- Terapeuta dodaje załączniki
CREATE POLICY "Therapist creates attachments"
    ON note_attachments FOR INSERT
    WITH CHECK (public.is_therapist() AND uploaded_by = auth.uid());

-- Terapeuta usuwa załączniki
CREATE POLICY "Therapist deletes attachments"
    ON note_attachments FOR DELETE
    USING (public.is_therapist() AND uploaded_by = auth.uid());
```

### Supabase Storage

- **Bucket:** `note-attachments` (prywatny)
- **Struktura ścieżek:** `{client_id}/{note_id}/{timestamp}_{filename}` (timestamp zapobiega kolizji nazw)
- **Limit:** 10 MB / plik, max 10 plików / notatka
- **Dozwolone MIME:** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`
- **Hardening serwera:** Podczas tworzenia bucketa w panelu Supabase ustawić `file_size_limit = 10485760` (10 MB) oraz `allowed_mime_types` na powyższą listę. Walidacja client-side jest dodatkową warstwą UX, ale **serwer musi wymuszać limity niezależnie** — zapobiega to ominięciu UI przez bezpośrednie wywołania API.

**Polityki Storage (SQL):**

```sql
-- Terapeuta: pełny dostęp do bucketa
CREATE POLICY "Therapist full access"
    ON storage.objects FOR ALL
    USING (bucket_id = 'note-attachments' AND public.is_therapist())
    WITH CHECK (bucket_id = 'note-attachments' AND public.is_therapist());

-- Klient: odczyt plików w swoim folderze
CREATE POLICY "Client reads own attachments"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'note-attachments'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
```

### Usuwanie notatki z załącznikami — procedura

Usunięcie notatki wymaga sekwencji (Supabase nie kaskaduje do Storage). Kolejność: **najpierw DB, potem Storage** — jeśli usunięcie z DB się powiedzie ale Storage zawiedzie, zostają jedynie osierocone pliki (niewidoczne dla użytkowników). Odwrotna kolejność groziłaby "widmami" w UI (wpisy w DB wskazujące na nieistniejące pliki).

1. Pobranie listy `file_path` z `note_attachments` dla danej notatki (zapamiętanie w zmiennej)
2. Usunięcie wiersza z `notes` (CASCADE usunie wiersze z `note_attachments`) + natychmiastowa aktualizacja DOM
3. Asynchronicznie (fire-and-forget) usunięcie plików ze Storage (`supabase.storage.from('note-attachments').remove([...paths])`) — jeśli zawiedzie, pliki zostaną osierocone ale nie będą widoczne w aplikacji

Cała logika w `notes.js`, metoda `deleteNote()`.

### Tworzenie notatki z załącznikami — transaction flow

Problem: ścieżka Storage wymaga `note_id`, który nie istnieje przed zapisem do DB.

Rozwiązanie: generowanie UUID po stronie klienta (`crypto.randomUUID()`) przy otwarciu formularza "Nowa notatka". Dzięki temu:
- Upload załączników może rozpocząć się jeszcze przed zapisem notatki (lepszy UX)
- Ścieżka Storage `{client_id}/{note_id}/{timestamp}_{filename}` jest znana od razu
- INSERT do `notes` używa wygenerowanego UUID jako `id`
- INSERT do `note_attachments` jako ostatni krok

Sekwencja w `notes.js`, metoda `saveNote()`:
1. `var noteId = crypto.randomUUID()` (przy otwarciu formularza)
2. Upload plików do Storage z gotowym `noteId` w ścieżce
3. INSERT do `notes` z `id = noteId`
4. INSERT do `note_attachments` (metadane uploadowanych plików)

## Routing

Rozszerzenie istniejącego hash routera:

```js
routes: {
    public: ['#/login', '#/register'],
    protected: ['#/dashboard', '#/notes']
}
```

## UI — Widok terapeuty (`#/notes`)

### Layout

```
┌─────────────────────────────────────────────────┐
│ Nawigacja (istniejąca)                          │
├──────────────┬──────────────────────────────────┤
│ ← Dashboard  │  Notatki: Anna Nowak             │
│              │                                   │
│ KLIENCI      │  [+ Dodaj notatkę]                │
│ [Szukaj...] │                                   │
│ ┌──────────┐ │  ┌───────────────────────────┐    │
│ │● Anna N. │ │  │ 📝 Sesja indywidualna     │    │
│ │  Maria K.│ │  │ 15.03.2026 · Dodano 3 d.  │    │
│ │  Tomek W.│ │  │ Omówiliśmy strategie...   │    │
│ └──────────┘ │  │ 📎 2 załączniki            │    │
│              │  │ [Edytuj] [Usuń]            │    │
│              │  ├───────────────────────────┤    │
│              │  │ 📝 Pierwsza wizyta         │    │
│              │  │ 10.03.2026                 │    │
│              │  │ Wywiad wstępny...          │    │
│              │  └───────────────────────────┘    │
└──────────────┴──────────────────────────────────┘
```

### Sidebar klientów
- Lista wszystkich profili z rolą `client` (pobrane dzięki istniejącej polityce RLS "Therapist can read all profiles" z Fazy 0)
- Wyszukiwarka (filtrowanie po imieniu, client-side) jeśli > 5 klientów
- Kliknięcie klienta → załaduj notatki po prawej
- Aktywny klient podświetlony złotym kolorem

### Lista notatek
- Sortowane od najnowszej `session_date`
- Paginacja: ładowanie 20 notatek, przycisk "Załaduj więcej" na dole
- Każda karta: tytuł, data sesji, skrócona treść (100 znaków), liczba załączników
- Przyciski: Edytuj, Usuń (z potwierdzeniem `confirm()`)
- Kliknięcie karty → rozwinięcie pełnej treści + podgląd załączników

### Formularz dodawania/edycji notatki
- Pola: tytuł (text), data sesji (date, domyślnie dziś), treść (textarea)
- Sekcja załączników: dropzone (drag-and-drop) + przycisk "Dodaj pliki"
- Podgląd miniatur obrazów, ikony dla dokumentów
- Przycisk ✕ na załączniku → usunięcie
- Walidacja: typ pliku, rozmiar (10 MB), liczba (max 10)
- Przyciski: Zapisz, Anuluj
- Formularz zastępuje listę notatek (inline, nie modal)

## UI — Widok klienta (`#/notes`)

```
┌─────────────────────────────────────────────────┐
│ Nawigacja                                        │
├─────────────────────────────────────────────────┤
│ ← Dashboard                                     │
│                                                  │
│ Moje notatki z sesji                             │
│                                                  │
│ ┌─────────────────────────────────────────────┐  │
│ │ 📝 Sesja indywidualna                       │  │
│ │ 15.03.2026                                  │  │
│ │ Omówiliśmy strategie radzenia sobie ze...   │  │
│ │ 📎 rysunek.jpg, karta_pracy.pdf             │  │
│ └─────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────┐  │
│ │ 📝 Pierwsza wizyta                          │  │
│ │ 10.03.2026                                  │  │
│ └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

- Brak sidebara, brak przycisków edycji/usunięcia
- Kliknięcie notatki → rozwinięcie pełnej treści + załączniki
- Kliknięcie obrazka → lightbox
- Kliknięcie dokumentu → pobieranie
- Paginacja: 20 notatek, "Załaduj więcej"

## UI — Mobile (< 768px)

- Sidebar klientów → dropdown `<select>` na górze widoku
- Formularz notatki → full-width
- Karty notatek → stack pionowy, pełna szerokość
- Lightbox → pełny ekran

## Stany ładowania

- Ładowanie listy klientów → spinner w sidebarze
- Ładowanie notatek po wyborze klienta → spinner w panelu głównym
- Upload załącznika → progress bar na miniaturze
- Zapisywanie notatki → przycisk disabled ze spinnerem (wzorzec z auth.js)

## Stany puste

| Sytuacja | Komunikat |
|----------|-----------|
| Terapeuta, brak klientów | "Brak zarejestrowanych klientów." |
| Terapeuta, klient bez notatek | "Brak notatek dla tego klienta. Dodaj pierwszą notatkę." |
| Klient bez notatek | "Nie masz jeszcze żadnych notatek z sesji." |
| Notatka bez załączników | Sekcja załączników ukryta |

## Wzorce JS (performance & bezpieczeństwo)

### Event Delegation
Vanilla JS przy dynamicznym renderowaniu widoków (lista notatek, sidebar) musi unikać dodawania listenerów na każdy element iteracyjnie — grozi to wyciekami pamięci przy przełączaniu widoków. Obowiązkowy pattern: **Event Delegation** — jeden listener na kontenerze rodzica (np. `notesListContainer.addEventListener('click', ...)`) z rozróżnianiem akcji przez `e.target.closest('[data-action]')`.

### Ochrona przed race conditions
Szybkie przeklikiwanie klientów w sidebarze może spowodować, że odpowiedź na zapytanie o notatki klienta A nadpisze już wyświetlone notatki klienta C (stale response). Rozwiązanie: globalna zmienna `activeClientId` — przy otrzymaniu odpowiedzi z serwera, renderowanie następuje **tylko jeśli `clientId` odpowiedzi === `activeClientId`**. Alternatywnie: `AbortController` anulujący poprzednie zapytanie przy każdym nowym wyborze klienta.

## Obsługa błędów

- Błąd uploadu → komunikat pod dropzone, plik oznaczony czerwono
- Przekroczenie limitu 10 MB → walidacja client-side przed uploadem
- Przekroczenie max 10 załączników → komunikat, ukrycie przycisku "Dodaj pliki"
- Niedozwolony typ pliku → komunikat z listą dozwolonych formatów
- Błąd zapisu notatki → alert z komunikatem, formularz pozostaje otwarty
- Błąd połączenia z Supabase → ogólny komunikat + console.error
- Kolizja nazw plików → rozwiązana przez timestamp w ścieżce Storage

## Wpływ na plan fazowy

Ta faza częściowo pokrywa zakres oryginalnej Fazy 2 (dokumenty/zdjęcia), ponieważ pliki są powiązane z notatkami z sesji. Oryginalna Faza 2 może zostać pominięta lub przeznaczona na inną funkcjonalność.
