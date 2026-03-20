# Faza 1: Notatki z sesji + Załączniki — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** System notatek z sesji terapeutycznych z załącznikami (zdjęcia, dokumenty) w panelu klienta Szlak Rozwoju.

**Architecture:** Vanilla JS SPA z hash routerem, Supabase (DB + Storage + RLS) z CDN. Widok z sidebariem klientów (terapeuta) lub lista notatek (klient). Załączniki uploadowane do Supabase Storage z metadanymi w tabeli `note_attachments`.

**Tech Stack:** HTML/CSS/JS (no build), Supabase JS v2 (CDN UMD), PostgreSQL (Supabase), Supabase Storage

**Spec:** `docs/superpowers/specs/2026-03-20-faza1-notatki-z-sesji-design.md`

**Uwaga:** Projekt nie używa git, testów ani build systemu. Weryfikacja odbywa się manualnie w przeglądarce i przez Supabase dashboard.

**Bezpieczeństwo:** Cały user-generated content (tytuły, treści notatek) musi być renderowany przez `textContent` lub `escapeHtml()` — nigdy nie wstawiaj niezaufanych danych przez `innerHTML` bez sanityzacji. Używaj metody `escapeHtml()` zdefiniowanej w notes.js do renderowania HTML ze zmiennymi użytkownika.

---

## File Map

| Plik | Akcja | Odpowiedzialność |
|------|-------|------------------|
| `panel/js/notes.js` | CREATE | CRUD notatek, sidebar klientów, renderowanie widoków, event delegation, race condition guard |
| `panel/js/attachments.js` | CREATE | Upload drag-and-drop, podgląd miniatur, lightbox, pobieranie, walidacja plików |
| `panel.html` | MODIFY | Dodanie `#view-notes` HTML, script tagi, aktywacja kafelka dashboard |
| `panel/js/router.js` | MODIFY | Dodanie `#/notes` do protected routes + callback `onRouteChange` |
| `panel/css/panel.css` | MODIFY | Style sidebar, karty notatek, formularz, dropzone, lightbox, responsywność |

---

## Task 1: Migracja bazy danych

**Cel:** Tabele `notes` i `note_attachments` z RLS, trigger `updated_at`, indeksy.

**Narzędzie:** Supabase MCP `apply_migration`

- [ ] **Step 1: Uruchom migrację SQL**

```sql
-- === Tabela notes ===
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

-- === Tabela note_attachments ===
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

-- === RLS: notes ===
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client reads own notes"
    ON notes FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Therapist reads all notes"
    ON notes FOR SELECT USING (public.is_therapist());

CREATE POLICY "Therapist creates notes"
    ON notes FOR INSERT WITH CHECK (public.is_therapist() AND author_id = auth.uid());

CREATE POLICY "Therapist updates own notes"
    ON notes FOR UPDATE USING (public.is_therapist() AND author_id = auth.uid());

CREATE POLICY "Therapist deletes own notes"
    ON notes FOR DELETE USING (public.is_therapist() AND author_id = auth.uid());

-- === RLS: note_attachments ===
ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client reads own attachments"
    ON note_attachments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM notes WHERE notes.id = note_attachments.note_id AND notes.client_id = auth.uid()
    ));

CREATE POLICY "Therapist reads all attachments"
    ON note_attachments FOR SELECT USING (public.is_therapist());

CREATE POLICY "Therapist creates attachments"
    ON note_attachments FOR INSERT
    WITH CHECK (public.is_therapist() AND uploaded_by = auth.uid());

CREATE POLICY "Therapist deletes attachments"
    ON note_attachments FOR DELETE
    USING (public.is_therapist() AND uploaded_by = auth.uid());
```

- [ ] **Step 2: Zweryfikuj migrację**

Uruchom `list_tables` z verbose=true i sprawdź, że tabele `notes` i `note_attachments` istnieją z poprawnymi kolumnami i RLS enabled.

---

## Task 2: Storage bucket + polityki

**Cel:** Prywatny bucket `note-attachments` z limitami serwerowymi i politykami RLS.

