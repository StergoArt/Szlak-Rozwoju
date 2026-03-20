# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Szlak Rozwoju" - strona internetowa gabinetu socjoterapii i rozwoju osobistego w Żywcu (Dorota Kluz). Strona prezentuje uslugi: socjoterapia indywidualna/grupowa, TUS, zajecia ruchowe i obozy rozwojowe.

## Architecture

Projekt zawiera dwie niezalezne wersje strony:

- **`szlak-rozwoju.html`** - Samodzielna strona HTML (all-in-one: HTML + CSS + JS inline). To jest glowny plik produkcyjny. Nie wymaga buildu ani serwera - otwierany bezposrednio w przegladarce. Uzywa Google Fonts (Poppins, Source Sans Pro) i Font Awesome z CDN.
- **`szlak-rozwoju.jsx`** - Wersja React z framer-motion (komponent `SzlakRozwoju`). Nie jest podlaczony do zadnego projektu React - to standalone komponent do ewentualnej integracji.

## Key Files

- `opis-szlak-rozwoju-final.txt` - Brief z trescia strony (kopia zapasowa contentu, cennik, opisy uslug)
- `logo.png` - Logo gabinetu (uzywane w nawigacji i stopce)

## Development

Brak systemu budowania, package.json, testow. Aby pracowac ze strona:

```bash
# Podglad HTML - otworz plik w przegladarce
start szlak-rozwoju.html
```

## Conventions

- Jezyk strony: polski
- Kolorystyka: zloty (#FFCC00, #FFD93D), turkusowy (#4ECDC4), cieple tlo (#FFF9E6, #FFF4E0)
- Czcionki: Poppins (naglowki), Source Sans Pro (tresc)
- Strona jest w pelni responsywna (mobile-first z media queries)
- Formularz kontaktowy jest front-end only (placeholder na backend/n8n)
- CSS i JS sa osadzone bezposrednio w pliku HTML (brak zewnetrznych plikow CSS/JS)
