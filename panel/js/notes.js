// Moduł notatek z sesji — lista, formularz, zarządzanie
var Notes = {

    // --- Stan ---
    _initialized: false,
    activeClientId: null,
    currentNoteId: null,
    notes: [],
    clients: [],
    offset: 0,
    PAGE_SIZE: 20,
    editingNote: null,
    _appointmentContext: null,
    _clientsLoaded: false,
    pendingAppointmentContext: null,
    _saveInProgress: false,

    // --- Inicjalizacja ---
    init: function () {
        if (this._initialized) return;
        this._initialized = true;

        Attachments.initLightbox();

        var self = this;

        var notesContent = document.getElementById('notesContent');
        if (notesContent) {
            notesContent.addEventListener('click', function (e) {
                self.handleContentClick(e);
            });
        }

        var clientsList = document.getElementById('clientsList');
        if (clientsList) {
            clientsList.addEventListener('click', function (e) {
                var item = e.target.closest('.client-item');
                if (item) {
                    var clientId = item.getAttribute('data-client-id');
                    if (clientId) self.selectClient(clientId);
                }
            });
        }

        var addNoteBtn = document.getElementById('addNoteBtn');
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', function () {
                self.showForm(null);
            });
        }

        var loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function () {
                self.loadMoreNotes();
            });
        }

        var clientSearch = document.getElementById('clientSearch');
        if (clientSearch) {
            clientSearch.addEventListener('input', function () {
                self.filterClients(clientSearch.value.trim());
            });
        }

        Router.addRouteListener(function (hash) {
            if (hash === '#/notes') {
                self.onEnter();
            }
        });
    },

    onEnter: function () {
        var self = this;
        if (Auth.isTherapist()) {
            this.showTherapistView();
            // Jeśli jest pending context z sesji online — otwórz formularz
            if (this.pendingAppointmentContext) {
                var ctx = this.pendingAppointmentContext;
                this.pendingAppointmentContext = null;
                // Poczekaj na załadowanie klientów, potem otwórz formularz
                var checkInterval = setInterval(function () {
                    if (self.clients.length > 0 || self._clientsLoaded) {
                        clearInterval(checkInterval);
                        // Wybierz klienta po ID
                        if (ctx.clientId) {
                            self.selectClient(ctx.clientId);
                        }
                        self.showForm(null, ctx);
                    }
                }, 100);
                // Safety timeout
                setTimeout(function () { clearInterval(checkInterval); }, 5000);
            }
        } else {
            this.showClientView();
        }
    },

    // =========================================================
    // Widok terapeuty
    // =========================================================
    showTherapistView: function () {
        var sidebar = document.getElementById('clientsSidebar');
        var actions = document.getElementById('notesActions');
        var title = document.getElementById('notesTitle');
        var loadMore = document.getElementById('notesLoadMore');

        if (sidebar) sidebar.style.display = '';
        if (actions) actions.style.display = 'none';
        if (title) title.textContent = 'Notatki z sesji';
        if (loadMore) loadMore.style.display = 'none';

        this.activeClientId = null;
        this.loadClients();
        this.showEmpty('Wybierz klienta z listy po lewej stronie.');
    },

    loadClients: function () {
        var clientsList = document.getElementById('clientsList');
        if (!clientsList) return;

        while (clientsList.firstChild) clientsList.removeChild(clientsList.firstChild);
        var spinnerWrap = document.createElement('div');
        spinnerWrap.className = 'spinner-container';
        var spinner = document.createElement('span');
        spinner.className = 'spinner';
        spinnerWrap.appendChild(spinner);
        clientsList.appendChild(spinnerWrap);

        var self = this;
        this._clientsLoaded = false;

        supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'client')
            .order('full_name', { ascending: true })
            .then(function (result) {
                if (result.error) {
                    logError('Błąd pobierania klientów:', result.error);
                    self.clients = [];
                } else {
                    self.clients = result.data || [];
                }
                self._clientsLoaded = true;
                self.renderClients(self.clients);
                self.renderMobileSelect(self.clients);
                // Auto-select jeśli jest dokładnie 1 klient
                if (self.clients.length === 1 && !self.activeClientId) {
                    self.selectClient(self.clients[0].id);
                }
            })
            .catch(function (err) {
                logError('Wyjątek podczas pobierania klientów:', err);
                self.clients = [];
                self._clientsLoaded = true;
                self.renderClients([]);
            });
    },

    renderClients: function (clients) {
        var clientsList = document.getElementById('clientsList');
        var clientSearch = document.getElementById('clientSearch');
        if (!clientsList) return;

        if (clientSearch) {
            clientSearch.style.display = clients.length > 5 ? '' : 'none';
        }

        while (clientsList.firstChild) clientsList.removeChild(clientsList.firstChild);

        if (!clients || clients.length === 0) {
            var empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'Brak zarejestrowanych klientów.';
            clientsList.appendChild(empty);
            return;
        }

        for (var i = 0; i < clients.length; i++) {
            var client = clients[i];
            var item = document.createElement('div');
            item.className = 'client-item' + (client.id === this.activeClientId ? ' active' : '');
            item.setAttribute('data-client-id', client.id);
            item.textContent = client.full_name || client.email || 'Klient';
            clientsList.appendChild(item);
        }
    },

    renderMobileSelect: function (clients) {
        var notesMain = document.querySelector('.notes-main');
        if (!notesMain) return;

        var existing = document.getElementById('clientSelectMobile');
        var select;

        if (existing) {
            select = existing;
            while (select.firstChild) select.removeChild(select.firstChild);
        } else {
            select = document.createElement('select');
            select.id = 'clientSelectMobile';
            select.className = 'client-select-mobile';
            notesMain.insertBefore(select, notesMain.firstChild);

            var self = this;
            select.addEventListener('change', function () {
                if (select.value) {
                    self.selectClient(select.value);
                }
            });
        }

        var defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Wybierz klienta --';
        select.appendChild(defaultOption);

        for (var i = 0; i < clients.length; i++) {
            var opt = document.createElement('option');
            opt.value = clients[i].id;
            opt.textContent = clients[i].full_name || clients[i].email || 'Klient';
            if (clients[i].id === this.activeClientId) opt.selected = true;
            select.appendChild(opt);
        }
    },

    filterClients: function (query) {
        if (!query) {
            this.renderClients(this.clients);
            return;
        }
        var lq = query.toLowerCase();
        var filtered = this.clients.filter(function (c) {
            return (c.full_name || '').toLowerCase().indexOf(lq) !== -1;
        });
        this.renderClients(filtered);
    },

    selectClient: function (clientId) {
        this.activeClientId = clientId;
        this.offset = 0;
        this.notes = [];
        this.editingNote = null;

        var items = document.querySelectorAll('.client-item');
        for (var i = 0; i < items.length; i++) {
            if (items[i].getAttribute('data-client-id') === clientId) {
                items[i].classList.add('active');
            } else {
                items[i].classList.remove('active');
            }
        }

        var mobileSelect = document.getElementById('clientSelectMobile');
        if (mobileSelect) mobileSelect.value = clientId;

        var actions = document.getElementById('notesActions');
        var clientNameEl = document.getElementById('notesClientName');
        if (actions) actions.style.display = '';

        var clientName = '';
        for (var j = 0; j < this.clients.length; j++) {
            if (this.clients[j].id === clientId) {
                clientName = this.clients[j].full_name || this.clients[j].email || '';
                break;
            }
        }
        if (clientNameEl) clientNameEl.textContent = clientName;

        this.loadNotes(clientId, false);
    },

    // =========================================================
    // Ładowanie notatek
    // =========================================================
    loadNotes: function (clientId, append) {
        var self = this;

        // Defense-in-depth: klient moze ladowac tylko swoje notatki
        if (!Auth.isTherapist() && clientId !== Auth.currentUser.id) {
            logError('Proba dostepu do cudzych notatek');
            return;
        }

        if (!append) {
            this.offset = 0;
            this.notes = [];
            var notesContent = document.getElementById('notesContent');
            if (notesContent) {
                while (notesContent.firstChild) notesContent.removeChild(notesContent.firstChild);
                var spinnerWrap = document.createElement('div');
                spinnerWrap.className = 'spinner-container';
                var spinner = document.createElement('span');
                spinner.className = 'spinner';
                spinnerWrap.appendChild(spinner);
                notesContent.appendChild(spinnerWrap);
            }
        }

        var from = this.offset;
        var to = this.offset + this.PAGE_SIZE - 1;

        supabase
            .from('notes')
            .select('*, note_attachments(id, file_name, file_path, mime_type, file_size)')
            .eq('client_id', clientId)
            .order('session_date', { ascending: false })
            .range(from, to)
            .then(function (result) {
                // Zabezpieczenie przed wyścigiem
                if (self.activeClientId !== clientId) return;

                if (result.error) {
                    logError('Błąd pobierania notatek:', result.error);
                    self.showEmpty('Wystąpił błąd podczas pobierania notatek.');
                    return;
                }

                var data = result.data || [];
                self.notes = self.notes.concat(data);
                self.offset += data.length;

                self.renderNotes(self.notes, Auth.isTherapist());

                var loadMore = document.getElementById('notesLoadMore');
                if (loadMore) {
                    loadMore.style.display = data.length === self.PAGE_SIZE ? '' : 'none';
                }
            })
            .catch(function (err) {
                logError('Wyjątek podczas pobierania notatek:', err);
                if (self.activeClientId === clientId) {
                    self.showEmpty('Wystąpił błąd podczas pobierania notatek.');
                }
            });
    },

    loadMoreNotes: function () {
        if (this.activeClientId) {
            this.loadNotes(this.activeClientId, true);
        }
    },

    // Buduje kartę notatki bezpiecznie przez DOM API
    _buildNoteCard: function (note, isTherapist) {
        var card = document.createElement('div');
        card.className = 'note-card';
        card.setAttribute('data-note-id', note.id);

        // Nagłówek
        var header = document.createElement('div');
        header.className = 'note-card-header';

        var titleEl = document.createElement('h3');
        titleEl.className = 'note-card-title';
        titleEl.textContent = note.title || 'Bez tytułu';
        header.appendChild(titleEl);

        var dateEl = document.createElement('span');
        dateEl.className = 'note-card-date';
        dateEl.textContent = this.formatDate(note.session_date);
        header.appendChild(dateEl);

        card.appendChild(header);

        // Podgląd treści (skrócony — widoczny domyślnie)
        var preview = note.content ? note.content.substr(0, 100) : '';
        var hasMore = note.content && note.content.length > 100;
        var previewEl = document.createElement('p');
        previewEl.className = 'note-card-preview';
        previewEl.textContent = preview + (hasMore ? '\u2026' : '');
        card.appendChild(previewEl);

        // Pełna treść (ukryta domyślnie — pokazywana przy rozwinięciu karty)
        var fullEl = document.createElement('p');
        fullEl.className = 'note-card-full';
        fullEl.textContent = note.content || '';
        card.appendChild(fullEl);

        // Liczba załączników
        var attCount = note.note_attachments ? note.note_attachments.length : 0;
        if (attCount > 0) {
            var meta = document.createElement('div');
            meta.className = 'note-card-footer';
            var attSpan = document.createElement('span');
            attSpan.className = 'note-card-attachments';
            attSpan.textContent = '\uD83D\uDCCE ' + attCount + ' za\u0142\u0105cznik' + this.pluralize(attCount);
            meta.appendChild(attSpan);
            card.appendChild(meta);
        }

        // Przyciski akcji (tylko terapeuta)
        if (isTherapist) {
            var actionsDiv = document.createElement('div');
            actionsDiv.className = 'note-card-actions';

            var editBtn = document.createElement('button');
            editBtn.className = 'btn-icon btn-edit';
            editBtn.setAttribute('data-action', 'edit-note');
            editBtn.setAttribute('data-note-id', note.id);
            editBtn.setAttribute('title', 'Edytuj');
            editBtn.textContent = '\u270F\uFE0F';
            actionsDiv.appendChild(editBtn);

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon btn-delete';
            deleteBtn.setAttribute('data-action', 'delete-note');
            deleteBtn.setAttribute('data-note-id', note.id);
            deleteBtn.setAttribute('title', 'Usu\u0144');
            deleteBtn.textContent = '\uD83D\uDDD1\uFE0F';
            actionsDiv.appendChild(deleteBtn);

            card.appendChild(actionsDiv);
        }

        // Siatka załączników (wypełniana przy rozwinięciu karty)
        var attGrid = document.createElement('div');
        attGrid.className = 'note-attachments-grid';
        attGrid.setAttribute('data-attachments-rendered', 'false');
        card.appendChild(attGrid);

        return card;
    },

    renderNotes: function (notes, isTherapist) {
        var notesContent = document.getElementById('notesContent');
        if (!notesContent) return;

        while (notesContent.firstChild) notesContent.removeChild(notesContent.firstChild);

        if (!notes || notes.length === 0) {
            if (isTherapist) {
                this.showEmpty('Brak notatek dla tego klienta. Dodaj pierwszą notatkę.');
            } else {
                this.showEmpty('Nie masz jeszcze żadnych notatek z sesji.');
            }
            return;
        }

        var fragment = document.createDocumentFragment();
        for (var i = 0; i < notes.length; i++) {
            fragment.appendChild(this._buildNoteCard(notes[i], isTherapist));
        }
        notesContent.appendChild(fragment);
    },

    // =========================================================
    // Widok klienta
    // =========================================================
    showClientView: function () {
        var sidebar = document.getElementById('clientsSidebar');
        var actions = document.getElementById('notesActions');
        var title = document.getElementById('notesTitle');

        if (sidebar) sidebar.style.display = 'none';
        if (actions) actions.style.display = 'none';
        if (title) title.textContent = 'Moje notatki z sesji';

        this.activeClientId = Auth.currentUser ? Auth.currentUser.id : null;
        if (this.activeClientId) {
            this.loadNotes(this.activeClientId, false);
        } else {
            this.showEmpty('Nie można załadować notatek. Zaloguj się ponownie.');
        }
    },

    // =========================================================
    // Formularz dodawania/edycji notatki — budowany przez DOM API
    // =========================================================
    showForm: function (existingNote, appointmentContext) {
        this.editingNote = existingNote || null;
        this._appointmentContext = appointmentContext || null;

        if (existingNote) {
            this.currentNoteId = existingNote.id;
        } else {
            this.currentNoteId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
        }

        Attachments.reset();

        var today = (function() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); })();
        var titleVal = existingNote ? (existingNote.title || '') : '';
        var dateVal = existingNote ? (existingNote.session_date || today) : today;
        var contentVal = existingNote ? (existingNote.content || '') : '';
        var isEdit = !!existingNote;

        // Pre-fill jeśli z kontekstu sesji online
        if (appointmentContext && !isEdit) {
            titleVal = 'Sesja online \u2014 ' + (appointmentContext.clientName || '') + ' \u2014 ' + (appointmentContext.date || '');
            dateVal = appointmentContext.date || today;
        }

        // Korzeń formularza
        var form = document.createElement('div');
        form.className = 'note-form';

        // Tytuł formularza
        var formTitle = document.createElement('h3');
        formTitle.textContent = isEdit ? 'Edytuj notatk\u0119' : 'Nowa notatka';
        form.appendChild(formTitle);

        // RODO warning — widoczność notatki w panelu pacjenta
        if (Auth.isTherapist()) {
            var warningEl = document.createElement('div');
            warningEl.className = 'note-visibility-warning';
            warningEl.textContent = '\u26A0\uFE0F UWAGA: Tre\u015B\u0107 tej notatki (wraz z za\u0142\u0105cznikami) b\u0119dzie widoczna w panelu pacjenta.';
            form.appendChild(warningEl);
        }

        // Alert formularza
        var alertEl = document.createElement('div');
        alertEl.id = 'noteFormAlert';
        alertEl.className = 'alert';
        form.appendChild(alertEl);

        // Wiersz: Tytuł + Data sesji
        var formRow = document.createElement('div');
        formRow.className = 'form-row';

        // Pole: Tytuł
        var titleGroup = document.createElement('div');
        titleGroup.className = 'form-group';
        var titleLabel = document.createElement('label');
        titleLabel.setAttribute('for', 'noteTitle');
        titleLabel.textContent = 'Tytu\u0142 ';
        var titleRequired = document.createElement('span');
        titleRequired.className = 'required';
        titleRequired.textContent = '*';
        titleLabel.appendChild(titleRequired);
        titleGroup.appendChild(titleLabel);
        var titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.id = 'noteTitle';
        titleInput.placeholder = 'Temat sesji\u2026';
        titleInput.value = titleVal;
        titleGroup.appendChild(titleInput);
        formRow.appendChild(titleGroup);

        // Pole: Data sesji
        var dateGroup = document.createElement('div');
        dateGroup.className = 'form-group';
        var dateLabel = document.createElement('label');
        dateLabel.setAttribute('for', 'noteDate');
        dateLabel.textContent = 'Data sesji ';
        var dateRequired = document.createElement('span');
        dateRequired.className = 'required';
        dateRequired.textContent = '*';
        dateLabel.appendChild(dateRequired);
        dateGroup.appendChild(dateLabel);
        var dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'noteDate';
        dateInput.value = dateVal;
        dateGroup.appendChild(dateInput);
        formRow.appendChild(dateGroup);

        form.appendChild(formRow);

        // Pole: Treść
        var contentGroup = document.createElement('div');
        contentGroup.className = 'form-group';
        var contentLabel = document.createElement('label');
        contentLabel.setAttribute('for', 'noteContent');
        contentLabel.textContent = 'Tre\u015B\u0107 notatki';
        contentGroup.appendChild(contentLabel);
        var textarea = document.createElement('textarea');
        textarea.id = 'noteContent';
        textarea.rows = 6;
        textarea.placeholder = 'Przebieg sesji, obserwacje, zadania\u2026';
        textarea.value = contentVal;
        contentGroup.appendChild(textarea);
        form.appendChild(contentGroup);

        // Pole: Załączniki (dropzone)
        var attGroup = document.createElement('div');
        attGroup.className = 'form-group';
        var attLabel = document.createElement('label');
        attLabel.textContent = 'Za\u0142\u0105czniki';
        attGroup.appendChild(attLabel);

        var dropzone = document.createElement('div');
        dropzone.id = 'noteDropzone';
        dropzone.className = 'dropzone';
        dropzone.setAttribute('tabindex', '0');
        dropzone.setAttribute('role', 'button');
        dropzone.setAttribute('aria-label', 'Przeciągnij pliki lub kliknij aby wybrać');

        var dzText = document.createElement('div');
        dzText.className = 'dropzone-text';
        var dzStrong = document.createElement('strong');
        dzStrong.textContent = 'Przeci\u0105gnij pliki';
        dzText.appendChild(dzStrong);
        dzText.appendChild(document.createTextNode(' lub kliknij aby wybra\u0107'));
        dropzone.appendChild(dzText);

        var dzHint = document.createElement('div');
        dzHint.className = 'dropzone-hint';
        dzHint.textContent = 'JPG, PNG, WEBP, PDF, DOC, TXT \u2014 max 10 MB, do 10 plik\u00F3w';
        dropzone.appendChild(dzHint);

        attGroup.appendChild(dropzone);

        var previews = document.createElement('div');
        previews.id = 'notePreviews';
        previews.className = 'upload-previews';
        attGroup.appendChild(previews);

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'noteFileInput';
        fileInput.multiple = true;
        fileInput.accept = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt';
        fileInput.style.display = 'none';
        attGroup.appendChild(fileInput);

        form.appendChild(attGroup);

        // Istniejące załączniki (przy edycji)
        if (isEdit && existingNote.note_attachments && existingNote.note_attachments.length > 0) {
            var existingGroup = document.createElement('div');
            existingGroup.className = 'form-group';
            var existingLabel = document.createElement('label');
            existingLabel.textContent = 'Istniej\u0105ce za\u0142\u0105czniki';
            existingGroup.appendChild(existingLabel);
            var existingContainer = document.createElement('div');
            existingContainer.id = 'existingAttachments';
            existingContainer.className = 'note-attachments-grid';
            existingGroup.appendChild(existingContainer);
            form.appendChild(existingGroup);
        }

        // Przyciski formularza
        var formActions = document.createElement('div');
        formActions.className = 'note-form-buttons';

        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn-primary';
        saveBtn.setAttribute('data-action', 'save-note');
        saveBtn.textContent = 'Zapisz notatk\u0119';
        formActions.appendChild(saveBtn);

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.setAttribute('data-action', 'cancel-form');
        cancelBtn.textContent = 'Anuluj';
        formActions.appendChild(cancelBtn);

        form.appendChild(formActions);

        // Wstaw formularz do kontenera
        var notesContent = document.getElementById('notesContent');
        if (notesContent) {
            while (notesContent.firstChild) notesContent.removeChild(notesContent.firstChild);
            notesContent.appendChild(form);
        }

        var loadMore = document.getElementById('notesLoadMore');
        if (loadMore) loadMore.style.display = 'none';

        Attachments.initDropzone(dropzone, 'noteFileInput', previews, alertEl, null);

        if (isEdit && existingNote.note_attachments && existingNote.note_attachments.length > 0) {
            var existingEl = document.getElementById('existingAttachments');
            if (existingEl) {
                Attachments.renderAttachments(existingNote.note_attachments, existingEl);
            }
        }
    },

    saveNote: function () {
        // UX guard, not security
        if (this._saveInProgress) return;
        this._saveInProgress = true;

        var titleEl = document.getElementById('noteTitle');
        var dateEl = document.getElementById('noteDate');
        var contentEl = document.getElementById('noteContent');
        var saveBtn = document.querySelector('[data-action="save-note"]');
        if (saveBtn) {
            saveBtn.setAttribute('aria-disabled', 'true');
            saveBtn.style.cursor = 'not-allowed';
        }
        var alertEl = document.getElementById('noteFormAlert');

        var title = titleEl ? titleEl.value.trim() : '';
        var sessionDate = dateEl ? dateEl.value : '';
        var content = contentEl ? contentEl.value.trim() : '';

        if (!title) {
            this.showFormAlert(alertEl, 'Tytu\u0142 notatki jest wymagany.');
            if (titleEl) titleEl.focus();
            this._saveInProgress = false;
            if (saveBtn) {
                saveBtn.removeAttribute('aria-disabled');
                saveBtn.style.cursor = '';
            }
            return;
        }
        if (!sessionDate) {
            this.showFormAlert(alertEl, 'Data sesji jest wymagana.');
            if (dateEl) dateEl.focus();
            this._saveInProgress = false;
            if (saveBtn) {
                saveBtn.removeAttribute('aria-disabled');
                saveBtn.style.cursor = '';
            }
            return;
        }

        var self = this;
        var clientId = this.activeClientId;
        var noteId = this.currentNoteId;
        var isEdit = !!this.editingNote;

        Auth.setLoading(saveBtn, true);

        var totalPending = Attachments.pendingFiles.length;

        Attachments.uploadAll(clientId, noteId)
            .then(function (uploadedFiles) {
                // Powiadom o nieudanych uploadach
                var failedCount = totalPending - uploadedFiles.length;
                if (failedCount > 0) {
                    self.showFormAlert(alertEl, failedCount + ' z ' + totalPending + ' plików nie udało się przesłać. Notatka zostanie zapisana bez nich.');
                }
                var noteData = {
                    client_id: clientId,
                    title: title,
                    session_date: sessionDate,
                    content: content,
                    appointment_id: self._appointmentContext
                        ? self._appointmentContext.appointmentId
                        : (self.editingNote ? self.editingNote.appointment_id : null)
                };

                var dbPromise;
                if (isEdit) {
                    dbPromise = supabase
                        .from('notes')
                        .update(noteData)
                        .eq('id', noteId)
                        .eq('author_id', Auth.currentUser.id)
                        .select('*, note_attachments(id, file_name, file_path, mime_type, file_size)');
                } else {
                    noteData.id = noteId;
                    noteData.author_id = Auth.currentUser ? Auth.currentUser.id : null;
                    dbPromise = supabase
                        .from('notes')
                        .insert(noteData)
                        .select('*, note_attachments(id, file_name, file_path, mime_type, file_size)');
                }

                return dbPromise.then(function (result) {
                    if (result.error) throw result.error;
                    var uploaderId = Auth.currentUser ? Auth.currentUser.id : null;
                    return Attachments.saveMetadata(noteId, uploadedFiles, uploaderId)
                        .then(function () { return result; });
                });
            })
            .then(function () {
                self._saveInProgress = false;
                Auth.setLoading(saveBtn, false);
                if (saveBtn) {
                    saveBtn.removeAttribute('aria-disabled');
                    saveBtn.style.cursor = '';
                }
                self.editingNote = null;
                self._appointmentContext = null;
                self.notes = [];
                self.offset = 0;
                Attachments.reset();
                self.loadNotes(clientId, false);
            })
            .catch(function (err) {
                self._saveInProgress = false;
                logError('Błąd zapisu notatki:', err);
                Auth.setLoading(saveBtn, false);
                if (saveBtn) {
                    saveBtn.removeAttribute('aria-disabled');
                    saveBtn.style.cursor = '';
                }
                var errMsg = (err && err.message) ? err.message : 'Wyst\u0105pi\u0142 b\u0142\u0105d podczas zapisu notatki.';
                self.showFormAlert(alertEl, errMsg);
            });
    },

    // =========================================================
    // Usuwanie notatki
    // =========================================================
    deleteNote: function (noteId) {
        if (!confirm('Czy na pewno chcesz usun\u0105\u0107 t\u0119 notatk\u0119? Operacji nie mo\u017Cna cofn\u0105\u0107.')) return;

        var self = this;
        var noteToDelete = null;

        for (var i = 0; i < this.notes.length; i++) {
            if (this.notes[i].id === noteId) {
                noteToDelete = this.notes[i];
                break;
            }
        }

        var filePaths = [];
        if (noteToDelete && noteToDelete.note_attachments) {
            for (var j = 0; j < noteToDelete.note_attachments.length; j++) {
                filePaths.push(noteToDelete.note_attachments[j].file_path);
            }
        }

        supabase
            .from('notes')
            .delete()
            .eq('id', noteId)
            .eq('author_id', Auth.currentUser.id)
            .then(function (result) {
                if (result.error) {
                    logError('Błąd usuwania notatki:', result.error);
                    alert('Nie uda\u0142o si\u0119 usun\u0105\u0107 notatki. Spr\u00F3buj ponownie.');
                    return;
                }

                self.notes = self.notes.filter(function (n) { return n.id !== noteId; });
                self.renderNotes(self.notes, Auth.isTherapist());

                var loadMore = document.getElementById('notesLoadMore');
                if (loadMore && self.notes.length > 0 && self.notes.length % self.PAGE_SIZE === 0) {
                    loadMore.style.display = '';
                }

                Attachments.deleteFiles(filePaths);
            })
            .catch(function (err) {
                logError('Wyjątek podczas usuwania notatki:', err);
                alert('Nie uda\u0142o si\u0119 usun\u0105\u0107 notatki. Spr\u00F3buj ponownie.');
            });
    },

    // =========================================================
    // Delegacja zdarzeń
    // =========================================================
    handleContentClick: function (e) {
        var self = this;
        var actionEl = e.target.closest('[data-action]');

        if (actionEl) {
            var action = actionEl.getAttribute('data-action');

            if (action === 'edit-note') {
                e.stopPropagation();
                var noteId = actionEl.getAttribute('data-note-id');
                var note = null;
                for (var i = 0; i < self.notes.length; i++) {
                    if (self.notes[i].id === noteId) { note = self.notes[i]; break; }
                }
                if (note) self.showForm(note);
                return;
            }

            if (action === 'delete-note') {
                e.stopPropagation();
                var deleteId = actionEl.getAttribute('data-note-id');
                if (deleteId) self.deleteNote(deleteId);
                return;
            }

            if (action === 'save-note') {
                self.saveNote();
                return;
            }

            if (action === 'cancel-form') {
                self.editingNote = null;
                Attachments.reset();
                self.renderNotes(self.notes, Auth.isTherapist());
                var loadMore = document.getElementById('notesLoadMore');
                if (loadMore && self.notes.length > 0 && self.notes.length % self.PAGE_SIZE === 0) {
                    loadMore.style.display = '';
                }
                return;
            }

            if (action === 'view-attachment') {
                var filePath = actionEl.getAttribute('data-file-path');
                var mimeType = actionEl.getAttribute('data-mime-type');
                if (filePath && mimeType) {
                    Attachments.handleAttachmentClick(filePath, mimeType);
                }
                return;
            }
        }

        // Kliknięcie w kartę (bez akcji) — rozwiń
        var card = e.target.closest('.note-card');
        if (card && !card.classList.contains('expanded')) {
            self.expandNote(card);
        }
    },

    expandNote: function (cardEl) {
        var expanded = document.querySelectorAll('.note-card.expanded');
        for (var i = 0; i < expanded.length; i++) {
            expanded[i].classList.remove('expanded');
        }

        cardEl.classList.add('expanded');

        var grid = cardEl.querySelector('.note-attachments-grid');
        if (grid && grid.getAttribute('data-attachments-rendered') !== 'true') {
            var noteId = cardEl.getAttribute('data-note-id');
            var note = null;
            for (var j = 0; j < this.notes.length; j++) {
                if (this.notes[j].id === noteId) { note = this.notes[j]; break; }
            }
            if (note && note.note_attachments && note.note_attachments.length > 0) {
                Attachments.renderAttachments(note.note_attachments, grid);
            } else {
                grid.style.display = 'none';
            }
            grid.setAttribute('data-attachments-rendered', 'true');
        }
    },

    // =========================================================
    // Metody pomocnicze
    // =========================================================
    showEmpty: function (message) {
        var notesContent = document.getElementById('notesContent');
        if (!notesContent) return;

        while (notesContent.firstChild) notesContent.removeChild(notesContent.firstChild);

        var div = document.createElement('div');
        div.className = 'empty-state';

        var icon = document.createElement('div');
        icon.className = 'empty-icon';
        icon.textContent = '\uD83D\uDCDD';
        div.appendChild(icon);

        var msg = document.createElement('p');
        msg.textContent = message;
        div.appendChild(msg);

        notesContent.appendChild(div);
    },

    showFormAlert: function (el, message) {
        if (!el) return;
        el.textContent = message;
        el.className = 'alert error visible';
    },

    formatDate: function (dateStr) {
        if (!dateStr) return '';
        var parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return parts[2] + '.' + parts[1] + '.' + parts[0];
    },

    escapeHtml: function (str) {
        if (str === null || str === undefined) return '';
        var div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    },

    pluralize: function (count) {
        if (count === 1) return '';
        if (count >= 2 && count <= 4) return 'i';
        return '\u00F3w';
    }
};