- [ ] **Step 1: Utwórz bucket z limitami**

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'note-attachments',
    'note-attachments',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);
```

- [ ] **Step 2: Dodaj polityki Storage**

```sql
CREATE POLICY "Therapist full access"
    ON storage.objects FOR ALL
    USING (bucket_id = 'note-attachments' AND public.is_therapist())
    WITH CHECK (bucket_id = 'note-attachments' AND public.is_therapist());

CREATE POLICY "Client reads own attachments"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'note-attachments'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
```

- [ ] **Step 3: Zweryfikuj bucket**

Sprawdź w Supabase dashboard: Storage -> buckets -> `note-attachments` powinien być prywatny z limitem 10 MB.

---

## Task 3: Aktualizacja routera

**Files:**
- Modify: `panel/js/router.js`

- [ ] **Step 1: Dodaj `#/notes` do protected routes i callback onRouteChange**

Zastąp cały plik `panel/js/router.js` — dodane: `'#/notes'` w `routes.protected`, pole `onRouteChange`, wywołanie callbacku w `handleRoute`.

Pełny kod: patrz sekcja router.js w planie (identyczny z obecnym + 3 zmiany zaznaczone komentarzami).

Zmiany vs obecny kod:
1. Linia 5: `protected: ['#/dashboard']` -> `protected: ['#/dashboard', '#/notes']`
2. Nowe pole: `onRouteChange: null,`
3. Po `self.showView(hash)`: dodaj `if (self.onRouteChange) { self.onRouteChange(hash); }`

- [ ] **Step 2: Zweryfikuj**

Otwórz `panel.html` w przeglądarce. Wpisz ręcznie `#/notes` w URL — niezalogowany powinien być przekierowany na `#/login`.

---

## Task 4: Aktualizacja panel.html

**Files:**
- Modify: `panel.html`

- [ ] **Step 1: Aktywuj kafelek "Notatki z sesji" na dashboard**

W `panel.html` zamień kafelek notatek (linia 122-127) z `<div>` na `<a href="#/notes">` z klasą `dashboard-card-link` i zmień status z "Wkrótce dostępne" na "Przejdź do notatek" z klasą `active-status`.

- [ ] **Step 2: Dodaj widok `#view-notes`**

Przed zamykającym `</div>` kontenera widoków (linia 145), dodaj nowy `<div id="view-notes" class="view">` z:
- Nagłówek z linkiem "← Dashboard" i tytułem
- `<aside id="clientsSidebar">` z wyszukiwarką i listą klientów
- `<main class="notes-main">` z paskiem akcji, kontenerem notatek i przyciskiem "Załaduj więcej"
- Lightbox overlay (poza kontenerem widoków, przed `</body>`)

- [ ] **Step 3: Dodaj script tagi**

Po `<script src="panel/js/auth.js"></script>` (linia 152), dodaj:
```html
<script src="panel/js/attachments.js"></script>
<script src="panel/js/notes.js"></script>
```

- [ ] **Step 4: Dodaj inicjalizację Notes**

W bloku startowym `<script>`, **poza blokiem `if (session)` i poza `try/catch`**, tuż PRZED `Router.init()` (linia 181), dodaj `Notes.init();`. Notes musi się zainicjalizować niezależnie od sesji — rejestruje callback `Router.onRouteChange`, który jest potrzebny po zalogowaniu.

---

## Task 5: Style CSS

**Files:**
- Modify: `panel/css/panel.css`

- [ ] **Step 1: Dodaj nowe style**

Przed sekcją `/* ===== Responsywność ===== */` (linia 408) dodaj kompletne style dla:
- `.notes-header`, `.back-link` — nagłówek widoku notatek
- `.notes-layout` — flex layout sidebar + main
- `.clients-sidebar`, `.client-item` — sidebar z listą klientów
- `.notes-main`, `.notes-actions` — panel główny z akcjami
- `.note-card` — karta notatki (collapsed/expanded)
- `.note-attachments-grid`, `.attachment-thumb` — siatka załączników
- `.note-form`, `.form-row` — formularz dodawania/edycji
- `.dropzone`, `.upload-preview` — strefa drag-and-drop
- `.lightbox` — podgląd pełnoekranowy
- `.empty-state` — puste stany
- `.dashboard-card-link`, `.active-status` — aktywny kafelek dashboard
- `.client-select-mobile` — mobile dropdown
- `.note-form-alert` — komunikaty błędów formularza

