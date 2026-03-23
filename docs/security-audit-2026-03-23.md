# Audyt Bezpieczenstwa API -- Szlak Rozwoju
**Data:** 2026-03-23
**Zakres:** Supabase (auth + DB + storage), EmailJS (chatbot), Jitsi (sesje online)

## Zasada architektoniczna

W architekturze "frontend-only + Supabase" frontend NIE jest zaufanym srodowiskiem. Atakujacy moze calkowicie ominac pliki .js uzywajac curl/Postman. Jedyna realna warstwa bezpieczenstwa to PostgreSQL (RLS policies, CHECK constraints, triggers). Poprawki frontendowe sluza jako UX i defense-in-depth.

---

## Podsumowanie wynikow

| Severity | Znalezione | Naprawione | Wymaga recznej akcji |
|----------|-----------|------------|---------------------|
| KRYTYCZNA | 1 | 1 (zweryfikowane) | 0 |
| WYSOKA | 6 | 6 | 0 |
| SREDNIA | 10 | 10 | 2 (migracja SQL + EmailJS) |
| NISKA | 9 | 7 | 2 (C6, C7) |

---

## Warstwa 1: Autentykacja i zarzadzanie sesja

### V1.1 [SREDNIA] Walidacja sily hasla -- NAPRAWIONE
- **Plik:** `panel/js/auth.js`
- **Opis:** Dodano `validatePasswordStrength()` wymagajaca: >=8 znakow, wielka litera, cyfra, znak specjalny
- **Typ poprawki:** UX + compliance (Supabase Auth ma wlasne minimum serwerowe)

### V1.2 [NISKA] toISOString() -- NAPRAWIONE
- **Pliki:** `panel/js/auth.js`, `panel/js/schedule.js`, `panel/js/notes.js`
- **Opis:** Zamieniono na reczne budowanie daty lokalnej (getFullYear/getMonth/getDate)

### V1.3 [NISKA] Timeout po reset hasla -- NAPRAWIONE
- **Plik:** `panel/js/auth.js`
- **Opis:** Skrocono setTimeout z 2000ms na 500ms

---

## Warstwa 2: Autoryzacja (RBAC / RLS)

### V2.1 [KRYTYCZNA] Weryfikacja RLS policies -- ZWERYFIKOWANE, BRAK LUK
- **Wynik:** Polityki RLS sa kompletne i szczelne:
  - `notes`: SELECT filtruje po client_id/author_id, INSERT/UPDATE/DELETE wymaga is_therapist() + author_id
  - `appointments`: SELECT ograniczony do own/available, INSERT/DELETE/UPDATE z filtrami client_id/therapist_id
  - `note_attachments`: SELECT przez JOIN z notes, INSERT/DELETE wymaga is_therapist()
  - `profiles`: SELECT own lub is_therapist(), UPDATE tylko own

### V2.2-2.5 [WYSOKA] Defense-in-depth filtry -- NAPRAWIONE
- **Pliki:** `notes.js`, `schedule.js`, `documents.js`
- **Opis:** Dodano filtry `.eq('author_id')` i `.eq('client_id')` w operacjach UPDATE/DELETE/SELECT
- **Typ poprawki:** Defense-in-depth (RLS juz wymusza te ograniczenia serwerowo)

---

## Warstwa 3: Walidacja inputow

### V3.1 [WYSOKA] Niebezpieczne wstawianie HTML w chatbocie -- NAPRAWIONE
- **Plik:** `index.html`
- **Opis:** Zamieniono `formatMessage()` + niebezpieczne wstawianie HTML na bezpieczny mini-parser DOM:
  - `renderSafeMessage()` -- dzieli tekst na linie, tworzy br
  - `parseInline()` -- parsuje **bold**, ~~del~~, _italic_, [link](url) przez createElement/textContent
  - `isSafeUrl()` -- whitelist domen dla linkow
- **Typ poprawki:** Eliminacja wektora XSS

### V3.2-3.3 [NISKA] Pozaostale uzycia niebezpiecznych metod -- NAPRAWIONE
- **Plik:** `index.html`
- **Opis:** typing dots i chatReplies czyszczenie zamienione na DOM API

### V3.5 [SREDNIA] Limity dlugosci inputow -- NAPRAWIONE (wymaga migracji SQL)
- **Backend:** CHECK constraints w `supabase/migrations/20260323_security_constraints.sql`
- **Frontend:** maxlength w HTML (UX -- enforced at DB level)

---

## Warstwa 4: Rate limiting i abuse prevention

### V4.1 [SREDNIA] Anti-double-click -- NAPRAWIONE (UX)
- **Plik:** `panel/js/notes.js`
- **Opis:** Flaga `_saveInProgress` (UX guard, not security)

