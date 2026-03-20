// Konfiguracja Supabase
// CDN tworzy globalne "supabase" (biblioteka) — nadpisujemy je instancją klienta
(function () {
    var url = "https://krrabwmlzalibufwdlpv.supabase.co";
    var key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycmFid21semFsaWJ1ZndkbHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NDkwMjUsImV4cCI6MjA4OTUyNTAyNX0.welvH12GbfmJfS58Y4OnxHlqEVfsKczTiBXyFDnQd58";
    window.supabase = window.supabase.createClient(url, key);
})();