- [ ] **Step 2: Rozszerz media queries**

W `@media (max-width: 768px)`: sidebar hidden, mobile select visible, notes-layout column, form-row column.
W `@media (max-width: 480px)`: mniejsze thumbnails, tighter lightbox padding.

---

## Task 6: attachments.js

**Files:**
- Create: `panel/js/attachments.js`

- [ ] **Step 1: Utwórz moduł Attachments**

Globalny obiekt `Attachments` z metodami:
- `initLightbox()` — listener na lightbox overlay + Escape
- `openLightbox(src)`, `closeLightbox()` — sterowanie lightboxem
- `validateFile(file)` — sprawdzenie MIME i rozmiaru
- `addFiles(fileList, onUpdate)` — dodanie plików do `pendingFiles[]`
- `removeFile(fileId, onUpdate)` — usunięcie z listy
- `renderPreviews(container)` — renderowanie miniatur w formularzu (bezpieczne metody DOM)
- `uploadAll(clientId, noteId)` -> Promise z metadanymi. Przy błędzie uploadu: oznacz plik klasą `.error` (czerwona ramka), pokaż alert pod dropzone.
- `saveMetadata(noteId, files, uploaderId)` -> Promise
- `renderAttachments(attachments, container)` — renderowanie w karcie notatki (bezpieczne metody DOM)
- `handleAttachmentClick(filePath, mimeType)` — lightbox/download
- `deleteFiles(filePaths)` — fire-and-forget usunięcie ze Storage
- `initDropzone(dropzoneEl, fileInputId, previewsContainer, alertEl, onUpdate)` — inicjalizacja drag-and-drop

**Kluczowe:** Wszystkie elementy DOM tworzone przez `document.createElement()` + `textContent` — nie przez innerHTML z niezaufanymi danymi.

- [ ] **Step 2: Zweryfikuj**

Otwórz `panel.html` — konsola nie powinna zgłaszać błędów JS. `Attachments` powinno być dostępne jako global.

---

## Task 7: notes.js

**Files:**
- Create: `panel/js/notes.js`

- [ ] **Step 1: Utwórz moduł Notes**

Globalny obiekt `Notes` z:

**Stan:**
- `activeClientId` — guard przed race conditions
- `currentNoteId` — UUID z `crypto.randomUUID()` generowany przy otwarciu formularza
- `notes[]`, `clients[]`, `offset`, `PAGE_SIZE: 20`
- `editingNote` — notatka w trybie edycji lub null

**Metody publiczne:**
- `init()` — event delegation (jeden listener na `#notesContent`, jeden na `#clientsList`), callback `Router.onRouteChange`
- `onEnter()` — router callback, rozgałęzienie terapeuta/klient

**Widok terapeuty:**
- `showTherapistView()` — pokaż sidebar, załaduj klientów, pokaż empty state "Wybierz klienta z listy po lewej stronie."
- `loadClients()` — pokaż spinner w `#clientsList` podczas fetch, potem `renderClients()` + `renderMobileSelect()`. Jeśli brak klientów: empty state "Brak zarejestrowanych klientów."
- `filterClients(query)` — filtrowanie client-side po `full_name.toLowerCase().indexOf(query)`, wywoływane z listenera `input` na `#clientSearch`. Schowaj search input jeśli <= 5 klientów.
- `selectClient(clientId)` — ustaw `activeClientId`, załaduj notatki
- `loadNotes(clientId, append)` — pokaż spinner w `#notesContent` podczas fetch + **race condition guard** (sprawdź `activeClientId === clientId` przed renderowaniem). Jeśli brak notatek: empty state "Brak notatek dla tego klienta. Dodaj pierwszą notatkę."

