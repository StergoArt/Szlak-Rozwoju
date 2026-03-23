// Moduł przeglądarki dokumentów i zdjęć
var Documents = {
    _initialized: false,
    _offset: 0,
    _limit: 50,
    _allLoaded: false,
    _attachments: [],

    IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    DOC_ICONS: {
        'application/pdf': '\uD83D\uDCC4',
        'application/msword': '\uD83D\uDCDD',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '\uD83D\uDCDD',
        'text/plain': '\uD83D\uDCC3'
    },

    init: function () {
        if (this._initialized) return;
        this._initialized = true;
        var self = this;

        var list = document.getElementById('documentsList');
        if (list) {
            list.addEventListener('click', function (e) { self.handleClick(e); });
        }

        Router.addRouteListener(function (hash) {
            if (hash === '#/documents') {
                self.onEnter();
            }
        });
    },

    onEnter: function () {
        this._offset = 0;
        this._allLoaded = false;
        this._attachments = [];
        this.loadDocuments();
    },

    loadDocuments: function () {
        var self = this;
        var list = document.getElementById('documentsList');

        if (this._offset === 0 && list) {
            while (list.firstChild) list.removeChild(list.firstChild);
            var spinner = document.createElement('div');
            spinner.className = 'spinner-container';
            var sp = document.createElement('span');
            sp.className = 'spinner';
            spinner.appendChild(sp);
            list.appendChild(spinner);
        }

        // Defense-in-depth: klient widzi tylko swoje dokumenty
        var isTherapist = Auth.isTherapist();
        var selectStr = isTherapist
            ? '*, note:notes!note_attachments_note_id_fkey(title, session_date, client:profiles!notes_client_id_fkey(full_name))'
            : '*, note:notes!inner!note_attachments_note_id_fkey(title, session_date, client:profiles!notes_client_id_fkey(full_name))';

        var query = supabase
            .from('note_attachments')
            .select(selectStr);

        if (!isTherapist) {
            query = query.eq('note.client_id', Auth.currentUser.id);
        }

        query
            .order('created_at', { ascending: false })
            .range(this._offset, this._offset + this._limit - 1)
            .then(function (result) {
                if (result.error) {
                    logError('B\u0142\u0105d \u0142adowania dokument\u00F3w:', result.error);
                    self.renderEmpty('Wyst\u0105pi\u0142 b\u0142\u0105d podczas \u0142adowania dokument\u00F3w.');
                    return;
                }
                var data = result.data || [];
                if (data.length < self._limit) {
                    self._allLoaded = true;
                }
                self._attachments = self._attachments.concat(data);
                self._offset += data.length;
                self.renderDocuments();
            })
            .catch(function (err) {
                logError('Wyj\u0105tek dokument\u00F3w:', err);
                self.renderEmpty('Wyst\u0105pi\u0142 b\u0142\u0105d po\u0142\u0105czenia.');
            });
    },

    renderDocuments: function () {
        var list = document.getElementById('documentsList');
        if (!list) return;
        while (list.firstChild) list.removeChild(list.firstChild);

        if (this._attachments.length === 0) {
            this.renderEmpty('Brak dokument\u00F3w i zdj\u0119\u0107. Dodaj za\u0142\u0105czniki do notatek z sesji, aby pojawi\u0142y si\u0119 tutaj.');
            return;
        }

        var isTherapist = Auth.isTherapist();
        var fragment = document.createDocumentFragment();

        for (var i = 0; i < this._attachments.length; i++) {
            var att = this._attachments[i];
            var card = document.createElement('div');
            card.className = 'document-card';
            card.setAttribute('data-file-path', att.file_path);
            card.setAttribute('data-mime-type', att.mime_type || '');

            // Miniaturka lub ikona
            var preview = document.createElement('div');
            preview.className = 'document-preview';

            if (this.isImage(att.mime_type)) {
                preview.classList.add('document-preview-image');
                preview.setAttribute('data-file-path', att.file_path);
                // Załaduj podgląd asynchronicznie
                this.loadThumbnail(preview, att.file_path);
            } else {
                var icon = document.createElement('span');
                icon.className = 'document-icon';
                icon.textContent = this.DOC_ICONS[att.mime_type] || '\uD83D\uDCCE';
                preview.appendChild(icon);
            }
            card.appendChild(preview);

            // Nazwa pliku
            var name = document.createElement('div');
            name.className = 'document-name';
            name.textContent = att.file_name || 'Plik';
            name.title = att.file_name || '';
            card.appendChild(name);

            // Metadata
            var meta = document.createElement('div');
            meta.className = 'document-meta';

            var parts = [];
            if (att.note && att.note.session_date) {
                var d = att.note.session_date.split('-');
                parts.push(d[2] + '.' + d[1] + '.' + d[0]);
            }
            if (isTherapist && att.note && att.note.client && att.note.client.full_name) {
                parts.push(att.note.client.full_name);
            }
            meta.textContent = parts.join(' \u00B7 ');
            card.appendChild(meta);

            fragment.appendChild(card);
        }

        list.appendChild(fragment);

        // Przycisk "Załaduj więcej"
        if (!this._allLoaded) {
            var self = this;
            var loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'btn-secondary btn-sm';
            loadMoreBtn.textContent = 'Za\u0142aduj wi\u0119cej';
            loadMoreBtn.style.marginTop = '20px';
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.style.marginLeft = 'auto';
            loadMoreBtn.style.marginRight = 'auto';
            loadMoreBtn.addEventListener('click', function () {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = '\u0141adowanie...';
                self.loadDocuments();
            });
            list.appendChild(loadMoreBtn);
        }
    },

    renderEmpty: function (message) {
        var list = document.getElementById('documentsList');
        if (!list) return;
        while (list.firstChild) list.removeChild(list.firstChild);

        var div = document.createElement('div');
        div.className = 'empty-state';
        var icon = document.createElement('div');
        icon.className = 'empty-icon';
        icon.textContent = '\uD83D\uDCC1';
        div.appendChild(icon);
        var text = document.createElement('p');
        text.textContent = message;
        div.appendChild(text);
        list.appendChild(div);
    },

    loadThumbnail: function (el, filePath) {
        Attachments.getSignedUrl(filePath).then(function (url) {
            if (url) {
                el.style.backgroundImage = 'url(' + url + ')';
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
            }
        });
    },

    isImage: function (mimeType) {
        return this.IMAGE_TYPES.indexOf(mimeType) !== -1;
    },

    handleClick: function (e) {
        var card = e.target.closest('.document-card');
        if (!card) return;
        var filePath = card.getAttribute('data-file-path');
        var mimeType = card.getAttribute('data-mime-type');
        if (!filePath) return;

        var self = this;
        Attachments.getSignedUrl(filePath).then(function (url) {
            if (!url) return;
            if (self.isImage(mimeType)) {
                // Lightbox z attachments.js
                var lightbox = document.getElementById('lightbox');
                var img = document.getElementById('lightboxImg');
                if (lightbox && img) {
                    img.src = url;
                    lightbox.style.display = 'flex';
                }
            } else {
                // Download
                var a = document.createElement('a');
                a.href = url;
                a.download = '';
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }
};