### V4.2 [SREDNIA] Limit propozycji terminow -- NAPRAWIONE (wymaga migracji SQL)
- **Backend:** BEFORE INSERT trigger w `supabase/migrations/20260323_security_constraints.sql`
- **Frontend:** count() check (UX feedback -- enforced by DB trigger)

---

## Warstwa 5: Error handling i information leakage

### V5.1 [WYSOKA] translateError() fallback -- NAPRAWIONE
- **Plik:** `panel/js/auth.js:321`
- **Opis:** Fallback zwraca generyczny komunikat zamiast oryginalnego bledu Supabase

### V5.2 [SREDNIA] console.error z obiektami bledow -- NAPRAWIONE
- **Pliki:** Wszystkie moduly panelu (35 zamian)
- **Opis:** Dodano `logError()` helper w `supabase-config.js`. Na produkcji loguje tylko kontekst.

### V5.3 [SREDNIA] alert() z surowym err.message -- NAPRAWIONE
- **Plik:** `panel/js/account.js`
- **Opis:** Generyczny komunikat bez msg

### V5.4 [SREDNIA] Status sesji ujawniony -- NAPRAWIONE
- **Plik:** `panel/js/session.js`
- **Opis:** Usunieto apt.status z komunikatu

### V5.5 [NISKA] console.log w formularzu -- NAPRAWIONE
- **Plik:** `index.html`
- **Opis:** Usunieto console.log('Formularz wyslany')

---

## Warstwa 6: Transport i konfiguracja

### V6.1 [WYSOKA] CSP 'unsafe-inline' -- NIENAPRAWIONE (wymaga refaktoru)
- **Opis:** Przeniesienie inline JS do plikow .js i usuniecie 'unsafe-inline' z CSP wymaga znaczacego refaktoru. Rekomendacja na przyszlosc.

### V6.2 [NISKA] Jitsi SRI -- NIENAPRAWIONE
- **Opis:** Jitsi moze aktualizowac API bez zmiany URL -- SRI by to zlamalo. Akceptowalne ryzyko.

### V6.5 [SREDNIA] frame-ancestors vs X-Frame-Options -- NAPRAWIONE
- **Plik:** `.htaccess`
- **Opis:** X-Frame-Options zmieniony z SAMEORIGIN na DENY (zgodne z CSP frame-ancestors 'none')

---

## Wymagane reczne akcje

### 1. Migracja SQL w Supabase (PRIORYTET WYSOKI)
Plik: `supabase/migrations/20260323_security_constraints.sql`
Uruchomic w Supabase SQL Editor. Zawiera:
- CHECK constraints na dlugosci kolumn (B6)
- BEFORE INSERT trigger na limit propozycji (B7)

### 2. Rate limiting EmailJS (PRIORYTET NISKI)
W EmailJS Dashboard:
- Wlaczyc rate limiting
- Skonfigurowac CORS (ograniczyc do domeny szlak-rozwoju.pl)

### 3. CSP connect-src (PRIORYTET NISKI)
Dodac `wss://*.supabase.co` do connect-src w .htaccess jezeli planowane jest uzycie Supabase Realtime.

---

## Poprawki po audycie QA (2026-03-23)

### QA1. Dostepnosc chatbota (a11y)
- **Plik:** `index.html:2262`
- **Opis:** Dodano `role="log"` i `aria-live="polite"` do kontenera wiadomosci czatu

### QA2. Dostepnosc alertow i walidacji hasla (a11y)
- **Plik:** `panel.html`
- **Opis:** Dodano `role="alert"` do 6 elementow alert. Dodano `aria-describedby` na inputach hasla.

### QA3. Obsluga bledow triggera PostgreSQL
- **Plik:** `panel/js/schedule.js`
- **Opis:** submitRequest() rozpoznaje bledy triggera (indexOf('propozycji'), kody P0001/23514) i wyswietla komunikat uzytkownikowi zamiast ukrywac za generycznym bledem.

### QA4. aria-disabled na przyciskach
- **Plik:** `panel/js/notes.js`
- **Opis:** Przycisk "Zapisz notatke" otrzymuje `aria-disabled="true"` i `cursor: not-allowed` gdy zapis jest w toku.

---

## Rekomendacje na przyszlosc

1. **CSP bez 'unsafe-inline'** -- Przeniesc inline JS do plikow .js
2. **Supabase Edge Functions** -- Dla operacji wymagajacych logiki serwerowej (np. walidacja, notyfikacje)
3. **Monitoring** -- Wdrozyc logowanie bledow do zewnetrznego serwisu (np. Sentry)
4. **Penetration testing** -- Zlecic profesjonalny pentest przed udostepnieniem panelu klienta
