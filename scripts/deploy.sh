#!/bin/bash
# scripts/deploy.sh — Build produkcyjny Szlak Rozwoju
# Kopiuje projekt do dist/, minifikuje CSS/JS/HTML, weryfikuje guardy bezpieczeństwa.
# Wymagania: node, npx, csso-cli (npm i -g csso-cli), terser, html-minifier-terser
set -euo pipefail

DIST="dist"
SRC="$(cd "$(dirname "$0")/.." && pwd)"

cd "$SRC"

echo "=== Szlak Rozwoju — Build Produkcyjny ==="
echo "Źródło: $SRC"
echo "Cel:    $SRC/$DIST"
echo ""

# 1. Czysta kopia
echo "[1/7] Tworzenie czystej kopii w $DIST/..."
rm -rf "$DIST"
mkdir -p "$DIST/css" "$DIST/js/vendor" "$DIST/panel/css" "$DIST/panel/js" "$DIST/fonts"

# Kopiowanie plików (bez node_modules, .git, scripts, docs)
cp -r css/*.css "$DIST/css/"
cp -r js/main.js "$DIST/js/"
cp -r js/vendor/*.js "$DIST/js/vendor/"
cp -r panel/css/*.css "$DIST/panel/css/"
cp -r panel/js/*.js "$DIST/panel/js/"
cp -r fonts/* "$DIST/fonts/"
cp *.html "$DIST/"
cp robots.txt "$DIST/" 2>/dev/null || true
cp sitemap.xml "$DIST/" 2>/dev/null || true
cp logo.png "$DIST/" 2>/dev/null || true
cp logo.webp "$DIST/" 2>/dev/null || true
cp favicon.png "$DIST/" 2>/dev/null || true
cp .htaccess "$DIST/" 2>/dev/null || true

# 2. Guard: .htaccess MUSI istnieć
echo "[2/7] Weryfikacja .htaccess..."
if [ ! -f "$DIST/.htaccess" ]; then
    echo "  BRAK .htaccess! Generowanie bazowego z rygorami bezpieczeństwa..."
    cat > "$DIST/.htaccess" << 'HTEOF'
# Bazowy .htaccess wygenerowany przez deploy.sh — zweryfikuj ręcznie!
RewriteEngine On

# Wymuszenie HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Wymuszenie non-www
RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [L,R=301]

# Security Headers
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(self), camera=(self), accelerometer=(), gyroscope=(), magnetometer=(), usb=(), payment=()"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.emailjs.com; frame-src https://meet.jit.si; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests"
</IfModule>
HTEOF
    echo "  UWAGA: Wygenerowano bazowy .htaccess — zweryfikuj przed produkcją!"
else
    echo "  OK — .htaccess znaleziony."
fi

# 3. Guard: robots.txt
echo "[3/7] Weryfikacja robots.txt..."
if [ ! -f "$DIST/robots.txt" ]; then
    echo "  BŁĄD: robots.txt nie istnieje!" && exit 1
fi
if ! grep -q "^Allow: /" "$DIST/robots.txt"; then
    echo "  BŁĄD: robots.txt nie zawiera 'Allow: /' — deploy zablokowany!" && exit 1
fi
if grep -A2 -i "^User-agent:[[:space:]]*\*" "$DIST/robots.txt" | grep -q -i "^Disallow:[[:space:]]*/$"; then
    echo "  OSTRZEŻENIE: robots.txt blokuje wszystkie boty dla User-agent: * — sprawdź konfigurację!"
fi
echo "  OK — robots.txt poprawny."

# 4. Guard: brak .htpasswd na produkcji
rm -f "$DIST/.htpasswd"

# 5. Minifikacja CSS (temp file pattern)
echo "[4/7] Minifikacja CSS..."
for f in "$DIST"/css/*.css "$DIST"/panel/css/*.css; do
    if [ -f "$f" ]; then
        echo "  Minifikacja: $f"
        npx csso "$f" -o "$f.tmp" && mv "$f.tmp" "$f"
    fi
done

# 6. Minifikacja JS (nie vendor/ — już minified)
echo "[5/7] Minifikacja JS..."
for f in "$DIST"/js/main.js "$DIST"/panel/js/*.js; do
    if [ -f "$f" ]; then
        echo "  Minifikacja: $f"
        npx terser "$f" -o "$f.tmp" --compress --mangle && mv "$f.tmp" "$f"
    fi
done

# 7. Minifikacja HTML
echo "[6/7] Minifikacja HTML..."
for f in "$DIST"/*.html; do
    if [ -f "$f" ]; then
        echo "  Minifikacja: $f"
        npx html-minifier-terser \
            --collapse-whitespace \
            --remove-comments \
            --minify-css \
            --minify-js \
            -o "$f.tmp" "$f" && mv "$f.tmp" "$f"
    fi
done

# Podsumowanie
echo ""
echo "[7/7] Podsumowanie buildu:"
echo "  Pliki HTML: $(find "$DIST" -name '*.html' | wc -l)"
echo "  Pliki CSS:  $(find "$DIST" -name '*.css' | wc -l)"
echo "  Pliki JS:   $(find "$DIST" -name '*.js' | wc -l)"
echo ""
echo "  Rozmiar dist/:"
du -sh "$DIST" 2>/dev/null || echo "  (nie można obliczyć)"
echo ""
echo "✓ Build gotowy w $DIST/"
echo ""
echo "Aby wdrożyć na produkcję:"
echo "  rsync -avz --delete --exclude-from='.deployignore' $DIST/ user@host:/public_html/"
