// Inicjalizacja aplikacji
(async function () {
    try {
        Auth.init();

        // Sprawdz istniejaca sesje
        var result = await supabase.auth.getSession();
        var session = result.data.session;

        if (session) {
            Auth.currentUser = session.user;
            await Auth.loadProfile();
            Auth.updateNavUI();
            Auth.renderDashboard();
        }
    } catch (err) {
        logError('Inicjalizacja panelu', err);
    }

    // Ukryj loader niezaleznie od bledow
    var loader = document.getElementById('appLoader');
    if (loader) {
        loader.style.display = 'none';
    }

    // Uruchom moduly i router po sprawdzeniu sesji
    Notes.init();
    Schedule.init();
    Session.init();
    Documents.init();
    Account.init();
    Router.init();

    // Banner RODO (localStorage — pokazuje sie raz, potem znika na stale)
    if (!localStorage.getItem('rodo_banner_accepted')) {
        var banner = document.getElementById('privacyBanner');
        if (banner) banner.style.display = 'block';
    }
    var bannerCloseBtn = document.getElementById('privacyBannerClose');
    if (bannerCloseBtn) {
        bannerCloseBtn.addEventListener('click', function() {
            document.getElementById('privacyBanner').style.display = 'none';
            localStorage.setItem('rodo_banner_accepted', '1');
        });
    }
})();
