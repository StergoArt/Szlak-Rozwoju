# Szlak Rozwoju — Panel Klienta: Progression Tracker

## Technologia
- **Backend:** Supabase (konto: Artek_User_Baza, projekt: szlak_rozwoju, region: eu-central-1)
- **Project ID:** krrabwmlzalibufwdlpv
- **Frontend:** Vanilla HTML/CSS/JS + Supabase JS z CDN
- **Auth:** Email + haslo (email confirmation wylaczone)

---

## Fazy wdrozenia

### [DONE] Faza 0: Fundament (auth + szkielet panelu)
- **Data:** 2026-03-19
- **Zakres:**
  - Naprawa bialego prostokata w stopce (bledna sciezka logo)
  - Utworzenie `panel.html` (SPA z hash routingiem)
  - Utworzenie `panel/css/panel.css` (design tokens z glownej strony)
  - Utworzenie `panel/js/supabase-config.js` (konfiguracja klienta)
  - Utworzenie `panel/js/router.js` (hash router z auth guards)
  - Utworzenie `panel/js/auth.js` (logowanie, rejestracja, sesja, role)
  - Dodanie linku "Panel Klienta" w nawigacji glownej strony
- **Baza danych:**
  - Tabela `profiles` (id, full_name, phone, role, created_at, updated_at)
  - Trigger `on_auth_user_created` -> `handle_new_user()`
  - Funkcja `is_therapist()` z SECURITY DEFINER (zapobiega rekurencji RLS)
  - 3 polityki RLS: odczyt wlasnego profilu, terapeuta czyta wszystkie, update wlasnego
- **Poprawki architektoniczne (audyt Gemini):**
  - [FIX #1] is_therapist() SECURITY DEFINER
  - [FIX #2] Email confirmation wylaczone
  - [FIX #3] Auth guards w routerze
  - [FIX #4] Metatagi mobilne (viewport)
  - [FIX #5] onAuthStateChange() listener

### [DONE] Faza 1: Historia klienta — Notatki z sesji + Zalaczniki
- **Data:** 2026-03-20
- **Zakres:**
  - Utworzenie `panel/js/notes.js` (CRUD notatek, widok terapeuty/klienta, paginacja, wyszukiwanie)
  - Utworzenie `panel/js/attachments.js` (upload drag-and-drop, lightbox, signed URLs)
  - Modyfikacja `panel.html`, `panel/css/panel.css`, `panel/js/router.js`
- **Baza danych:**
  - Tabela `notes` (id, client_id, author_id, title, content, session_date, created_at, updated_at) z RLS
  - Tabela `note_attachments` (id, note_id, uploaded_by, file_name, file_path, mime_type, file_size, created_at) z RLS
  - Storage bucket `note-attachments` (prywatny, 10MB limit, allowed MIME types)
  - Trigger `notes_updated_at`, indeksy na client_id i session_date
- **Faza 2 pominieta** — zalaczniki zintegrowane z Faza 1

### [DONE] Faza 3: Grafik / Rezerwacja wizyt
- **Data:** 2026-03-20
- **Zakres:**
  - Utworzenie `panel/js/schedule.js` (siatka tygodniowa, CRUD slotow, rezerwacja przez RPC, mobile day-view)
  - Refaktor `panel/js/router.js` (tablica listenerow zamiast single callback, trasa #/schedule)
  - Modyfikacja `panel.html` (widok #view-schedule, modal rezerwacji, modal formularza slotu)
  - Modyfikacja `panel/css/panel.css` (siatka 7-kolumnowa, slot-cards, kolory statusow, mobile)
- **Baza danych:**
  - Tabela `appointments` (slot_date, start_time, end_time, duration_minutes, status, therapist_id, client_id, service_type, notes, booked_at, created_at, updated_at) z RLS
  - Statusy: available -> booked -> confirmed -> completed | cancelled_by_therapist | cancelled_by_client
  - Trigger `check_slot_overlap()` — zapobiega nakladaniu sie terminow
  - Funkcja RPC `book_appointment()` — atomowa rezerwacja (SECURITY DEFINER, timezone-aware)
  - RLS: terapeuta pelny CRUD (DELETE tylko available), klient odczyt available + wlasnych, anulowanie wlasnych (timezone-aware)
- **Funkcje:**
  - Terapeuta: tworzenie slotow (z powtarzaniem na N tygodni), usuwanie, potwierdzanie, odwolywanie, oznaczanie jako zrealizowane, kopiowanie tygodnia
  - Klient: rezerwacja z wyborem typu wizyty, widok "Moje wizyty", anulowanie
  - Mobile: widok dnia z nawigacja (CSS .active-day toggling bez re-renderowania DOM)
  - Double-booking: przyjazny modal bledu + automatyczne odswiezenie widoku

### [TODO] Faza 4: Szlifowanie
- Dashboard z podsumowaniem
- Powiadomienia email (Supabase Edge Functions)
- Optymalizacja mobilna
- Audyt bezpieczenstwa RLS

---

## Pliki projektu

```
szlak_rozwoju/
  szlak-rozwoju.html          <- glowna strona (produkcyjna)
  panel.html                  <- SPA panelu klienta
  panel/
    css/
      panel.css               <- style panelu
    js/
      supabase-config.js      <- konfiguracja Supabase
      auth.js                 <- modul autentykacji
      router.js               <- hash router z tablica listenerow
      notes.js                <- modul notatek z sesji
      attachments.js           <- modul zalacznikow (upload, lightbox)
      schedule.js              <- modul grafiku wizyt (siatka, rezerwacja)
  logo.png                    <- logo gabinetu
  PROGRESS.md                 <- ten plik
  CLAUDE.md                   <- instrukcje dla Claude Code
```
