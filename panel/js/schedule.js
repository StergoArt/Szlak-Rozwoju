// Moduł grafiku wizyt — Faza 3
var Schedule = {
    _initialized: false,
    weekOffset: 0,
    currentWeekStart: null,
    appointments: [],
    myAppointments: [],
    _loadId: 0,
    _mobileQuery: null,
    _mobileDay: 0,
    _bookingAppointmentId: null,
    _clients: [],
    _clientsLoaded: false,
    _therapistId: null,
    _viewMode: 'week',
    monthOffset: 0,
    currentMonthStart: null,
    monthAppointments: [],
    _monthAppointmentMap: {},
    _monthLoadId: 0,
    _monthCacheKey: null,
    _monthCacheTime: 0,
    _suppressMobileDayReset: false,
    _pendingInterval: null,
    _hashChangeCleanup: null,
    _acceptRequestId: null,
    _acceptRequestIsConfirm: false,

    // Stałe
    STATUS_LABELS: {
        available: 'Wolny',
        booked: 'Zarezerwowany',
        confirmed: 'Potwierdzony',
        cancelled_by_therapist: 'Odwołany',
        cancelled_by_client: 'Odwołany przez klienta',
        completed: 'Zrealizowany',
        requested: 'Propozycja'
    },
    STATUS_CSS: {
        available: 'status-available',
        booked: 'status-booked',
        confirmed: 'status-confirmed',
        cancelled_by_therapist: 'status-cancelled',
        cancelled_by_client: 'status-cancelled',
        completed: 'status-completed',
        requested: 'status-requested'
    },
    SERVICE_LABELS: {
        socjoterapia_indywidualna: 'Socjoterapia indywidualna',
        socjoterapia_grupowa: 'Socjoterapia grupowa',
        tus: 'TUS',
        zajecia_ruchowe: 'Zajęcia ruchowe',
        konsultacja: 'Konsultacja'
    },
    DAYS_PL: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'],
    DAYS_SHORT: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'],
    MONTHS_PL: ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
        'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'],
    MONTHS_NOM: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
        'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
    MONTH_CACHE_TTL: 120000,

    // ===== Inicjalizacja =====
    init: function () {
        if (this._initialized) return;
        this._initialized = true;
        var self = this;

        // Event delegation na siatce
        var grid = document.getElementById('scheduleGrid');
        if (grid) {
            grid.addEventListener('click', function (e) { self.handleGridClick(e); });
        }

        // Event delegation na moich wizytach
        var myList = document.getElementById('myAppointmentsList');
        if (myList) {
            myList.addEventListener('click', function (e) { self.handleMyAppointmentsClick(e); });
        }

        // Nawigacja tygodnia
        var prevBtn = document.getElementById('schedulePrev');
        var nextBtn = document.getElementById('scheduleNext');
        var todayBtn = document.getElementById('scheduleToday');
        if (prevBtn) prevBtn.addEventListener('click', function () { self.goToWeek(self.weekOffset - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { self.goToWeek(self.weekOffset + 1); });
        if (todayBtn) todayBtn.addEventListener('click', function () { self.goToday(); });

        // Dodaj termin
        var addBtn = document.getElementById('addSlotBtn');
        if (addBtn) addBtn.addEventListener('click', function () { self.showSlotForm(); });

        // Kopiuj tydzień
        var copyBtn = document.getElementById('copyWeekBtn');
        if (copyBtn) copyBtn.addEventListener('click', function () { self.copyWeek(); });

        // View toggle (tydzień/miesiąc)
        var viewToggle = document.getElementById('scheduleViewToggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', function(e) {
                var btn = e.target.closest('.view-toggle-btn');
                if (btn && btn.getAttribute('data-view')) {
                    self.switchView(btn.getAttribute('data-view'));
                }
            });
        }

        // Month navigation
        var monthPrevBtn = document.getElementById('scheduleMonthPrev');
        var monthNextBtn = document.getElementById('scheduleMonthNext');
        var monthTodayBtn = document.getElementById('scheduleMonthToday');
        if (monthPrevBtn) monthPrevBtn.addEventListener('click', function() { self.goToMonth(self.monthOffset - 1); });
        if (monthNextBtn) monthNextBtn.addEventListener('click', function() { self.goToMonth(self.monthOffset + 1); });
        if (monthTodayBtn) monthTodayBtn.addEventListener('click', function() { self.goMonthToday(); });

        // Month grid click delegation
        var monthGrid = document.getElementById('scheduleMonthGrid');
        if (monthGrid) {
            monthGrid.addEventListener('click', function(e) {
                var cell = e.target.closest('.month-day-cell');
                if (cell && cell.getAttribute('data-date')) {
                    self.onMonthDayClick(cell.getAttribute('data-date'));
                }
            });
        }

        // Slot form: repeat checkbox toggle
        var repeatCb = document.getElementById('slotRepeat');
        if (repeatCb) {
            repeatCb.addEventListener('change', function () {
                var weeksDiv = document.getElementById('slotRepeatWeeks');
                if (weeksDiv) weeksDiv.style.display = repeatCb.checked ? 'block' : 'none';
            });
        }

        // Slot form: toggle trybu (pojedynczy / zakres)
        var modeRadios = document.querySelectorAll('input[name="slotMode"]');
        for (var mr = 0; mr < modeRadios.length; mr++) {
            modeRadios[mr].addEventListener('change', function () {
                self.toggleSlotMode(this.value);
            });
        }

        // Slot form: submit/cancel
        var slotForm = document.getElementById('slotForm');
        if (slotForm) {
            slotForm.addEventListener('submit', function (e) { e.preventDefault(); self.saveSlot(); });
        }
        var cancelBtn = document.getElementById('slotFormCancelBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', function () { self.hideSlotForm(); });

        // Slot form: backdrop close
        var slotModal = document.getElementById('slotFormModal');
        if (slotModal) {
            slotModal.querySelector('.booking-dialog-backdrop').addEventListener('click', function () {
                self.hideSlotForm();
            });
        }

        // Booking dialog: submit/cancel
        var bookForm = document.getElementById('bookingForm');
        if (bookForm) {
            bookForm.addEventListener('submit', function (e) { e.preventDefault(); self.bookAppointment(); });
        }
        var bookCancel = document.getElementById('bookingCancelBtn');
        if (bookCancel) bookCancel.addEventListener('click', function () { self.hideBookingDialog(); });

        // Booking dialog: backdrop close
        var bookDialog = document.getElementById('bookingDialog');
        if (bookDialog) {
            bookDialog.querySelector('.booking-dialog-backdrop').addEventListener('click', function () {
                self.hideBookingDialog();
            });
        }

        // Request form (klient — propozycja terminu)
        var requestBtn = document.getElementById('requestAppointmentBtn');
        if (requestBtn) requestBtn.addEventListener('click', function () { self.showRequestForm(); });

        var requestForm = document.getElementById('requestForm');
        if (requestForm) {
            requestForm.addEventListener('submit', function (e) { e.preventDefault(); self.submitRequest(); });
        }
        var requestCancel = document.getElementById('requestFormCancelBtn');
        if (requestCancel) requestCancel.addEventListener('click', function () { self.hideRequestForm(); });

        var requestModal = document.getElementById('requestFormModal');
        if (requestModal) {
            requestModal.querySelector('.booking-dialog-backdrop').addEventListener('click', function () {
                self.hideRequestForm();
            });
        }

        // Accept request dialog
        var acceptConfirmBtn = document.getElementById('acceptRequestConfirmBtn');
        var acceptCancelBtn = document.getElementById('acceptRequestCancelBtn');
        if (acceptConfirmBtn) {
            acceptConfirmBtn.addEventListener('click', function () {
                var sessionMode = 'in_person';
                var radios = document.querySelectorAll('input[name="acceptSessionMode"]');
                for (var i = 0; i < radios.length; i++) {
                    if (radios[i].checked) { sessionMode = radios[i].value; break; }
                }
                var dialog = document.getElementById('acceptRequestDialog');
                if (dialog) dialog.style.display = 'none';

                // Reset dialog title
                var titleEl = document.getElementById('acceptRequestTitle');
                if (titleEl) titleEl.textContent = 'Akceptacja propozycji';

                if (self._acceptRequestId) {
                    if (self._acceptRequestIsConfirm) {
                        // Confirm flow: build update data with session mode
                        var updateData = { status: 'confirmed' };
                        var apt = self.findAppointment(self._acceptRequestId);
                        if (apt && apt.session_mode !== sessionMode) {
                            updateData.session_mode = sessionMode;
                            if (sessionMode === 'online') {
                                updateData.meeting_url = self.generateMeetingUrl(self._acceptRequestId);
                            } else {
                                updateData.meeting_url = null;
                            }
                        }
                        self.updateAppointment(self._acceptRequestId, updateData);
                    } else {
                        // Accept request flow
                        self.doAcceptRequest(self._acceptRequestId, sessionMode);
                    }
                }
                self._acceptRequestIsConfirm = false;
            });
        }
        if (acceptCancelBtn) {
            acceptCancelBtn.addEventListener('click', function () {
                var dialog = document.getElementById('acceptRequestDialog');
                if (dialog) dialog.style.display = 'none';
                self._acceptRequestIsConfirm = false;
                var titleEl = document.getElementById('acceptRequestTitle');
                if (titleEl) titleEl.textContent = 'Akceptacja propozycji';
            });
        }
        // Close on backdrop click
        var acceptDialog = document.getElementById('acceptRequestDialog');
        if (acceptDialog) {
            acceptDialog.querySelector('.booking-dialog-backdrop').addEventListener('click', function () {
                acceptDialog.style.display = 'none';
                self._acceptRequestIsConfirm = false;
                var titleEl = document.getElementById('acceptRequestTitle');
                if (titleEl) titleEl.textContent = 'Akceptacja propozycji';
            });
        }

        // Mobile detection
        this._mobileQuery = window.matchMedia('(max-width: 768px)');
        this._mobileQuery.addEventListener('change', function () { self.onMobileChange(); });

        // Załaduj listę klientów (cache) jeśli terapeuta
        if (Auth.isTherapist()) {
            this.loadClients();
        }

        // Router listener
        Router.addRouteListener(function (hash) {
            if (hash === '#/schedule') {
                self.onEnter();
            }
        });
    },

    // ===== Ładowanie klientów (cache) =====
    loadClients: function () {
        var self = this;
        supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'client')
            .order('full_name', { ascending: true })
            .then(function (result) {
                if (result.error) {
                    logError('Błąd ładowania klientów:', result.error);
                    return;
                }
                self._clients = result.data || [];
                self._clientsLoaded = true;
            }).catch(function (err) {
                logError('Błąd ładowania klientów:', err);
            });
    },

    // ===== Router callback =====
    onEnter: function () {
        var title = document.getElementById('scheduleTitle');
        var actions = document.getElementById('scheduleActions');
        var myAppts = document.getElementById('myAppointments');
        var clientRequest = document.getElementById('clientRequestSection');

        if (Auth.isTherapist()) {
            if (title) {
                var badge = document.getElementById('schedulePendingBadge');
                title.textContent = 'Grafik wizyt ';
                if (badge) title.appendChild(badge);
            }
            if (actions) actions.style.display = 'flex';
            if (myAppts) myAppts.style.display = 'none';
            if (clientRequest) clientRequest.style.display = 'none';
            if (!this._clientsLoaded) {
                this.loadClients();
            }
            // Badge & polling
            this.updatePendingCount();
            if (this._pendingInterval) clearInterval(this._pendingInterval);
            if (this._hashChangeCleanup) {
                window.removeEventListener('hashchange', this._hashChangeCleanup);
                this._hashChangeCleanup = null;
            }
            var self = this;
            this._pendingInterval = setInterval(function() {
                self.updatePendingCount();
            }, 60000);
            // Cleanup polling when leaving schedule view
            this._hashChangeCleanup = function() {
                if (window.location.hash.indexOf('#/schedule') !== 0) {
                    if (self._pendingInterval) {
                        clearInterval(self._pendingInterval);
                        self._pendingInterval = null;
                    }
                    window.removeEventListener('hashchange', self._hashChangeCleanup);
                    self._hashChangeCleanup = null;
                }
            };
            window.addEventListener('hashchange', this._hashChangeCleanup);
        } else {
            if (title) title.textContent = 'Rezerwacja wizyty';
            if (actions) actions.style.display = 'none';
            if (myAppts) myAppts.style.display = 'block';
            if (clientRequest) clientRequest.style.display = '';
            this.loadMyAppointments();
            this.loadTherapistId();
        }

        if (this._viewMode === 'month') {
            this.goToMonth(this.monthOffset);
        } else {
            this.goToWeek(this.weekOffset);
        }
    },

    // ===== Nawigacja tygodni =====
    getWeekStart: function (offset) {
        var now = new Date();
        var day = now.getDay();
        var diff = day === 0 ? -6 : 1 - day;
        var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff + (offset * 7));
        return monday;
    },

    goToWeek: function (offset) {
        this.weekOffset = offset;
        this.currentWeekStart = this.getWeekStart(offset);
        this.renderWeekHeader();
        this.loadWeekAppointments();
    },

    goToday: function () {
        this.goToWeek(0);
        if (this.isMobile()) {
            var today = new Date();
            var day = today.getDay();
            this._mobileDay = day === 0 ? 6 : day - 1;
            this.updateMobileDay();
        }
    },

    // ===== Renderowanie nagłówka tygodnia =====
    renderWeekHeader: function () {
        var label = document.getElementById('scheduleWeekLabel');
        if (!label) return;
        var start = this.currentWeekStart;
        var end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
        var startStr = start.getDate() + '';
        var endStr = end.getDate() + ' ' + this.MONTHS_PL[end.getMonth()] + ' ' + end.getFullYear();
        if (start.getMonth() !== end.getMonth()) {
            startStr = start.getDate() + ' ' + this.MONTHS_PL[start.getMonth()];
        }
        label.textContent = startStr + ' \u2013 ' + endStr;
    },

    // ===== Ładowanie danych =====
    loadWeekAppointments: function () {
        var self = this;
        var loadId = ++this._loadId;
        var weekStart = this.formatDateForDB(this.currentWeekStart);
        var weekEndDate = new Date(this.currentWeekStart.getFullYear(), this.currentWeekStart.getMonth(), this.currentWeekStart.getDate() + 6);
        var weekEnd = this.formatDateForDB(weekEndDate);

        // Pokaż spinner
        var grid = document.getElementById('scheduleGrid');
        if (grid) {
            this.clearElement(grid);
            var spinner = document.createElement('div');
            spinner.className = 'spinner-container';
            spinner.style.gridColumn = '1 / -1';
            var sp = document.createElement('span');
            sp.className = 'spinner';
            spinner.appendChild(sp);
            grid.appendChild(spinner);
        }

        var query = supabase
            .from('appointments')
            .select('*, client:profiles!appointments_client_id_fkey(full_name)')
            .gte('slot_date', weekStart)
            .lte('slot_date', weekEnd)
            .order('slot_date', { ascending: true })
            .order('start_time', { ascending: true });

        query.then(function (result) {
            if (self._loadId !== loadId) return;
            if (result.error) {
                logError('Błąd ładowania grafiku:', result.error);
                self.appointments = [];
            } else {
                self.appointments = result.data || [];
            }
            self.renderWeekGrid();
        }).catch(function (err) {
            if (self._loadId !== loadId) return;
            logError('Błąd ładowania grafiku:', err);
            self.appointments = [];
            self.renderWeekGrid();
        });
    },

    loadMyAppointments: function () {
        var self = this;
        if (!Auth.currentUser) return;

        var todayStr = this.formatDateForDB(new Date());

        supabase
            .from('appointments')
            .select('*, session_notes:notes!notes_appointment_id_fkey(id, title)')
            .eq('client_id', Auth.currentUser.id)
            .gte('slot_date', todayStr)
            .in('status', ['booked', 'confirmed', 'requested'])
            .order('slot_date', { ascending: true })
            .order('start_time', { ascending: true })
            .then(function (result) {
                if (result.error) {
                    logError('Błąd ładowania wizyt:', result.error);
                    self.myAppointments = [];
                } else {
                    self.myAppointments = result.data || [];
                }
                self.renderMyAppointments();
            }).catch(function (err) {
                logError('Błąd ładowania wizyt:', err);
            });
    },

    updatePendingCount: function() {
        if (!Auth.isTherapist()) return;
        var todayStr = this.formatDateForDB(new Date());
        supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .in('status', ['booked', 'requested'])
            .gte('slot_date', todayStr)
            .then(function(result) {
                var count = (result && result.count) || 0;
                var badge = document.getElementById('schedulePendingBadge');
                if (badge) {
                    badge.textContent = count > 0 ? count : '';
                    badge.style.display = count > 0 ? 'inline-flex' : 'none';
                }
            }).catch(function(err) {
                logError('Błąd ładowania oczekujących:', err);
            });
    },

    // ===== Renderowanie siatki =====
    renderWeekGrid: function () {
        var grid = document.getElementById('scheduleGrid');
        if (!grid) return;
        this.clearElement(grid);

        var isTherapist = Auth.isTherapist();
        var today = new Date();
        var todayStr = this.formatDateForDB(today);

        // Mobile day navigation (tworzone raz, insertowane przed gridem)
        var dayNavHtml = document.querySelector('.schedule-day-view-nav');
        if (!dayNavHtml) {
            dayNavHtml = document.createElement('div');
            dayNavHtml.className = 'schedule-day-view-nav';
            var self = this;

            var prevDayBtn = document.createElement('button');
            prevDayBtn.className = 'btn-icon-nav';
            prevDayBtn.textContent = '\u2039'; // ‹
            prevDayBtn.setAttribute('aria-label', 'Poprzedni dzie\u0144');
            prevDayBtn.addEventListener('click', function () {
                self._mobileDay = (self._mobileDay - 1 + 7) % 7;
                self.updateMobileDay();
            });

            var dayLabel = document.createElement('span');
            dayLabel.className = 'day-label';
            dayLabel.id = 'mobileDayLabel';

            var nextDayBtn = document.createElement('button');
            nextDayBtn.className = 'btn-icon-nav';
            nextDayBtn.textContent = '\u203A'; // ›
            nextDayBtn.setAttribute('aria-label', 'Nast\u0119pny dzie\u0144');
            nextDayBtn.addEventListener('click', function () {
                self._mobileDay = (self._mobileDay + 1) % 7;
                self.updateMobileDay();
            });

            dayNavHtml.appendChild(prevDayBtn);
            dayNavHtml.appendChild(dayLabel);
            dayNavHtml.appendChild(nextDayBtn);
            grid.parentNode.insertBefore(dayNavHtml, grid);
        }

        for (var d = 0; d < 7; d++) {
            var dayDate = new Date(this.currentWeekStart.getFullYear(), this.currentWeekStart.getMonth(), this.currentWeekStart.getDate() + d);
            var dayStr = this.formatDateForDB(dayDate);
            var isPast = dayStr < todayStr;
            var isToday = dayStr === todayStr;

            var col = document.createElement('div');
            col.className = 'schedule-day-column';
            col.setAttribute('data-day-index', d);
            col.setAttribute('data-date', dayStr);

            var header = document.createElement('div');
            header.className = 'schedule-day-header';
            if (isToday) header.classList.add('today');
            if (isPast) header.classList.add('past');

            var dayName = document.createElement('span');
            dayName.className = 'day-name';
            dayName.textContent = this.DAYS_SHORT[d];
            header.appendChild(dayName);

            var dayNum = document.createElement('span');
            dayNum.className = 'day-number';
            dayNum.textContent = dayDate.getDate();
            header.appendChild(dayNum);

            col.appendChild(header);

            var slotsContainer = document.createElement('div');
            slotsContainer.className = 'schedule-day-slots';

            var dayAppointments = this.getAppointmentsForDay(dayStr, isTherapist);

            if (dayAppointments.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'schedule-day-empty';
                empty.textContent = isPast ? '\u2014' : 'Brak termin\u00F3w';
                slotsContainer.appendChild(empty);
            } else {
                for (var i = 0; i < dayAppointments.length; i++) {
                    var card = this.renderSlotCard(dayAppointments[i], isTherapist, isPast);
                    slotsContainer.appendChild(card);
                }
            }

            col.appendChild(slotsContainer);
            grid.appendChild(col);
        }

        // Mobile: ustaw aktywny dzień
        if (this.isMobile()) {
            if (!this._suppressMobileDayReset && this.weekOffset === 0) {
                var todayObj = new Date();
                var dow = todayObj.getDay();
                this._mobileDay = dow === 0 ? 6 : dow - 1;
            }
            this._suppressMobileDayReset = false;
            this.updateMobileDay();
        }
    },

    getAppointmentsForDay: function (dayStr, isTherapist) {
        var result = [];
        for (var i = 0; i < this.appointments.length; i++) {
            var apt = this.appointments[i];
            if (apt.slot_date !== dayStr) continue;
            if (!isTherapist) {
                if (apt.status !== 'available' && apt.client_id !== Auth.currentUser.id) continue;
            }
            result.push(apt);
        }
        return result;
    },

    renderSlotCard: function (apt, isTherapist, isPast) {
        var card = document.createElement('div');
        card.className = 'slot-card ' + (this.STATUS_CSS[apt.status] || '');
        card.setAttribute('data-appointment-id', apt.id);

        var time = document.createElement('div');
        time.className = 'slot-time';
        time.textContent = this.formatTime(apt.start_time) + ' \u2013 ' + this.formatTime(apt.end_time);
        card.appendChild(time);

        var status = document.createElement('div');
        status.className = 'slot-status';
        status.textContent = this.STATUS_LABELS[apt.status] || apt.status;
        card.appendChild(status);

        var dur = document.createElement('div');
        dur.className = 'slot-duration';
        dur.textContent = apt.duration_minutes + ' min';
        card.appendChild(dur);

        if (isTherapist && apt.client && apt.client.full_name) {
            var clientName = document.createElement('div');
            clientName.className = 'slot-client';
            clientName.textContent = apt.client.full_name;
            card.appendChild(clientName);
        }

        if (apt.service_type && this.SERVICE_LABELS[apt.service_type]) {
            var svc = document.createElement('div');
            svc.className = 'slot-service';
            svc.textContent = this.SERVICE_LABELS[apt.service_type];
            card.appendChild(svc);
        }

        if (isTherapist && apt.notes) {
            var notes = document.createElement('div');
            notes.className = 'slot-notes';
            notes.textContent = apt.notes;
            card.appendChild(notes);
        }

        // Badge "Online"
        if (apt.session_mode === 'online') {
            var onlineTag = document.createElement('div');
            onlineTag.className = 'slot-online-tag';
            onlineTag.textContent = 'Online';
            card.appendChild(onlineTag);
        }

        // Link do sesji online (terapeuta)
        if (isTherapist && apt.session_mode === 'online' && apt.meeting_url
            && (apt.status === 'booked' || apt.status === 'confirmed')) {
            var joinLink = document.createElement('a');
            joinLink.className = 'slot-join-link';
            joinLink.href = '#/session/' + apt.id;
            joinLink.textContent = 'Sesja online \u2192';
            card.appendChild(joinLink);
        }

        var actions = document.createElement('div');
        actions.className = 'slot-actions';
        var timeCtx = this.formatTime(apt.start_time);

        if (isTherapist) {
            if (apt.status === 'available' && !isPast) {
                actions.appendChild(this.createActionBtn('Usu\u0144', 'delete', apt.id, 'btn-slot-delete', 'termin ' + timeCtx));
            } else if (apt.status === 'booked') {
                actions.appendChild(this.createActionBtn('Potwierd\u017A', 'confirm', apt.id, 'btn-slot-confirm', 'wizyt\u0119 ' + timeCtx));
                actions.appendChild(this.createActionBtn('Odwo\u0142aj', 'cancel-therapist', apt.id, 'btn-slot-delete', 'wizyt\u0119 ' + timeCtx));
            } else if (apt.status === 'confirmed' && !isPast) {
                actions.appendChild(this.createActionBtn('Odwo\u0142aj', 'cancel-therapist', apt.id, 'btn-slot-delete', 'wizyt\u0119 ' + timeCtx));
                actions.appendChild(this.createActionBtn('Zrealizowana', 'complete', apt.id, '', 'wizyta ' + timeCtx));
            } else if (apt.status === 'requested') {
                actions.appendChild(this.createActionBtn('Akceptuj', 'accept-request', apt.id, 'btn-slot-confirm', 'propozycj\u0119 ' + timeCtx));
                actions.appendChild(this.createActionBtn('Odrzu\u0107', 'reject-request', apt.id, 'btn-slot-delete', 'propozycj\u0119 ' + timeCtx));
            }
        } else {
            if (apt.status === 'available' && !isPast && !this.isSlotPastTime(apt)) {
                actions.appendChild(this.createActionBtn('Rezerwuj', 'book', apt.id, 'btn-slot-confirm', 'wizyt\u0119 na ' + timeCtx));
            }
        }

        if (actions.children.length > 0) {
            card.appendChild(actions);
        }

        return card;
    },

    createActionBtn: function (label, action, id, extraClass, ariaContext) {
        var btn = document.createElement('button');
        btn.textContent = label;
        btn.setAttribute('data-action', action);
        btn.setAttribute('data-id', id);
        if (extraClass) btn.classList.add(extraClass);
        if (ariaContext) btn.setAttribute('aria-label', label + ' \u2014 ' + ariaContext);
        return btn;
    },

    // ===== Mobile =====
    isMobile: function () {
        return this._mobileQuery && this._mobileQuery.matches;
    },

    onMobileChange: function () {
        if (this.isMobile()) {
            var today = new Date();
            var dow = today.getDay();
            this._mobileDay = dow === 0 ? 6 : dow - 1;
        }
        this.updateMobileDay();
    },

    updateMobileDay: function () {
        var columns = document.querySelectorAll('.schedule-day-column');
        for (var i = 0; i < columns.length; i++) {
            columns[i].classList.remove('active-day');
        }
        if (columns[this._mobileDay]) {
            columns[this._mobileDay].classList.add('active-day');
        }

        var label = document.getElementById('mobileDayLabel');
        if (label && this.currentWeekStart) {
            var dayDate = new Date(this.currentWeekStart.getFullYear(), this.currentWeekStart.getMonth(), this.currentWeekStart.getDate() + this._mobileDay);
            label.textContent = this.DAYS_PL[this._mobileDay] + ', ' + dayDate.getDate() + ' ' + this.MONTHS_PL[dayDate.getMonth()];
        }
    },

    // ===== Event handlers =====
    handleGridClick: function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-action');
        var id = btn.getAttribute('data-id');

        switch (action) {
            case 'delete': this.deleteSlot(id); break;
            case 'confirm': this.confirmAppointment(id); break;
            case 'cancel-therapist': this.cancelAppointment(id); break;
            case 'complete': this.completeAppointment(id); break;
            case 'book': this.showBookingDialog(id); break;
            case 'accept-request': this.acceptRequest(id); break;
            case 'reject-request': this.rejectRequest(id); break;
        }
    },

    handleMyAppointmentsClick: function (e) {
        var btn = e.target.closest('[data-action="cancel-my"], [data-action="cancel-request"]');
        if (!btn) return;
        var action = btn.getAttribute('data-action');
        var id = btn.getAttribute('data-id');
        if (action === 'cancel-request') {
            this.cancelMyRequest(id);
        } else {
            this.cancelMyBooking(id);
        }
    },

    // ===== Terapeuta: CRUD slotów =====
    showSlotForm: function (prefillDate) {
        var modal = document.getElementById('slotFormModal');
        if (!modal) return;
        var dateInput = document.getElementById('slotDate');
        var timeInput = document.getElementById('slotStartTime');
        var alertEl = document.getElementById('slotFormAlert');

        if (alertEl) { alertEl.style.display = 'none'; alertEl.textContent = ''; }
        if (dateInput) dateInput.value = prefillDate || this.formatDateForDB(new Date());
        if (timeInput) timeInput.value = '09:00';
        var radios = document.querySelectorAll('input[name="slotDuration"]');
        for (var i = 0; i < radios.length; i++) {
            radios[i].checked = radios[i].value === '50';
        }
        var serviceSelect = document.getElementById('slotServiceType');
        if (serviceSelect) serviceSelect.value = '';
        // Reset i populate select klienta
        var clientSelect = document.getElementById('slotClientId');
        if (clientSelect) {
            while (clientSelect.firstChild) clientSelect.removeChild(clientSelect.firstChild);
            var defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = '\u2014 Nie przypisuj klienta \u2014';
            clientSelect.appendChild(defaultOpt);
            for (var c = 0; c < this._clients.length; c++) {
                var opt = document.createElement('option');
                opt.value = this._clients[c].id;
                opt.textContent = this._clients[c].full_name;
                clientSelect.appendChild(opt);
            }
        }
        // Reset radio trybu sesji
        var modeRadios = document.querySelectorAll('input[name="slotSessionMode"]');
        for (var m = 0; m < modeRadios.length; m++) {
            modeRadios[m].checked = modeRadios[m].value === 'in_person';
        }
        // Reset textarea notatek
        var notesTextarea = document.getElementById('slotNotes');
        if (notesTextarea) notesTextarea.value = '';
        var repeatCb = document.getElementById('slotRepeat');
        if (repeatCb) repeatCb.checked = false;
        var weeksDiv = document.getElementById('slotRepeatWeeks');
        if (weeksDiv) weeksDiv.style.display = 'none';
        var countInput = document.getElementById('slotRepeatCount');
        if (countInput) countInput.value = '4';

        // Reset trybu na "Pojedynczy termin"
        var slotModeRadios = document.querySelectorAll('input[name="slotMode"]');
        for (var mi2 = 0; mi2 < slotModeRadios.length; mi2++) {
            slotModeRadios[mi2].checked = slotModeRadios[mi2].value === 'single';
        }
        this.toggleSlotMode('single');

        modal.style.display = 'flex';
    },

    toggleSlotMode: function (mode) {
        var rangeEndGroup = document.getElementById('slotRangeEndGroup');
        var durationGroup = document.getElementById('slotDurationGroup');
        var rangeDurationGroup = document.getElementById('slotRangeDurationGroup');
        var breakGroup = document.getElementById('slotBreakGroup');

        if (mode === 'range') {
            if (rangeEndGroup) rangeEndGroup.style.display = '';
            if (durationGroup) durationGroup.style.display = 'none';
            if (rangeDurationGroup) rangeDurationGroup.style.display = '';
            if (breakGroup) breakGroup.style.display = '';
        } else {
            if (rangeEndGroup) rangeEndGroup.style.display = 'none';
            if (durationGroup) durationGroup.style.display = '';
            if (rangeDurationGroup) rangeDurationGroup.style.display = 'none';
            if (breakGroup) breakGroup.style.display = 'none';
        }
    },

    hideSlotForm: function () {
        var modal = document.getElementById('slotFormModal');
        if (modal) modal.style.display = 'none';
    },

    saveSlot: function () {
        var self = this;
        var dateInput = document.getElementById('slotDate');
        var timeInput = document.getElementById('slotStartTime');
        var saveBtn = document.getElementById('slotFormSaveBtn');

        var dateVal = dateInput ? dateInput.value : '';
        var startTimeVal = timeInput ? timeInput.value : '';

        if (!dateVal || !startTimeVal) {
            this.showSlotAlert('Podaj dat\u0119 i godzin\u0119.');
            return;
        }

        // Sprawdź tryb: pojedynczy vs zakres
        var isRangeMode = false;
        var modeRadio = document.querySelector('input[name="slotMode"]:checked');
        if (modeRadio && modeRadio.value === 'range') isRangeMode = true;

        var durationVal = 50;
        if (isRangeMode) {
            var rangeDurSelect = document.getElementById('slotRangeDuration');
            durationVal = rangeDurSelect ? parseInt(rangeDurSelect.value) : 50;
        } else {
            var radios = document.querySelectorAll('input[name="slotDuration"]');
            for (var i = 0; i < radios.length; i++) {
                if (radios[i].checked) { durationVal = parseInt(radios[i].value); break; }
            }
        }

        var parts = startTimeVal.split(':');
        var startMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);

        var serviceSelect = document.getElementById('slotServiceType');
        var serviceVal = serviceSelect ? serviceSelect.value : '';

        var clientSelect = document.getElementById('slotClientId');
        var clientId = clientSelect && clientSelect.value ? clientSelect.value : null;

        var notesTextarea = document.getElementById('slotNotes');
        var notesVal = notesTextarea ? notesTextarea.value.trim() : '';

        // Odczyt trybu sesji
        var sessionMode = 'in_person';
        var sessionModeRadios = document.querySelectorAll('input[name="slotSessionMode"]');
        for (var mi = 0; mi < sessionModeRadios.length; mi++) {
            if (sessionModeRadios[mi].checked) { sessionMode = sessionModeRadios[mi].value; break; }
        }

        var repeatCb = document.getElementById('slotRepeat');
        var repeatCount = 1;
        if (repeatCb && repeatCb.checked) {
            var countInput = document.getElementById('slotRepeatCount');
            repeatCount = Math.min(Math.max(parseInt(countInput.value) || 1, 1), 12);
        }

        var slotStatus = clientId ? 'booked' : 'available';

        // Generowanie slotów
        var timeSlots = [];
        if (isRangeMode) {
            var rangeEndInput = document.getElementById('slotRangeEndTime');
            var rangeEndVal = rangeEndInput ? rangeEndInput.value : '';
            if (!rangeEndVal) {
                this.showSlotAlert('Podaj godzin\u0119 ko\u0144cow\u0105 zakresu.');
                return;
            }
            var rangeEndParts = rangeEndVal.split(':');
            var rangeEndMinutes = parseInt(rangeEndParts[0]) * 60 + parseInt(rangeEndParts[1]);
            var breakSelect = document.getElementById('slotBreakTime');
            var breakMinutes = breakSelect ? parseInt(breakSelect.value) : 0;
            var step = durationVal + breakMinutes;

            if (rangeEndMinutes <= startMinutes) {
                this.showSlotAlert('Godzina ko\u0144cowa musi by\u0107 p\u00F3\u017Aniejsza ni\u017C pocz\u0105tkowa.');
                return;
            }

            for (var cursor = startMinutes; cursor + durationVal <= rangeEndMinutes; cursor += step) {
                var sH = Math.floor(cursor / 60);
                var sM = cursor % 60;
                var eH = Math.floor((cursor + durationVal) / 60);
                var eM = (cursor + durationVal) % 60;
                if (eH >= 24) break;
                timeSlots.push({
                    start: String(sH).padStart(2, '0') + ':' + String(sM).padStart(2, '0'),
                    end: String(eH).padStart(2, '0') + ':' + String(eM).padStart(2, '0')
                });
            }

            if (timeSlots.length === 0) {
                this.showSlotAlert('Zakres jest za kr\u00F3tki dla wybranej d\u0142ugo\u015Bci sesji.');
                return;
            }
        } else {
            // Tryb pojedynczy — jeden slot
            var endMinutes = startMinutes + durationVal;
            var endH = Math.floor(endMinutes / 60);
            var endM = endMinutes % 60;
            if (endH >= 24) {
                this.showSlotAlert('Termin wykracza poza dzie\u0144.');
                return;
            }
            timeSlots.push({
                start: startTimeVal,
                end: String(endH).padStart(2, '0') + ':' + String(endM).padStart(2, '0')
            });
        }

        // Walidacja: max 50 rekordów
        var totalRecords = timeSlots.length * repeatCount;
        if (totalRecords > 50) {
            this.showSlotAlert('Za du\u017Co termin\u00F3w (' + totalRecords + '). Maksymalnie 50 na raz.');
            return;
        }

        var records = [];
        for (var w = 0; w < repeatCount; w++) {
            var slotDate = this.addDays(this.parseLocalDate(dateVal), w * 7);
            for (var t = 0; t < timeSlots.length; t++) {
                var ts = timeSlots[t];
                var recordId = this.generateUUID();
                var record = {
                    id: recordId,
                    slot_date: this.formatDateForDB(slotDate),
                    start_time: ts.start + ':00',
                    end_time: ts.end + ':00',
                    duration_minutes: durationVal,
                    status: slotStatus,
                    therapist_id: Auth.currentUser.id,
                    service_type: serviceVal || null,
                    client_id: clientId,
                    notes: notesVal,
                    session_mode: sessionMode,
                    meeting_url: (sessionMode === 'online') ? this.generateMeetingUrl(recordId) : null
                };
                if (clientId) {
                    record.booked_at = (function() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + 'T' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0'); })();
                }
                records.push(record);
            }
        }

        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Zapisywanie...'; }

        supabase
            .from('appointments')
            .insert(records)
            .then(function (result) {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Zapisz'; }
                if (result.error) {
                    var msg = 'B\u0142\u0105d zapisu.';
                    if (result.error.code === '23514' || (result.error.message && result.error.message.indexOf('overlap') !== -1)) {
                        msg = isRangeMode
                            ? 'Nie mo\u017Cna utworzy\u0107 zakresu: przynajmniej jeden z termin\u00F3w koliduje z istniej\u0105cym grafikiem.'
                            : 'Termin nak\u0142ada si\u0119 z istniej\u0105cym.';
                    }
                    self.showSlotAlert(msg);
                    return;
                }
                self.hideSlotForm();
                self.loadWeekAppointments();
                self.invalidateMonthCache();
            }).catch(function (err) {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Zapisz'; }
                logError('Błąd zapisu slotu:', err);
                self.showSlotAlert('Wyst\u0105pi\u0142 b\u0142\u0105d.');
            });
    },

    showSlotAlert: function (msg) {
        var alertEl = document.getElementById('slotFormAlert');
        if (alertEl) {
            alertEl.textContent = msg;
            alertEl.style.display = 'block';
            alertEl.classList.add('visible');
        }
    },

    deleteSlot: function (id) {
        if (!confirm('Czy na pewno chcesz usun\u0105\u0107 ten wolny termin?')) return;
        var self = this;
        supabase
            .from('appointments')
            .delete()
            .eq('id', id)
            .then(function (result) {
                if (result.error) {
                    alert('Nie uda\u0142o si\u0119 usun\u0105\u0107 terminu.');
                    logError('Błąd usuwania terminu:', result.error);
                    return;
                }
                self.loadWeekAppointments();
                self.invalidateMonthCache();
            }).catch(function (err) {
                logError('Błąd usuwania:', err);
            });
    },

    confirmAppointment: function(id) {
        var apt = this.findAppointment(id);
        if (!apt) return;

        // Reuse the accept request dialog for confirm flow
        this._acceptRequestId = id;
        this._acceptRequestIsConfirm = true;

        var details = document.getElementById('acceptRequestDetails');
        if (details) {
            var dateObj = this.parseLocalDate(apt.slot_date);
            var dayName = this.DAYS_PL[this.getDayIndex(dateObj)];
            details.innerHTML = '<p><strong>' + dayName + ', ' + dateObj.getDate() + ' ' + this.MONTHS_PL[dateObj.getMonth()] + ' ' + dateObj.getFullYear() + '</strong></p>'
                + '<p>' + this.formatTime(apt.start_time) + ' \u2013 ' + this.formatTime(apt.end_time) + ' (' + apt.duration_minutes + ' min)</p>'
                + (apt.client ? '<p>Klient: ' + this.escapeHtml(apt.client.full_name) + '</p>' : '')
                + (apt.notes ? '<p>Uwagi: ' + this.escapeHtml(apt.notes) + '</p>' : '');
        }

        // Set dialog title for confirm flow
        var title = document.getElementById('acceptRequestTitle');
        if (title) title.textContent = 'Potwierdzenie wizyty';

        // Pre-select current session mode
        var modeRadios = document.querySelectorAll('input[name="acceptSessionMode"]');
        for (var i = 0; i < modeRadios.length; i++) {
            modeRadios[i].checked = modeRadios[i].value === (apt.session_mode || 'in_person');
        }

        var dialog = document.getElementById('acceptRequestDialog');
        if (dialog) dialog.style.display = '';
    },

    cancelAppointment: function (id) {
        if (!confirm('Czy na pewno chcesz odwo\u0142a\u0107 t\u0119 wizyt\u0119?')) return;
        this.updateStatus(id, 'cancelled_by_therapist');
    },

    completeAppointment: function (id) {
        this.updateStatus(id, 'completed');
    },

    updateStatus: function (id, newStatus) {
        var self = this;
        supabase
            .from('appointments')
            .update({ status: newStatus })
            .eq('id', id)
            .then(function (result) {
                if (result.error) {
                    alert('Nie uda\u0142o si\u0119 zmieni\u0107 statusu.');
                    logError('Błąd aktualizacji statusu:', result.error);
                    return;
                }
                self.loadWeekAppointments();
                self.invalidateMonthCache();
            }).catch(function (err) {
                logError('Błąd aktualizacji statusu:', err);
            });
    },

    copyWeek: function () {
        var self = this;
        // Kopiuj WSZYSTKIE nie-anulowane sloty jako szablon pracy
        var toCopy = [];
        for (var i = 0; i < this.appointments.length; i++) {
            var s = this.appointments[i].status;
            if (s !== 'cancelled_by_therapist' && s !== 'cancelled_by_client' && s !== 'requested') {
                toCopy.push(this.appointments[i]);
            }
        }

        if (toCopy.length === 0) {
            alert('Brak termin\u00F3w do skopiowania w bie\u017C\u0105cym tygodniu.');
            return;
        }

        if (!confirm('Skopiowa\u0107 ' + toCopy.length + ' termin\u00F3w jako wolne sloty na nast\u0119pny tydzie\u0144?')) return;

        var records = [];
        for (var j = 0; j < toCopy.length; j++) {
            var apt = toCopy[j];
            var newDate = this.addDays(this.parseLocalDate(apt.slot_date), 7);
            var copyId = this.generateUUID();
            records.push({
                id: copyId,
                slot_date: this.formatDateForDB(newDate),
                start_time: apt.start_time,
                end_time: apt.end_time,
                duration_minutes: apt.duration_minutes,
                status: 'available',
                therapist_id: Auth.currentUser.id,
                service_type: apt.service_type,
                client_id: null,
                booked_at: null,
                notes: '',
                session_mode: apt.session_mode || 'in_person',
                meeting_url: (apt.session_mode === 'online') ? this.generateMeetingUrl(copyId) : null
            });
        }

        supabase
            .from('appointments')
            .insert(records)
            .then(function (result) {
                if (result.error) {
                    var msg = 'Nie uda\u0142o si\u0119 skopiowa\u0107.';
                    if (result.error.message && result.error.message.indexOf('overlap') !== -1) {
                        msg = 'Niekt\u00F3re terminy nak\u0142adaj\u0105 si\u0119 z istniej\u0105cymi.';
                    }
                    alert(msg);
                    logError('Błąd kopiowania tygodnia:', result.error);
                    return;
                }
                alert('Skopiowano ' + toCopy.length + ' termin\u00F3w na nast\u0119pny tydzie\u0144.');
                self.goToWeek(self.weekOffset + 1);
                self.invalidateMonthCache();
            }).catch(function (err) {
                logError('Błąd kopiowania:', err);
                alert('Wyst\u0105pi\u0142 b\u0142\u0105d podczas kopiowania.');
            });
    },

    // ===== Klient: rezerwacja =====
    showBookingDialog: function (appointmentId) {
        var apt = this.findAppointment(appointmentId);
        if (!apt) return;

        this._bookingAppointmentId = appointmentId;
        var dialog = document.getElementById('bookingDialog');
        var details = document.getElementById('bookingDialogDetails');
        var serviceSelect = document.getElementById('bookingServiceType');
        var confirmBtn = document.getElementById('bookingConfirmBtn');
        var cancelBtnEl = document.getElementById('bookingCancelBtn');

        // Reset do stanu rezerwacji
        var h3 = document.getElementById('bookingDialogTitle');
        if (h3) h3.textContent = 'Potwierdzenie rezerwacji';
        if (confirmBtn) { confirmBtn.style.display = ''; confirmBtn.textContent = 'Zarezerwuj'; }
        if (cancelBtnEl) cancelBtnEl.textContent = 'Anuluj';
        if (serviceSelect) serviceSelect.parentNode.style.display = '';

        if (details) {
            this.clearElement(details);
            details.style.background = '';

            var dayDate = this.parseLocalDate(apt.slot_date);
            var dayIndex = this.getDayIndex(dayDate);

            var line1 = document.createElement('div');
            line1.style.fontWeight = '600';
            line1.textContent = this.DAYS_PL[dayIndex] + ', ' + dayDate.getDate() + ' ' + this.MONTHS_PL[dayDate.getMonth()] + ' ' + dayDate.getFullYear();
            details.appendChild(line1);

            var line2 = document.createElement('div');
            line2.textContent = 'Godzina: ' + this.formatTime(apt.start_time) + ' \u2013 ' + this.formatTime(apt.end_time) + ' (' + apt.duration_minutes + ' min)';
            details.appendChild(line2);
        }

        if (serviceSelect) serviceSelect.value = apt.service_type || '';
        if (dialog) dialog.style.display = 'flex';
    },

    hideBookingDialog: function () {
        var dialog = document.getElementById('bookingDialog');
        if (dialog) dialog.style.display = 'none';
        this._bookingAppointmentId = null;
    },

    bookAppointment: function () {
        var self = this;
        if (!this._bookingAppointmentId || !Auth.currentUser) return;

        var confirmBtn = document.getElementById('bookingConfirmBtn');
        var serviceSelect = document.getElementById('bookingServiceType');
        var serviceType = serviceSelect ? serviceSelect.value : null;

        if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Rezerwowanie...'; }

        supabase
            .rpc('book_appointment', {
                p_appointment_id: this._bookingAppointmentId,
                p_client_id: Auth.currentUser.id,
                p_service_type: serviceType || null
            })
            .then(function (result) {
                if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Zarezerwuj'; }

                if (result.error) {
                    self.hideBookingDialog();
                    self.showErrorModal('Wyst\u0105pi\u0142 b\u0142\u0105d podczas rezerwacji. Spr\u00F3buj ponownie.');
                    self.loadWeekAppointments();
                    self.invalidateMonthCache();
                    return;
                }

                var data = result.data;
                if (!data || !data.success) {
                    self.hideBookingDialog();
                    self.showErrorModal('Niestety, kto\u015B w\u0142a\u015Bnie zarezerwowa\u0142 ten termin. Widok zosta\u0142 od\u015Bwie\u017Cony.');
                    self.loadWeekAppointments();
                    self.invalidateMonthCache();
                    if (!Auth.isTherapist()) self.loadMyAppointments();
                    return;
                }

                self.hideBookingDialog();
                self.loadWeekAppointments();
                self.loadMyAppointments();
                self.invalidateMonthCache();
            }).catch(function (err) {
                if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Zarezerwuj'; }
                logError('Błąd rezerwacji:', err);
                self.hideBookingDialog();
                self.showErrorModal('Wyst\u0105pi\u0142 b\u0142\u0105d po\u0142\u0105czenia. Spr\u00F3buj ponownie.');
                self.loadWeekAppointments();
                self.invalidateMonthCache();
            });
    },

    showErrorModal: function (message) {
        var dialog = document.getElementById('bookingDialog');
        if (!dialog) { alert(message); return; }

        var details = document.getElementById('bookingDialogDetails');
        var confirmBtn = document.getElementById('bookingConfirmBtn');
        var cancelBtnEl = document.getElementById('bookingCancelBtn');
        var serviceSelect = document.getElementById('bookingServiceType');
        var h3 = document.getElementById('bookingDialogTitle');

        if (h3) h3.textContent = 'Informacja';
        if (details) {
            this.clearElement(details);
            details.textContent = message;
            details.style.background = '#FFF5F5';
        }
        if (confirmBtn) confirmBtn.style.display = 'none';
        if (cancelBtnEl) cancelBtnEl.textContent = 'Zamknij';
        if (serviceSelect) serviceSelect.parentNode.style.display = 'none';

        dialog.style.display = 'flex';
    },

    cancelMyBooking: function (id) {
        if (!confirm('Czy na pewno chcesz odwo\u0142a\u0107 t\u0119 wizyt\u0119?')) return;
        var self = this;

        var apt = null;
        for (var i = 0; i < this.myAppointments.length; i++) {
            if (this.myAppointments[i].id === id) { apt = this.myAppointments[i]; break; }
        }
        if (apt && this.isSlotPastTime(apt)) {
            alert('Nie mo\u017Cna odwo\u0142a\u0107 wizyty, kt\u00F3rej termin ju\u017C min\u0105\u0142.');
            return;
        }

        supabase
            .from('appointments')
            .update({ status: 'cancelled_by_client' })
            .eq('id', id)
            .eq('client_id', Auth.currentUser.id) // Defense-in-depth
            .then(function (result) {
                if (result.error) {
                    if (result.error.code === '42501' || (result.error.message && result.error.message.indexOf('policy') !== -1)) {
                        alert('Nie mo\u017Cna odwo\u0142a\u0107 wizyty \u2014 termin m\u00F3g\u0142 ju\u017C min\u0105\u0107.');
                    } else {
                        alert('Nie uda\u0142o si\u0119 odwo\u0142a\u0107 wizyty.');
                    }
                    logError('Błąd anulowania wizyty:', result.error);
                    return;
                }
                self.loadMyAppointments();
                self.loadWeekAppointments();
                self.invalidateMonthCache();
            }).catch(function (err) {
                logError('Błąd anulowania:', err);
            });
    },

    // ===== Moje wizyty (klient) =====
    renderMyAppointments: function () {
        var list = document.getElementById('myAppointmentsList');
        if (!list) return;
        this.clearElement(list);

        if (this.myAppointments.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'empty-state';
            var icon = document.createElement('div');
            icon.className = 'empty-icon';
            icon.textContent = '\uD83D\uDCC5'; // 📅
            empty.appendChild(icon);
            var text = document.createElement('p');
            text.textContent = 'Nie masz zaplanowanych wizyt.';
            empty.appendChild(text);
            list.appendChild(empty);
            return;
        }

        for (var i = 0; i < this.myAppointments.length; i++) {
            var apt = this.myAppointments[i];
            var card = document.createElement('div');
            card.className = 'my-appointment-card';

            var info = document.createElement('div');
            info.className = 'my-appointment-info';

            var dateDiv = document.createElement('div');
            dateDiv.className = 'my-appointment-date';
            var dayDate = this.parseLocalDate(apt.slot_date);
            var dayIndex = this.getDayIndex(dayDate);
            dateDiv.textContent = this.DAYS_PL[dayIndex] + ', ' + dayDate.getDate() + ' ' + this.MONTHS_PL[dayDate.getMonth()] + ' ' + dayDate.getFullYear();
            info.appendChild(dateDiv);

            var detailsDiv = document.createElement('div');
            detailsDiv.className = 'my-appointment-details';
            var detailText = this.formatTime(apt.start_time) + ' \u2013 ' + this.formatTime(apt.end_time);
            if (apt.service_type && this.SERVICE_LABELS[apt.service_type]) {
                detailText += ' \u00B7 ' + this.SERVICE_LABELS[apt.service_type];
            }
            detailsDiv.textContent = detailText;
            info.appendChild(detailsDiv);

            card.appendChild(info);

            var statusBadge = document.createElement('span');
            statusBadge.className = 'my-appointment-status';
            if (apt.status === 'booked') {
                statusBadge.classList.add('status-badge-booked');
                statusBadge.textContent = 'Zarezerwowana';
            } else if (apt.status === 'confirmed') {
                statusBadge.classList.add('status-badge-confirmed');
                statusBadge.textContent = 'Potwierdzona';
            } else if (apt.status === 'requested') {
                statusBadge.classList.add('status-badge-requested');
                statusBadge.textContent = 'Propozycja';
            }
            card.appendChild(statusBadge);

            // Sesja online — przycisk dołącz / pending tag
            if (apt.session_mode === 'online' && apt.meeting_url) {
                if (apt.status === 'confirmed') {
                    var joinBtn = document.createElement('a');
                    joinBtn.className = 'btn-primary btn-sm btn-join-session';
                    joinBtn.href = '#/session/' + apt.id;
                    joinBtn.textContent = 'Do\u0142\u0105cz do sesji';
                    card.appendChild(joinBtn);
                } else if (apt.status === 'booked') {
                    var pendingTag = document.createElement('span');
                    pendingTag.className = 'session-pending-tag';
                    pendingTag.textContent = 'Online \u2014 oczekuje na potwierdzenie';
                    card.appendChild(pendingTag);
                }
            }

            if (apt.status === 'requested') {
                // Propozycja — klient może anulować
                var cancelReqBtn = document.createElement('button');
                cancelReqBtn.className = 'btn-secondary btn-sm';
                cancelReqBtn.textContent = 'Anuluj propozycj\u0119';
                cancelReqBtn.setAttribute('data-action', 'cancel-request');
                cancelReqBtn.setAttribute('data-id', apt.id);
                cancelReqBtn.style.width = 'auto';
                cancelReqBtn.style.padding = '6px 16px';
                cancelReqBtn.style.fontSize = '13px';
                card.appendChild(cancelReqBtn);
            } else if (!this.isSlotPastTime(apt)) {
                var cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn-secondary btn-sm';
                cancelBtn.textContent = 'Odwo\u0142aj';
                cancelBtn.setAttribute('data-action', 'cancel-my');
                cancelBtn.setAttribute('data-id', apt.id);
                cancelBtn.style.width = 'auto';
                cancelBtn.style.padding = '6px 16px';
                cancelBtn.style.fontSize = '13px';
                card.appendChild(cancelBtn);
            }

            list.appendChild(card);
        }
    },

    // ===== Helpery =====
    clearElement: function (el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    },

    findAppointment: function (id) {
        for (var i = 0; i < this.appointments.length; i++) {
            if (this.appointments[i].id === id) return this.appointments[i];
        }
        return null;
    },

    parseLocalDate: function (dateStr) {
        var parts = dateStr.split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    },

    formatDateForDB: function (date) {
        var yyyy = date.getFullYear();
        var mm = String(date.getMonth() + 1).padStart(2, '0');
        var dd = String(date.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
    },

    formatTime: function (timeStr) {
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    },

    addDays: function (date, days) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    },

    getDayIndex: function (date) {
        var d = date.getDay();
        return d === 0 ? 6 : d - 1;
    },

    isSlotPastTime: function (apt) {
        var now = new Date();
        var todayStr = this.formatDateForDB(now);
        if (apt.slot_date > todayStr) return false;
        if (apt.slot_date < todayStr) return true;
        var nowTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        return this.formatTime(apt.start_time) <= nowTime;
    },

    escapeHtml: function (str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    polishPlural: function (n, one, few, many) {
        if (n === 1) return one;
        var mod10 = n % 10;
        var mod100 = n % 100;
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
        return many;
    },

    generateUUID: function () {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    },

    generateMeetingUrl: function (appointmentId) {
        // CSPRNG — kryptograficznie bezpieczny suffix (Web Crypto API, Art. 9 RODO)
        var arr = new Uint8Array(4);
        window.crypto.getRandomValues(arr);
        var suffix = Array.from(arr, function(b) { return b.toString(16).padStart(2, '0'); }).join('');
        return 'https://meet.jit.si/szlak-rozwoju-' + appointmentId + '-' + suffix;
    },

    // ===== Propozycje terminów (klient) =====
    showRequestForm: function () {
        var modal = document.getElementById('requestFormModal');
        if (!modal) return;
        var dateInput = document.getElementById('requestDate');
        var timeInput = document.getElementById('requestTime');
        var alertEl = document.getElementById('requestFormAlert');

        if (alertEl) { alertEl.style.display = 'none'; alertEl.textContent = ''; }
        if (dateInput) dateInput.value = this.formatDateForDB(new Date());
        if (timeInput) timeInput.value = '10:00';
        var radios = document.querySelectorAll('input[name="requestDuration"]');
        for (var i = 0; i < radios.length; i++) {
            radios[i].checked = radios[i].value === '50';
        }
        var serviceSelect = document.getElementById('requestServiceType');
        if (serviceSelect) serviceSelect.value = '';
        var notesTextarea = document.getElementById('requestNotes');
        if (notesTextarea) notesTextarea.value = '';

        modal.style.display = 'flex';
    },

    hideRequestForm: function () {
        var modal = document.getElementById('requestFormModal');
        if (modal) modal.style.display = 'none';
    },

    showRequestAlert: function (msg) {
        var alertEl = document.getElementById('requestFormAlert');
        if (alertEl) {
            alertEl.textContent = msg;
            alertEl.style.display = 'block';
            alertEl.classList.add('visible');
        }
    },

    submitRequest: function () {
        var self = this;
        var dateInput = document.getElementById('requestDate');
        var timeInput = document.getElementById('requestTime');
        var saveBtn = document.getElementById('requestFormSaveBtn');

        var dateVal = dateInput ? dateInput.value : '';
        var startTimeVal = timeInput ? timeInput.value : '';

        if (!dateVal || !startTimeVal) {
            this.showRequestAlert('Podaj dat\u0119 i godzin\u0119.');
            return;
        }

        // Walidacja: nie pozwól na daty z przeszłości
        var todayStr = this.formatDateForDB(new Date());
        if (dateVal < todayStr) {
            this.showRequestAlert('Nie mo\u017Cna zaproponowa\u0107 terminu w przesz\u0142o\u015Bci.');
            return;
        }

        var durationVal = 50;
        var radios = document.querySelectorAll('input[name="requestDuration"]');
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) { durationVal = parseInt(radios[i].value); break; }
        }

        var parts = startTimeVal.split(':');
        var startMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        var endMinutes = startMinutes + durationVal;
        var endH = Math.floor(endMinutes / 60);
        var endM = endMinutes % 60;
        if (endH >= 24) {
            this.showRequestAlert('Termin wykracza poza dzie\u0144.');
            return;
        }
        var endTimeVal = String(endH).padStart(2, '0') + ':' + String(endM).padStart(2, '0');

        var serviceSelect = document.getElementById('requestServiceType');
        var serviceVal = serviceSelect ? serviceSelect.value : '';
        var notesTextarea = document.getElementById('requestNotes');
        var notesVal = notesTextarea ? notesTextarea.value.trim() : '';

        function doSubmit() {
            if (!self._therapistId) {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Wy\u015Blij propozycj\u0119'; }
                self.showRequestAlert('Nie uda\u0142o si\u0119 pobra\u0107 danych terapeuty. Spr\u00F3buj ponownie.');
                return;
            }
            var requestSessionMode = 'in_person';
            var modeRadios = document.querySelectorAll('input[name="requestSessionMode"]');
            for (var rm = 0; rm < modeRadios.length; rm++) {
                if (modeRadios[rm].checked) { requestSessionMode = modeRadios[rm].value; break; }
            }
            var record = {
                id: self.generateUUID(),
                slot_date: dateVal,
                start_time: startTimeVal + ':00',
                end_time: endTimeVal + ':00',
                duration_minutes: durationVal,
                status: 'requested',
                therapist_id: self._therapistId,
                client_id: Auth.currentUser.id,
                service_type: serviceVal || null,
                notes: notesVal,
                session_mode: requestSessionMode,
                meeting_url: null
            };

            supabase
                .from('appointments')
                .insert([record])
                .then(function (result) {
                    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Wy\u015Blij propozycj\u0119'; }
                    if (result.error) {
                        logError('Błąd wysyłania propozycji:', result.error);
                        var userMsg;
                        if (result.error.message && result.error.message.indexOf('propozycji') !== -1) {
                            userMsg = result.error.message;
                        } else if (result.error.code === '23514' || result.error.code === 'P0001') {
                            userMsg = result.error.message || 'Nie uda\u0142o si\u0119 wys\u0142a\u0107 propozycji.';
                        } else {
                            userMsg = 'Nie uda\u0142o si\u0119 wys\u0142a\u0107 propozycji. Spr\u00F3buj ponownie.';
                        }
                        self.showRequestAlert(userMsg);
                        return;
                    }
                    self.hideRequestForm();
                    self.loadWeekAppointments();
                    self.loadMyAppointments();
                    self.invalidateMonthCache();
                }).catch(function (err) {
                    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Wy\u015Blij propozycj\u0119'; }
                    logError('Błąd wysyłania propozycji:', err);
                    self.showRequestAlert('Wyst\u0105pi\u0142 b\u0142\u0105d po\u0142\u0105czenia.');
                });
        }

        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Wysy\u0142anie...'; }

        if (!this._therapistId) {
            // Fallback: pobierz w locie przed INSERT
            supabase.from('profiles').select('id').eq('role', 'therapist').limit(1)
                .then(function (r) {
                    if (r.data && r.data.length) self._therapistId = r.data[0].id;
                    doSubmit();
                }).catch(function () {
                    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Wy\u015Blij propozycj\u0119'; }
                    self.showRequestAlert('Wyst\u0105pi\u0142 b\u0142\u0105d po\u0142\u0105czenia.');
                });
        } else {
            doSubmit();
        }
    },

    // ===== Akceptacja / odrzucenie propozycji (terapeuta) =====
    acceptRequest: function (id) {
        this.showAcceptRequestDialog(id);
    },

    showAcceptRequestDialog: function (id) {
        var apt = this.findAppointment(id);
        if (!apt) return;

        this._acceptRequestId = id;

        var details = document.getElementById('acceptRequestDetails');
        if (details) {
            var dateObj = this.parseLocalDate(apt.slot_date);
            var dayName = this.DAYS_PL[this.getDayIndex(dateObj)];
            var html = '<p><strong>' + dayName + ', ' + dateObj.getDate() + ' ' + this.MONTHS_PL[dateObj.getMonth()] + ' ' + dateObj.getFullYear() + '</strong></p>'
                + '<p>' + this.formatTime(apt.start_time) + ' \u2013 ' + this.formatTime(apt.end_time) + ' (' + apt.duration_minutes + ' min)</p>';
            if (apt.client) html += '<p>Klient: ' + this.escapeHtml(apt.client.full_name) + '</p>';
            if (apt.notes) html += '<p>Uwagi: ' + this.escapeHtml(apt.notes) + '</p>';
            details.innerHTML = html;
        }

        // Pre-select session mode based on client's preference
        var modeRadios = document.querySelectorAll('input[name="acceptSessionMode"]');
        for (var i = 0; i < modeRadios.length; i++) {
            modeRadios[i].checked = modeRadios[i].value === (apt.session_mode || 'in_person');
        }

        var dialog = document.getElementById('acceptRequestDialog');
        if (dialog) dialog.style.display = '';
    },

    doAcceptRequest: function (id, sessionMode) {
        var self = this;
        var now = new Date();
        var timestamp = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + 'T' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');

        var updateData = {
            status: 'confirmed',
            session_mode: sessionMode,
            booked_at: timestamp
        };

        if (sessionMode === 'online') {
            updateData.meeting_url = this.generateMeetingUrl(id);
        } else {
            updateData.meeting_url = null;
        }

        supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .then(function (result) {
                if (result.error) {
                    if (result.error.message && result.error.message.indexOf('overlap') !== -1) {
                        alert('Nie mo\u017Cna zaakceptowa\u0107 \u2014 istniej\u0105cy termin koliduje z propozycj\u0105. Usu\u0144 koliduj\u0105cy wolny termin i spr\u00F3buj ponownie.');
                    } else {
                        alert('Nie uda\u0142o si\u0119 zaakceptowa\u0107 propozycji.');
                    }
                    logError('Błąd akceptacji propozycji:', result.error);
                    return;
                }
                self.loadWeekAppointments();
                self.invalidateMonthCache();
            }).catch(function (err) {
                logError('Błąd akceptacji:', err);
            });
    },

    updateAppointment: function(id, data) {
        var self = this;
        supabase
            .from('appointments')
            .update(data)
            .eq('id', id)
            .then(function(result) {
                if (result.error) {
                    alert('Nie udało się zaktualizować wizyty.');
                    logError('Błąd aktualizacji wizyty:', result.error);
                    return;
                }
                self.loadWeekAppointments();
                self.invalidateMonthCache();
            }).catch(function(err) {
                logError('Błąd aktualizacji:', err);
            });
    },

    rejectRequest: function (id) {
        if (!confirm('Odrzuci\u0107 t\u0119 propozycj\u0119 terminu?')) return;
        var self = this;
        supabase
            .from('appointments')
            .delete()
            .eq('id', id)
            .then(function (result) {
                if (result.error) {
                    alert('Nie uda\u0142o si\u0119 odrzuci\u0107 propozycji.');
                    logError('Błąd odrzucenia propozycji:', result.error);
                    return;
                }
                self.loadWeekAppointments();
                self.invalidateMonthCache();
            }).catch(function (err) {
                logError('Błąd odrzucenia:', err);
            });
    },

    // ===== Anulowanie propozycji przez klienta =====
    cancelMyRequest: function (id) {
        if (!confirm('Anulowa\u0107 propozycj\u0119 terminu?')) return;
        var self = this;
        supabase
            .from('appointments')
            .delete()
            .eq('id', id)
            .eq('client_id', Auth.currentUser.id) // Defense-in-depth
            .then(function (result) {
                if (result.error) {
                    alert('Nie uda\u0142o si\u0119 anulowa\u0107 propozycji.');
                    logError('Błąd anulowania propozycji:', result.error);
                    return;
                }
                self.loadMyAppointments();
                self.loadWeekAppointments();
                self.invalidateMonthCache();
            }).catch(function (err) {
                logError('Błąd anulowania propozycji:', err);
            });
    },

    // ===== Ładowanie ID terapeuty (cache, dla klientów) =====
    loadTherapistId: function () {
        if (this._therapistId) return;
        var self = this;
        // Założenie: jeden terapeuta w systemie (Dorota Kluz)
        supabase
            .from('profiles')
            .select('id')
            .eq('role', 'therapist')
            .limit(1)
            .then(function (result) {
                if (result.data && result.data.length) {
                    self._therapistId = result.data[0].id;
                }
            }).catch(function (err) {
                logError('Błąd ładowania ID terapeuty:', err);
            });
    },

    // ===== Widok miesiąca =====
    switchView: function(mode) {
        if (mode === this._viewMode) return;
        this._viewMode = mode;

        // Toggle active class on buttons
        var btns = document.querySelectorAll('#scheduleViewToggle .view-toggle-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('active', btns[i].getAttribute('data-view') === mode);
        }

        // Toggle visibility of week vs month elements
        var weekNav = document.querySelector('.schedule-nav:not(.schedule-month-nav)');
        var monthNav = document.getElementById('scheduleMonthNav');
        var weekGrid = document.getElementById('scheduleGrid');
        var monthGrid = document.getElementById('scheduleMonthGrid');
        var mobileNav = document.querySelector('.schedule-day-view-nav');

        if (mode === 'month') {
            if (weekNav) weekNav.style.display = 'none';
            if (monthNav) monthNav.style.display = '';
            if (weekGrid) weekGrid.style.display = 'none';
            if (monthGrid) monthGrid.style.display = '';
            if (mobileNav) mobileNav.style.display = 'none';
            this.goToMonth(this.monthOffset);
        } else {
            if (weekNav) weekNav.style.display = '';
            if (monthNav) monthNav.style.display = 'none';
            if (weekGrid) weekGrid.style.display = '';
            if (monthGrid) monthGrid.style.display = 'none';
            if (mobileNav && this.isMobile()) mobileNav.style.display = '';
            this.goToWeek(this.weekOffset);
        }
    },

    goToMonth: function(offset) {
        this.monthOffset = offset;
        var now = new Date();
        this.currentMonthStart = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        this.renderMonthHeader();
        this.loadMonthAppointments();
    },

    goMonthToday: function() {
        this.goToMonth(0);
    },

    renderMonthHeader: function() {
        var label = document.getElementById('scheduleMonthLabel');
        if (!label) return;
        var m = this.currentMonthStart;
        label.textContent = this.MONTHS_NOM[m.getMonth()] + ' ' + m.getFullYear();
    },

    loadMonthAppointments: function() {
        var self = this;
        var m = this.currentMonthStart;
        var cacheKey = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0');

        // Cache check
        if (this._monthCacheKey === cacheKey && (Date.now() - this._monthCacheTime) < this.MONTH_CACHE_TTL) {
            this.renderMonthGrid();
            return;
        }

        var loadId = ++this._monthLoadId;

        // Show spinner
        var grid = document.getElementById('scheduleMonthGrid');
        if (grid) {
            this.clearElement(grid);
            var spinner = document.createElement('div');
            spinner.className = 'spinner-container';
            spinner.style.gridColumn = '1 / -1';
            var sp = document.createElement('span');
            sp.className = 'spinner';
            spinner.appendChild(sp);
            grid.appendChild(spinner);
        }

        // Compute grid range: Monday before 1st to Sunday after last day
        var firstDay = new Date(m.getFullYear(), m.getMonth(), 1);
        var lastDay = new Date(m.getFullYear(), m.getMonth() + 1, 0);
        var firstDow = firstDay.getDay();
        var gridStart = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - (firstDow === 0 ? 6 : firstDow - 1));
        var lastDow = lastDay.getDay();
        var gridEnd = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + (lastDow === 0 ? 0 : 7 - lastDow));

        var gridStartStr = this.formatDateForDB(gridStart);
        var gridEndStr = this.formatDateForDB(gridEnd);

        supabase
            .from('appointments')
            .select('*, client:profiles!appointments_client_id_fkey(full_name)')
            .gte('slot_date', gridStartStr)
            .lte('slot_date', gridEndStr)
            .order('slot_date', { ascending: true })
            .order('start_time', { ascending: true })
            .then(function(result) {
                if (self._monthLoadId !== loadId) return;
                var data = [];
                if (result.error) {
                    logError('Błąd ładowania miesiąca:', result.error);
                } else {
                    data = result.data || [];
                }
                self.monthAppointments = data;

                // Group into map
                var map = {};
                for (var i = 0; i < data.length; i++) {
                    var d = data[i].slot_date;
                    if (!map[d]) map[d] = [];
                    map[d].push(data[i]);
                }
                self._monthAppointmentMap = map;
                self._monthCacheKey = cacheKey;
                self._monthCacheTime = Date.now();

                self.renderMonthGrid();
            }).catch(function(err) {
                if (self._monthLoadId !== loadId) return;
                logError('Błąd ładowania miesiąca:', err);
            });
    },

    invalidateMonthCache: function() {
        this._monthCacheKey = null;
        this._monthCacheTime = 0;
        if (this._viewMode === 'month') {
            this.loadMonthAppointments();
        }
    },

    renderMonthGrid: function() {
        var grid = document.getElementById('scheduleMonthGrid');
        if (!grid) return;
        this.clearElement(grid);

        var isTherapist = Auth.isTherapist();
        var m = this.currentMonthStart;
        var todayStr = this.formatDateForDB(new Date());
        var currentMonth = m.getMonth();

        // Header cells (Mon-Sun)
        for (var h = 0; h < 7; h++) {
            var hCell = document.createElement('div');
            hCell.className = 'month-day-header-cell';
            hCell.textContent = this.DAYS_SHORT[h];
            grid.appendChild(hCell);
        }

        // Compute grid start (Monday before 1st)
        var firstDay = new Date(m.getFullYear(), m.getMonth(), 1);
        var firstDow = firstDay.getDay();
        var gridStart = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - (firstDow === 0 ? 6 : firstDow - 1));

        // Compute grid end (Sunday after last day)
        var lastDay = new Date(m.getFullYear(), m.getMonth() + 1, 0);
        var lastDow = lastDay.getDay();
        var gridEnd = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + (lastDow === 0 ? 0 : 7 - lastDow));

        // Iterate days
        var cursor = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate());
        while (cursor <= gridEnd) {
            var dateStr = this.formatDateForDB(cursor);
            var cell = document.createElement('div');
            cell.className = 'month-day-cell';
            cell.setAttribute('data-date', dateStr);

            if (cursor.getMonth() !== currentMonth) cell.classList.add('other-month');
            if (dateStr === todayStr) cell.classList.add('today');

            var num = document.createElement('div');
            num.className = 'month-day-number';
            num.textContent = cursor.getDate();
            cell.appendChild(num);

            var summary = this.renderMonthDaySummary(dateStr, isTherapist);
            if (summary) cell.appendChild(summary);

            grid.appendChild(cell);
            cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
        }
    },

    renderMonthDaySummary: function(dayStr, isTherapist) {
        var apts = this._monthAppointmentMap[dayStr];
        if (!apts || apts.length === 0) return null;

        var container = document.createElement('div');
        container.className = 'month-day-summary';

        if (isTherapist) {
            // Count by status
            var counts = {};
            for (var i = 0; i < apts.length; i++) {
                var s = apts[i].status;
                counts[s] = (counts[s] || 0) + 1;
            }

            var countDiv = document.createElement('div');
            countDiv.className = 'month-day-count';
            var total = apts.length;
            countDiv.textContent = total + ' ' + this.polishPlural(total, 'wizyta', 'wizyty', 'wizyt');
            container.appendChild(countDiv);

            // Status dots
            var statusOrder = ['available', 'booked', 'confirmed', 'requested', 'completed'];
            for (var j = 0; j < statusOrder.length; j++) {
                var st = statusOrder[j];
                if (counts[st]) {
                    for (var k = 0; k < Math.min(counts[st], 5); k++) {
                        var dot = document.createElement('span');
                        dot.className = 'month-status-dot dot-' + st;
                        container.appendChild(dot);
                    }
                }
            }
        } else {
            // Client: count available + own
            var available = 0;
            var own = 0;
            for (var ci = 0; ci < apts.length; ci++) {
                if (apts[ci].status === 'available') available++;
                else if (apts[ci].client_id === Auth.currentUser.id) own++;
            }
            if (available > 0 || own > 0) {
                var text = '';
                if (available > 0) text += available + ' ' + this.polishPlural(available, 'wolny', 'wolne', 'wolnych');
                if (own > 0) {
                    if (text) text += ', ';
                    text += own + ' ' + this.polishPlural(own, 'Twoja', 'Twoje', 'Twoich');
                }
                container.textContent = text;
            } else {
                return null;
            }
        }

        return container;
    },

    onMonthDayClick: function(dateStr) {
        var clickedDate = this.parseLocalDate(dateStr);

        // Compute weekOffset for this date
        var clickedMonday = new Date(clickedDate.getFullYear(), clickedDate.getMonth(), clickedDate.getDate() - this.getDayIndex(clickedDate));
        var currentMonday = this.getWeekStart(0);
        var diffDays = Math.round((clickedMonday - currentMonday) / 86400000);
        var newWeekOffset = Math.round(diffDays / 7);

        // Set mobile day before switching view
        if (this.isMobile()) {
            this._suppressMobileDayReset = true;
            this._mobileDay = this.getDayIndex(clickedDate);
        }

        // Set weekOffset BEFORE switchView so it loads the correct week in one call
        this.weekOffset = newWeekOffset;
        this.switchView('week');

        // On mobile, force the correct day after render
        if (this.isMobile()) {
            this._mobileDay = this.getDayIndex(clickedDate);
            this.updateMobileDay();
        }
    }
};
