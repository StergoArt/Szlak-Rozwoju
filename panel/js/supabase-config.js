// Konfiguracja Supabase
// CDN tworzy globalne "supabase" (biblioteka) — nadpisujemy je instancją klienta
(function () {
    var url = "https://krrabwmlzalibufwdlpv.supabase.co";
    var key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycmFid21semFsaWJ1ZndkbHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NDkwMjUsImV4cCI6MjA4OTUyNTAyNX0.welvH12GbfmJfS58Y4OnxHlqEVfsKczTiBXyFDnQd58";
    window.supabase = window.supabase.createClient(url, key);

    // Security: w produkcji nie ujawniaj obiektow bledow w konsoli
    window.logError = function(context, err) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error(context, err);
        } else {
            console.error(context + ' \u2014 wyst\u0105pi\u0142 b\u0142\u0105d');
        }
    };
})();
