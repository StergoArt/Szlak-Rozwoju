// Moduł sesji online — Faza 4.2
var Session = {
    _initialized: false,
    _jitsiApi: null,
    _jitsiLoaded: false,
    _appointmentId: null,
    _appointment: null,

    init: function () {
        if (this._initialized) return;
        this._initialized = true;
        var self = this;

        var endBtn = document.getElementById('sessionEndBtn');
        if (endBtn) {
            endBtn.addEventListener('click', function () { self.endSession(); });
        }

        Router.addRouteListener(function (hash) {
            if (hash.indexOf('#/session/') === 0) {
                var appointmentId = hash.substring('#/session/'.length);
                self.onEnter(appointmentId);
            } else {
                self.cleanup();
            }
        });
    },

    onEnter: function (id) {
        var self = this;
        this._appointmentId = id;
        this._appointment = null;

        var container = document.getElementById('sessionContainer');
        var info = document.getElementById('sessionInfo');
        var actions = document.getElementById('sessionActions');
        var title = document.getElementById('sessionTitle');

        if (container) { while (container.firstChild) container.removeChild(container.firstChild); }
        if (actions) actions.classList.add('u-hidden');
        if (info) info.textContent = 'Ładowanie...';
        if (title) title.textContent = 'Sesja online';

        // Weryfikacja: user zalogowany
        if (!Auth.currentUser) {
            if (info) info.textContent = 'Musisz być zalogowany.';
            return;
        }

        // Pobierz appointment
        supabase
            .from('appointments')
            .select('*, client:profiles!appointments_client_id_fkey(full_name)')
            .eq('id', id)
            .single()
            .then(function (result) {
                if (result.error || !result.data) {
                    if (info) info.textContent = 'Nie znaleziono wizyty.';
                    return;
                }

                var apt = result.data;
                self._appointment = apt;

                // Weryfikacja: session_mode = online
                if (apt.session_mode !== 'online') {
                    if (info) info.textContent = 'Ta wizyta nie jest sesją online.';
                    return;
                }

                // Weryfikacja: dostęp (terapeuta lub przypisany klient)
                var isTherapist = Auth.isTherapist();
                var isClient = apt.client_id === Auth.currentUser.id;
                if (!isTherapist && !isClient) {
                    if (info) info.textContent = 'Brak dostępu do tej sesji.';
                    return;
                }

                // Weryfikacja: status
                if (apt.status !== 'booked' && apt.status !== 'confirmed') {
                    if (info) info.textContent = 'Ta sesja nie jest aktywna.';
                    return;
                }

                // Ustaw tytuł i info
                var clientName = apt.client && apt.client.full_name ? apt.client.full_name : '';
                if (title) title.textContent = 'Sesja online' + (clientName ? ' — ' + clientName : '');

                var dayStr = apt.slot_date || '';
                var timeStr = apt.start_time ? apt.start_time.substring(0, 5) : '';
                if (info) info.textContent = dayStr + (timeStr ? ', godz. ' + timeStr : '');

                // Walidacja meeting_url (whitelist domeny)
                var meetingUrlValid = false;
                if (apt.meeting_url) {
                    try {
                        var parsedUrl = new URL(apt.meeting_url);
                        meetingUrlValid = parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'meet.jit.si';
                    } catch (e) { meetingUrlValid = false; }
                }

                // Link zewnętrzny
                var extLink = document.getElementById('sessionExternalLink');
                if (extLink && meetingUrlValid) {
                    extLink.href = apt.meeting_url;
                }

                // Mobile fallback — otwórz w nowej karcie
                if (window.innerWidth < 768) {
                    if (meetingUrlValid) {
                        window.open(apt.meeting_url, '_blank');
                    }
                    if (info) info.textContent = 'Sesja otwarta w nowej karcie. ' + (info.textContent || '');
                    if (container) {
                        var mobileHint = document.createElement('div');
                        mobileHint.style.cssText = 'text-align:center;padding:40px 20px;color:#718096;';
                        mobileHint.textContent = 'Na urządzeniu mobilnym sesja otwiera się w nowej karcie przeglądarki.';
                        container.appendChild(mobileHint);
                    }
                    if (actions) actions.classList.remove('u-hidden');
                    return;
                }

                // Desktop — osadź Jitsi
                self.loadJitsiScript().then(function () {
                    self.startJitsi();
                }).catch(function (err) {
                    logError('Błąd ładowania Jitsi:', err);
                    if (info) info.textContent = 'Nie udało się załadować wideokonferencji. Użyj linku poniżej.';
                    if (actions) actions.classList.remove('u-hidden');
                });
            })
            .catch(function (err) {
                logError('Błąd ładowania wizyty:', err);
                if (info) info.textContent = 'Wystąpił błąd podczas ładowania sesji.';
            });
    },

    loadJitsiScript: function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (self._jitsiLoaded && typeof JitsiMeetExternalAPI !== 'undefined') {
                resolve();
                return;
            }

            var script = document.createElement('script');
            script.src = 'https://meet.jit.si/external_api.js';
            script.onload = function () {
                self._jitsiLoaded = true;
                resolve();
            };
            script.onerror = function () {
                document.head.removeChild(script);
                reject(new Error('Nie udało się załadować Jitsi API'));
            };
            document.head.appendChild(script);
        });
    },

    startJitsi: function () {
        var self = this;
        var container = document.getElementById('sessionContainer');
        var actions = document.getElementById('sessionActions');
        var info = document.getElementById('sessionInfo');

        if (!container || !this._appointment || !this._appointment.meeting_url) return;

        // Wyodrębnij roomName z meeting_url
        var url = this._appointment.meeting_url;
        var roomName = url.split('/').pop();

        // Wyczyść container
        while (container.firstChild) container.removeChild(container.firstChild);

        var displayName = Auth.currentProfile ? Auth.currentProfile.full_name : 'Uczestnik';

        try {
            this._jitsiApi = new JitsiMeetExternalAPI('meet.jit.si', {
                roomName: roomName,
                parentNode: container,
                width: '100%',
                height: '100%',
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: true,
                    whiteboard: {
                        enabled: true,
                        collabServerBaseUrl: 'https://excalidraw-backend.meet.jit.si'
                    }
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'chat', 'desktop',
                        'fullscreen', 'hangup', 'whiteboard', 'tileview', 'settings'
                    ],
                    SHOW_JITSI_WATERMARK: false
                },
                userInfo: {
                    displayName: displayName
                }
            });

            this._jitsiApi.addListener('readyToClose', function () {
                self.endSession();
            });

            if (actions) actions.classList.remove('u-hidden');

            // Hint o tablicy / rysunkach
            if (info) {
                info.textContent = (info.textContent || '') +
                    ' \u2014 Aby zapisa\u0107 rysunki z tablicy, u\u017Cyj eksportu w Excalidraw, a nast\u0119pnie dodaj je jako za\u0142\u0105czniki do notatki z sesji.';
            }
        } catch (err) {
            logError('Błąd uruchamiania Jitsi:', err);
            if (info) info.textContent = 'Nie udało się uruchomić wideokonferencji.';
        }
    },

    endSession: function () {
        var apt = this._appointment;
        this.cleanup();  // First cleanup synchronously (close Jitsi)

        if (!apt) {
            window.location.hash = '#/schedule';
            return;
        }

        // Async update status to completed
        supabase
            .from('appointments')
            .update({ status: 'completed' })
            .eq('id', apt.id)
            .then(function(result) {
                if (result.error) {
                    logError('Błąd aktualizacji statusu po sesji:', result.error);
                    alert('Uwaga: sesja się zakończyła, ale wystąpił błąd zapisu statusu do bazy. Zmień status ręcznie w grafiku wizyt.');
                    window.location.hash = '#/schedule';
                    return;
                }
                // Success: offer to create note
                if (Auth.isTherapist() && confirm('Sesja zakończona. Dodać notatkę z sesji?')) {
                    Notes.pendingAppointmentContext = {
                        appointmentId: apt.id,
                        clientId: apt.client_id,
                        clientName: apt.client ? apt.client.full_name : '',
                        date: apt.slot_date
                    };
                    window.location.hash = '#/notes';
                } else {
                    window.location.hash = '#/schedule';
                }
            }).catch(function(err) {
                logError('Błąd aktualizacji statusu:', err);
                alert('Uwaga: sesja się zakończyła, ale wystąpił błąd zapisu statusu do bazy. Zmień status ręcznie w grafiku wizyt.');
                window.location.hash = '#/schedule';
            });
    },

    cleanup: function () {
        if (this._jitsiApi) {
            try {
                this._jitsiApi.dispose();
            } catch (e) {
                // ignore
            }
            this._jitsiApi = null;
        }
    }
};
