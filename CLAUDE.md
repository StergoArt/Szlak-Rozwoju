# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Szlak Rozwoju" - strona internetowa gabinetu socjoterapii i rozwoju osobistego w Żywcu (Dorota Kluz). Strona prezentuje uslugi: socjoterapia indywidualna/grupowa, TUS, zajecia ruchowe i obozy rozwojowe.

## Architecture

Projekt sklada sie z trzech stron HTML + panelu klienta:

- **`index.html`** - Glowna strona publiczna (landing page z usługami, cennikiem, FAQ, formularzem kontaktowym, chatbotem)
- **`panel.html`** - Panel klienta (SPA z autoryzacją Supabase: notatki, grafik wizyt, dokumenty, sesje)
- **`polityka-prywatnosci.html`** - Polityka prywatności (RODO)
- **`szlak-rozwoju.jsx`** - Wersja React z framer-motion (standalone komponent, nie uzywany w produkcji)

### Struktura plikow

```
index.html              <- glowna strona publiczna
panel.html              <- panel klienta (SPA)
polityka-prywatnosci.html <- polityka prywatnosci
css/main.css            <- style glownej strony
css/privacy.css         <- style polityki prywatnosci
panel/css/panel.css     <- style panelu klienta
js/main.js              <- logika glownej strony (chat, formularz, FAQ, karty uslug)
panel/js/               <- moduly panelu (auth, notes, schedule, session, attachments, documents, account, router, init)
js/vendor/              <- lokalne biblioteki (supabase-2.99.3.min.js, emailjs-4.4.1.min.js)
fonts/                  <- lokalne fonty woff2 (Poppins, Source Sans Pro) — RODO compliance
.htaccess               <- CSP strict, HSTS, cache, GZIP, blokada plikow wrazliwych
.deployignore           <- lista plikow wykluczonych z deploymentu
```

## Key Files

- `opis-szlak-rozwoju-final.txt` - Brief z trescia strony (kopia zapasowa contentu, cennik, opisy uslug)
- `logo.png` - Logo gabinetu (uzywane w nawigacji i stopce)

## Development

Brak systemu budowania, package.json, testow. Aby pracowac ze strona:

```bash
# Podglad HTML - otworz plik w przegladarce
start index.html
```

## Conventions

- Jezyk strony: polski
- Kolorystyka: zloty (#FFCC00, #FFD93D), turkusowy (#4ECDC4), cieple tlo (#FFF9E6, #FFF4E0)
- Czcionki: Poppins (naglowki), Source Sans Pro (tresc) — lokalne woff2, nie CDN
- Strona jest w pelni responsywna (mobile-first z media queries)
- Formularz kontaktowy zintegrowany z EmailJS (wysylka email)
- CSS w zewnetrznych plikach (css/main.css, panel/css/panel.css, css/privacy.css)
- JS w zewnetrznych plikach (js/main.js, panel/js/*.js)
- CSP strict: style-src 'self' (brak unsafe-inline), font-src 'self'
- Toggle show/hide w JS: classList.add/remove('u-hidden'), NIE element.style.display
