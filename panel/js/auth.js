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
            if (event === 'PASSWORD_RECOVERY' && session) {
                this.currentUser = session.user;
                Router.navigate('#/reset-password');
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

        const forgotForm = document.getElementById('forgotForm');
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.forgotPassword();
            });
        }

        const resetForm = document.getElementById('resetForm');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.resetPassword();
            });
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

        // Walidacja zgody RODO
        var consentCheckbox = document.getElementById('registerConsent');
        if (!consentCheckbox || !consentCheckbox.checked) {
            this.showAlert(alert, 'error', 'Proszę zaakceptować Politykę Prywatności.');
            return;
        }

        var pwError = this.validatePasswordStrength(password);
        if (pwError) {
            this.showAlert(alert, 'error', pwError);
            return;
        }

        this.setLoading(btn, true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone,
                    rodo_consent: true,
                    rodo_consent_at: (function() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + 'T' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0'); })()
                }
            }
        });

        this.setLoading(btn, false);

        if (error) {
            this.showAlert(alert, 'error', this.translateError(error.message));
            return;
        }

        // Email confirmation włączone — pokaż komunikat zamiast automatycznego logowania
        this.showAlert(alert, 'success',
            'Konto zostało utworzone! Sprawdź skrzynkę email (również folder spam) i kliknij link potwierdzający, aby aktywować konto.');
    },

    async logout() {
        await supabase.auth.signOut();
    },

    async forgotPassword() {
        const email = document.getElementById('forgotEmail').value.trim();
        const btn = document.getElementById('forgotBtn');
        const alert = document.getElementById('forgotAlert');

        this.hideAlert(alert);
        if (!email) {
            this.showAlert(alert, 'error', 'Podaj adres email.');
            return;
        }

        this.setLoading(btn, true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://szlak-rozwoju.pl/panel.html#/reset-password'
        });

        this.setLoading(btn, false);

        // Łap realne błędy (429 Rate Limit, server errors)
        // Anti-enumeration wbudowane w Supabase — nieistniejące emaile zwracają sukces
        if (error) {
            this.showAlert(alert, 'error', this.translateError(error.message));
            return;
        }

        this.showAlert(alert, 'success',
            'Jeśli konto z tym adresem istnieje, wysłaliśmy link do resetowania hasła. Sprawdź skrzynkę email (również folder spam).');
    },

    async resetPassword() {
        const password = document.getElementById('resetPassword').value;
        const passwordConfirm = document.getElementById('resetPasswordConfirm').value;
        const btn = document.getElementById('resetBtn');
        const alert = document.getElementById('resetAlert');

        this.hideAlert(alert);

        var pwError = this.validatePasswordStrength(password);
        if (pwError) {
            this.showAlert(alert, 'error', pwError);
            return;
        }
        if (password !== passwordConfirm) {
            this.showAlert(alert, 'error', 'Hasła nie są identyczne.');
            return;
        }

        this.setLoading(btn, true);

        const { error } = await supabase.auth.updateUser({ password });

        this.setLoading(btn, false);

        if (error) {
            this.showAlert(alert, 'error', this.translateError(error.message));
            return;
        }

        // Pokaż sukces, potem wyloguj sesję recovery po 2s
        this.showAlert(alert, 'success', 'Hasło zostało zmienione. Za chwilę zostaniesz przekierowany do logowania.');
        setTimeout(function () {
            supabase.auth.signOut(); // → onSignOut() → navigate #/login
        }, 500);
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

    validatePasswordStrength: function(password) {
        if (password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków.';
        if (!/[A-Z]/.test(password)) return 'Hasło musi zawierać co najmniej jedną wielką literę.';
        if (!/[0-9]/.test(password)) return 'Hasło musi zawierać co najmniej jedną cyfrę.';
        if (!/[^a-zA-Z0-9]/.test(password)) return 'Hasło musi zawierać co najmniej jeden znak specjalny (!@#$%^&* itp.).';
        return null;
    },

    translateError(msg) {
        var translations = {
            'Invalid login credentials': 'Nieprawidłowy email lub hasło.',
            'User already registered': 'Rejestracja nie powiodła się. Sprawdź dane i spróbuj ponownie.',
            'Password should be at least 6 characters': 'Hasło musi mieć co najmniej 8 znaków.',
            'Unable to validate email address: invalid format': 'Nieprawidłowy format adresu email.',
            'Email rate limit exceeded': 'Zbyt wiele prób. Spróbuj ponownie za chwilę.',
            'New password should be different from the old password': 'Nowe hasło musi się różnić od poprzedniego.',
            'For security purposes, you can only request this once every 60 seconds': 'Ze względów bezpieczeństwa możesz wysłać żądanie raz na 60 sekund.',
        };
        return translations[msg] || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie lub skontaktuj się z administratorem.';
    }
};