**Widok klienta:**
- `showClientView()` — ukryj sidebar, `activeClientId = Auth.currentUser.id`, załaduj notatki. Jeśli brak notatek: empty state "Nie masz jeszcze żadnych notatek z sesji."

**Formularz:**
- `showForm(existingNote)` — generuj HTML z `escapeHtml()` dla wartości użytkownika, inicjalizuj dropzone
- `saveNote()` — upload -> insert/update -> metadata -> odśwież listę. UUID generowany przez `crypto.randomUUID()` przy otwarciu formularza. Przycisk "Zapisz" disabled ze spinnerem (wzorzec `Auth.setLoading()`). Przy błędzie: pokaż alert w formularzu, formularz zostaje otwarty.

**Usuwanie:**
- `deleteNote(noteId)` — **kolejność: DB najpierw, Storage fire-and-forget**. Zapamiętaj paths, DELETE z DB, aktualizuj DOM, async remove ze Storage.

**Event delegation:**
- `handleContentClick(e)` — jeden handler na `#notesContent`, rozróżnianie po `data-action`: `toggle-note`, `edit-note`, `delete-note`, `save-note`, `cancel-form`, `view-attachment`

**Pomocnicze:**
- `escapeHtml(str)` — `div.textContent = str; return div.innerHTML`
- `formatDate(dateStr)` — YYYY-MM-DD -> DD.MM.YYYY
- `pluralize(count)` — polska odmiana "załącznik/i/ów"

- [ ] **Step 2: Zweryfikuj**

Otwórz panel, zaloguj się. Kafelek "Notatki z sesji" -> widok notatek. Konsola bez błędów.

---

## Task 8: Weryfikacja end-to-end

**Cel:** Manualne sprawdzenie wszystkich ścieżek.

- [ ] **Step 1: Ustaw rolę terapeuty**

W Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'therapist' WHERE email = '<email_terapeuty>';
```

- [ ] **Step 2: Test — widok terapeuty**

1. Zaloguj się jako terapeuta
2. Kliknij kafelek "Notatki z sesji" na dashboard
3. Sidebar z klientami powinien się pojawić (może być pusty)
4. Zarejestruj konto testowe klienta w drugiej karcie
5. Odśwież widok terapeuty — klient powinien pojawić się w sidebarze
6. Kliknij klienta -> "Brak notatek..."

- [ ] **Step 3: Test — tworzenie notatki**

1. Kliknij "+ Dodaj notatkę"
2. Wypełnij: tytuł, data, treść
3. Przeciągnij/dodaj zdjęcie i PDF
4. Kliknij "Zapisz"
5. Notatka pojawia się na liście z liczbą załączników

- [ ] **Step 4: Test — odczyt i załączniki**

1. Kliknij notatkę -> rozwinięcie z pełną treścią + miniatury
2. Kliknij miniaturę zdjęcia -> lightbox
3. Kliknij PDF -> pobieranie

- [ ] **Step 5: Test — edycja i usuwanie**

1. Kliknij "Edytuj" -> formularz z wypełnionymi danymi
2. Zmień tytuł, dodaj nowy załącznik, zapisz
3. Kliknij "Usuń" -> confirm -> notatka znika

- [ ] **Step 6: Test — widok klienta**

1. Zaloguj się jako klient (drugie konto)
2. Przejdź do "Notatki z sesji"
3. Widać notatki bez sidebara, bez przycisków edycji/usunięcia
4. Kliknięcie -> rozwinięcie, podgląd załączników działa

- [ ] **Step 7: Test — mobile**

1. Otwórz DevTools -> tryb mobilny (375px)
2. Sidebar niewidoczny, dropdown z klientami na górze
3. Formularz i karty pełna szerokość
4. Lightbox pełny ekran

- [ ] **Step 8: Zaktualizuj PROGRESS.md**

Oznacz Fazę 1 jako DONE z datą i zakresem.
