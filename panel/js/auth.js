// Moduł autentykacji z nasłuchiwaniem zmian sesji [FIX #5]
const Auth = {
    currentUser: null,
    currentProfile: null,

    _initialized: false,

    init() {
        // [FIX #5] Globalny listener zmian sesji
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION') {
                // Obsługiwane w panel.html — pomijamy, żeby uniknąć podwójnego przetwarzania
                return;
            }
            if (event === 'SIGNED_IN' && session) {
                this.onSignIn(session);
            } else if (event === 'SIGNED_OUT') {
                this.onSignOut();
            } else if (event === 'TOKEN_REFRESHED' && session) {
                this.currentUser = session.user;
            }
        });

        this.setupForms();
    },

    setupForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    },

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('loginBtn');
        const alert = document.getElementById('loginAlert');

        this.hideAlert(alert);
        this.setLoading(btn, true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        this.setLoading(btn, false);

        if (error) {
            this.showAlert(alert, 'error', this.translateError(error.message));
            return;
        }
    },

    async register() {
        const fullName = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value;
        const btn = document.getElementById('registerBtn');
        const alert = document.getElementById('registerAlert');

        this.hideAlert(alert);

        if (password.length < 6) {
            this.showAlert(alert, 'error', 'Hasło musi mieć co najmniej 6 znaków.');
            return;
        }

        this.setLoading(btn, true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone
                }
            }
        });

        this.setLoading(btn, false);

        if (error) {
            this.showAlert(alert, 'error', this.translateError(error.message));
            return;
        }
    },

    async logout() {
        await supabase.auth.signOut();
    },

    async onSignIn(session) {
        this.currentUser = session.user;
        await this.loadProfile();
        this.updateNavUI();
        Router.navigate('#/dashboard');
        this.renderDashboard();
    },

    onSignOut() {
        this.currentUser = null;
        this.currentProfile = null;
        this.updateNavUI();
        Router.navigate('#/login');
    },

    async loadProfile() {
        if (!this.currentUser) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', this.currentUser.id)
            .single();

        if (!error && data) {
            this.currentProfile = data;
        }
    },

    isTherapist() {
        return this.currentProfile?.role === 'therapist';
    },

    getDisplayName() {
        if (this.currentProfile?.full_name) {
            return this.currentProfile.full_name;
        }
        return this.currentUser?.email || 'Użytkownik';
    },

    getRoleLabel() {
        return this.isTherapist() ? 'Terapeuta' : 'Klient';
    },

    updateNavUI() {
        const navAuth = document.getElementById('navAuth');
        const navGuest = document.getElementById('navGuest');
        const navUserName = document.getElementById('navUserName');
        const navUserRole = document.getElementById('navUserRole');

        if (this.currentUser) {
            if (navAuth) navAuth.style.display = 'flex';
            if (navGuest) navGuest.style.display = 'none';
            if (navUserName) navUserName.textContent = this.getDisplayName();
            if (navUserRole) navUserRole.textContent = this.getRoleLabel();
        } else {
            if (navAuth) navAuth.style.display = 'none';
            if (navGuest) navGuest.style.display = 'flex';
        }
    },

    renderDashboard() {
        const greeting = document.getElementById('dashboardGreeting');
        const subtitle = document.getElementById('dashboardSubtitle');

        if (greeting) {
            greeting.textContent = 'Witaj, ' + this.getDisplayName() + '!';
        }
        if (subtitle) {
            subtitle.textContent = this.isTherapist()
                ? 'Panel terapeuty \u2014 zarz\u0105dzaj klientami i wizytami'
                : 'Tw\u00f3j panel klienta \u2014 przegl\u0105daj histori\u0119 i umawiaj wizyty';
        }
    },

    // Pomocnicze
    showAlert(el, type, message) {
        if (!el) return;
        el.className = 'alert ' + type + ' visible';
        el.textContent = message;
    },

    hideAlert(el) {
        if (!el) return;
        el.className = 'alert';
        el.textContent = '';
    },

    setLoading(btn, loading) {
        if (!btn) return;
        btn.disabled = loading;
        if (loading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = '';
            var spinner = document.createElement('span');
            spinner.className = 'spinner';
            btn.appendChild(spinner);
        } else {
            btn.textContent = btn.dataset.originalText || btn.textContent;
        }
    },

    translateError(msg) {
        var translations = {
            'Invalid login credentials': 'Nieprawidłowy email lub hasło.',
            'User already registered': 'Konto z tym adresem email już istnieje.',
            'Password should be at least 6 characters': 'Hasło musi mieć co najmniej 6 znaków.',
            'Unable to validate email address: invalid format': 'Nieprawidłowy format adresu email.',
            'Email rate limit exceeded': 'Zbyt wiele prób. Spróbuj ponownie za chwilę.',
        };
        return translations[msg] || ('Wystąpił błąd: ' + msg);
    }
};
