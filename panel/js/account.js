// Moduł zarządzania kontem — eksport danych, usuwanie konta (RODO art. 17 i 20)
var Account = {
    _initialized: false,

    init: function () {
        if (this._initialized) return;
        this._initialized = true;
        var self = this;

        var exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () { self.exportData(); });
        }

        var deleteBtn = document.getElementById('deleteAccountBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function () { self.confirmDeleteAccount(); });
        }

        Router.addRouteListener(function (hash) {
            if (hash === '#/account') {
                self.onEnter();
            }
        });
    },

    onEnter: function () {
        this.renderAccountInfo();
    },

    renderAccountInfo: function () {
        var container = document.getElementById('accountInfo');
        if (!container || !Auth.currentProfile) return;

        var profile = Auth.currentProfile;
        var user = Auth.currentUser;

        while (container.firstChild) container.removeChild(container.firstChild);

        var fields = [
            { label: 'Imię i nazwisko', value: profile.full_name || '—' },
            { label: 'Email', value: user ? user.email : '—' },
            { label: 'Telefon', value: profile.phone || '—' },
            { label: 'Konto utworzone', value: profile.created_at ? profile.created_at.split('T')[0] : '—' },
            { label: 'Rola', value: Auth.isTherapist() ? 'Terapeuta' : 'Klient' }
        ];

        for (var i = 0; i < fields.length; i++) {
            var row = document.createElement('div');
            row.className = 'account-info-row';
            var labelEl = document.createElement('span');
            labelEl.className = 'account-info-label';
            labelEl.textContent = fields[i].label + ':';
            row.appendChild(labelEl);
            var valueEl = document.createElement('span');
            valueEl.className = 'account-info-value';
            valueEl.textContent = fields[i].value;
            row.appendChild(valueEl);
            container.appendChild(row);
        }
    },

    // ===== Eksport danych (Art. 20 RODO) =====
    exportData: function () {
        var self = this;
        var btn = document.getElementById('exportDataBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Eksportowanie...';
        }

        var userId = Auth.currentUser ? Auth.currentUser.id : null;
        if (!userId) {
            if (btn) { btn.disabled = false; btn.textContent = 'Eksportuj moje dane'; }
            return;
        }

        var exportObj = {
            exported_at: new Date().toISOString(),
            profile: null,
            appointments: [],
            notes: [],
            total_appointments: 0,
            total_notes: 0
        };

        // Pobierz profil
        supabase.from('profiles').select('*').eq('id', userId).single()
            .then(function (result) {
                if (!result.error && result.data) {
                    exportObj.profile = {
                        full_name: result.data.full_name,
                        email: Auth.currentUser.email,
                        phone: result.data.phone,
                        role: result.data.role,
                        created_at: result.data.created_at
                    };
                }
                // Pobierz wizyty (jawny range — bez domyślnego limitu Supabase)
                return supabase.from('appointments')
                    .select('slot_date, start_time, end_time, duration_minutes, status, service_type, session_mode, notes')
                    .eq('client_id', userId)
                    .order('slot_date', { ascending: false })
                    .range(0, 9999);
            })
            .then(function (result) {
                if (!result.error && result.data) {
                    exportObj.appointments = result.data;
                    exportObj.total_appointments = result.data.length;
                }
                // Pobierz notatki z listą załączników (jawny range)
                return supabase.from('notes')
                    .select('title, content, session_date, created_at, note_attachments(id, file_name, mime_type, file_size)')
                    .eq('client_id', userId)
                    .order('session_date', { ascending: false })
                    .range(0, 9999);
            })
            .then(function (result) {
                if (!result.error && result.data) {
                    exportObj.notes = result.data;
                    exportObj.total_notes = result.data.length;
                }
                // Generuj i pobierz JSON
                self.downloadJSON(exportObj, 'szlak-rozwoju-moje-dane.json');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Eksportuj moje dane';
                }
            })
            .catch(function (err) {
                logError('Błąd eksportu danych:', err);
                alert('Wystąpił błąd podczas eksportu danych. Spróbuj ponownie.');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Eksportuj moje dane';
                }
            });
    },

    downloadJSON: function (data, filename) {
        var json = JSON.stringify(data, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // ===== Usuwanie konta (Art. 17 RODO) =====
    confirmDeleteAccount: function () {
        if (Auth.isTherapist()) {
            alert('Konto terapeuty nie może być usunięte przez panel. Skontaktuj się z administratorem.');
            return;
        }

        var confirmed = confirm(
            'UWAGA: Ta operacja jest nieodwracalna!\n\n' +
            'Zostaną trwale usunięte:\n' +
            '• Twoje konto i profil\n' +
            '• Wszystkie notatki z sesji\n' +
            '• Wszystkie załączniki (dokumenty, zdjęcia)\n' +
            '• Historia wizyt\n\n' +
            'Czy na pewno chcesz usunąć swoje konto?'
        );

        if (!confirmed) return;

        var verification = prompt('Aby potwierdzić usunięcie konta, wpisz słowo USUŃ:');
        if (verification !== 'USUŃ') {
            alert('Usuwanie konta anulowane.');
            return;
        }

        this.deleteAccount();
    },

    deleteAccount: function () {
        var btn = document.getElementById('deleteAccountBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Usuwanie...';
        }

        var filePaths = [];

        // Krok 1: RPC prepare — czyści bazę, zwraca ścieżki plików
        supabase.rpc('prepare_account_deletion')
            .then(function (result) {
                if (result.error) throw result.error;

                // RPC zwraca jsonb array ścieżek plików
                if (result.data && Array.isArray(result.data)) {
                    filePaths = result.data;
                }

                // Krok 2: Usuń pliki ze Storage (best effort — user wciąż ma token)
                if (filePaths.length > 0) {
                    return supabase.storage.from('note-attachments').remove(filePaths);
                }
                return Promise.resolve();
            })
            .then(function () {
                // Krok 3: RPC finalize — kasuje auth.users
                return supabase.rpc('finalize_account_deletion');
            })
            .then(function (result) {
                if (result.error) throw result.error;

                alert('Twoje konto zostało trwale usunięte. Dziękujemy za korzystanie z naszych usług.');

                // Wyloguj i przekieruj
                supabase.auth.signOut().then(function () {
                    window.location.href = 'index.html';
                });
            })
            .catch(function (err) {
                logError('Błąd usuwania konta:', err);
                alert('Wystąpił błąd podczas usuwania konta. Skontaktuj się z administratorem.');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Usuń moje konto';
                }
            });
    }
};
