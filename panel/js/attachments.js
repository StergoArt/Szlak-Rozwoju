// Moduł zarządzania załącznikami — upload, podgląd, lightbox
var Attachments = {

    // --- Stałe ---
    ALLOWED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ],
    MAX_SIZE: 10 * 1024 * 1024, // 10 MB
    MAX_FILES: 10,
    IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

    // --- Stan ---
    pendingFiles: [],

    // --- Lightbox ---
    initLightbox: function () {
        var lightbox = document.getElementById('lightbox');
        if (!lightbox) return;

        lightbox.addEventListener('click', function (e) {
            // Klik w tło lub przycisk zamknięcia
            if (
                e.target.classList.contains('lightbox-backdrop') ||
                e.target.classList.contains('lightbox-close')
            ) {
                Attachments.closeLightbox();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                Attachments.closeLightbox();
            }
        });
    },

    openLightbox: function (src) {
        var lightbox = document.getElementById('lightbox');
        var img = document.getElementById('lightboxImg');
        if (!lightbox || !img) return;

        img.src = src;
        lightbox.classList.remove('u-hidden');
        document.body.style.overflow = 'hidden';
    },

    closeLightbox: function () {
        var lightbox = document.getElementById('lightbox');
        var img = document.getElementById('lightboxImg');
        if (!lightbox) return;

        lightbox.classList.add('u-hidden');
        if (img) img.src = '';
        document.body.style.overflow = '';
    },

    // --- Walidacja ---
    validateFile: function (file) {
        if (this.ALLOWED_TYPES.indexOf(file.type) === -1) {
            return 'Niedozwolony typ pliku: ' + file.name + '. Dozwolone: JPG, PNG, WEBP, PDF, DOC, DOCX, TXT.';
        }
        if (file.size > this.MAX_SIZE) {
            return 'Plik ' + file.name + ' przekracza maksymalny rozmiar 10 MB.';
        }
        return null;
    },

    isImage: function (mimeType) {
        return this.IMAGE_TYPES.indexOf(mimeType) !== -1;
    },

    getFileIcon: function (mimeType) {
        if (this.isImage(mimeType)) return '🖼️';
        if (mimeType === 'application/pdf') return '📄';
        if (
            mimeType === 'application/msword' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) return '📝';
        if (mimeType === 'text/plain') return '📃';
        return '📎';
    },

    // --- Zarządzanie plikami oczekującymi ---
    reset: function () {
        // Zwolnij URL-e obiektów przed wyczyszczeniem
        for (var i = 0; i < this.pendingFiles.length; i++) {
            if (this.pendingFiles[i].preview) {
                URL.revokeObjectURL(this.pendingFiles[i].preview);
            }
        }
        this.pendingFiles = [];
    },

    addFiles: function (fileList, onUpdate) {
        var errors = [];
        var currentCount = this.pendingFiles.length;

        for (var i = 0; i < fileList.length; i++) {
            var file = fileList[i];

            if (currentCount >= this.MAX_FILES) {
                errors.push('Osiągnięto limit ' + this.MAX_FILES + ' plików.');
                break;
            }

            var validationError = this.validateFile(file);
            if (validationError) {
                errors.push(validationError);
                continue;
            }

            var preview = null;
            if (this.isImage(file.type)) {
                preview = URL.createObjectURL(file);
            }

            var entry = {
                id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                file: file,
                name: file.name,
                type: file.type,
                size: file.size,
                preview: preview,
                uploading: false,
                error: false,
                path: null
            };

            this.pendingFiles.push(entry);
            currentCount++;
        }

        if (onUpdate) onUpdate();
        return errors;
    },

    removeFile: function (fileId, onUpdate) {
        for (var i = 0; i < this.pendingFiles.length; i++) {
            if (this.pendingFiles[i].id === fileId) {
                if (this.pendingFiles[i].preview) {
                    URL.revokeObjectURL(this.pendingFiles[i].preview);
                }
                this.pendingFiles.splice(i, 1);
                break;
            }
        }
        if (onUpdate) onUpdate();
    },

    _clearContainer: function (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    },

    renderPreviews: function (container) {
        if (!container) return;
        this._clearContainer(container);

        if (this.pendingFiles.length === 0) return;

        for (var i = 0; i < this.pendingFiles.length; i++) {
            var entry = this.pendingFiles[i];
            var item = document.createElement('div');
            item.className = 'upload-preview' + (entry.error ? ' error' : '');

            if (entry.preview) {
                var img = document.createElement('img');
                img.src = entry.preview;
                img.className = 'attachment-thumb';
                img.alt = entry.name;
                item.appendChild(img);
            } else {
                var iconEl = document.createElement('div');
                iconEl.className = 'file-icon';
                iconEl.textContent = this.getFileIcon(entry.type);
                item.appendChild(iconEl);
            }

            var nameEl = document.createElement('span');
            nameEl.className = 'file-name';
            nameEl.textContent = entry.name;
            item.appendChild(nameEl);

            var removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-btn';
            removeBtn.setAttribute('data-action', 'remove-file');
            removeBtn.setAttribute('data-file-id', entry.id);
            removeBtn.textContent = '✕';
            removeBtn.setAttribute('aria-label', 'Usuń plik');
            item.appendChild(removeBtn);

            container.appendChild(item);
        }
    },

    // --- Upload do Supabase Storage ---
    uploadAll: function (clientId, noteId) {
        var self = this;
        var promises = this.pendingFiles.map(function (entry) {
            // Sanityzacja nazwy pliku — zastąp niedozwolone znaki podkreśleniem
            var safeName = entry.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
            var timestamp = Date.now();
            var path = clientId + '/' + noteId + '/' + timestamp + '_' + safeName;

            entry.uploading = true;

            return supabase.storage
                .from('note-attachments')
                .upload(path, entry.file, { contentType: entry.type })
                .then(function (result) {
                    entry.uploading = false;
                    if (result.error) {
                        logError('Błąd uploadu pliku ' + entry.name + ':', result.error);
                        entry.error = true;
                        return null;
                    }
                    entry.path = path;
                    return {
                        file_name: entry.name,
                        file_path: path,
                        mime_type: entry.type,
                        file_size: entry.size
                    };
                })
                .catch(function (err) {
                    entry.uploading = false;
                    entry.error = true;
                    logError('Wyjątek podczas uploadu pliku ' + entry.name + ':', err);
                    return null;
                });
        });

        return Promise.all(promises).then(function (results) {
            // Odfiltruj null-e (błędy) i zwróć metadane
            return results.filter(function (r) { return r !== null; });
        });
    },

    saveMetadata: function (noteId, uploadedFiles, uploaderId) {
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return Promise.resolve();
        }

        var rows = uploadedFiles.map(function (f) {
            return {
                note_id: noteId,
                file_name: f.file_name,
                file_path: f.file_path,
                mime_type: f.mime_type,
                file_size: f.file_size,
                uploaded_by: uploaderId
            };
        });

        return supabase
            .from('note_attachments')
            .insert(rows)
            .then(function (result) {
                if (result.error) {
                    logError('Błąd zapisu metadanych załączników:', result.error);
                    throw result.error;
                }
                return result;
            });
    },

    getSignedUrl: function (filePath) {
        return supabase.storage
            .from('note-attachments')
            .createSignedUrl(filePath, 3600)
            .then(function (result) {
                if (result.error) {
                    logError('Błąd generowania signed URL:', result.error);
                    return null;
                }
                return result.data.signedUrl;
            });
    },

    // --- Renderowanie istniejących załączników ---
    renderAttachments: function (attachments, container) {
        if (!container) return;
        this._clearContainer(container);

        if (!attachments || attachments.length === 0) {
            return;
        }

        for (var i = 0; i < attachments.length; i++) {
            var att = attachments[i];
            var item = document.createElement('div');
            item.className = 'attachment-thumb';
            item.setAttribute('data-action', 'view-attachment');
            item.setAttribute('data-file-path', att.file_path);
            item.setAttribute('data-mime-type', att.mime_type);

            if (this.isImage(att.mime_type)) {
                var img = document.createElement('img');
                img.className = 'attachment-thumb';
                img.alt = att.file_name;

                // Zamknięcie przez IIFE — zachowanie poprawnej referencji do img
                (function (imgEl, filePath) {
                    Attachments.getSignedUrl(filePath).then(function (url) {
                        if (url) {
                            imgEl.src = url;
                        }
                    });
                })(img, att.file_path);

                item.appendChild(img);
            } else {
                var iconEl = document.createElement('div');
                iconEl.className = 'file-icon';
                iconEl.textContent = this.getFileIcon(att.mime_type);
                item.appendChild(iconEl);
            }

            var nameEl = document.createElement('span');
            nameEl.className = 'file-name';
            nameEl.textContent = att.file_name;
            item.appendChild(nameEl);

            container.appendChild(item);
        }
    },

    handleAttachmentClick: function (filePath, mimeType) {
        if (this.isImage(mimeType)) {
            this.getSignedUrl(filePath).then(function (url) {
                if (url) {
                    Attachments.openLightbox(url);
                }
            });
        } else {
            // Pobierz dokument przez tymczasowy element <a>
            this.getSignedUrl(filePath).then(function (url) {
                if (!url) return;
                var a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                // Wyciągnij nazwę pliku z ścieżki
                var parts = filePath.split('/');
                a.download = parts[parts.length - 1];
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
        }
    },

    deleteFiles: function (filePaths) {
        if (!filePaths || filePaths.length === 0) return;

        supabase.storage
            .from('note-attachments')
            .remove(filePaths)
            .then(function (result) {
                if (result.error) {
                    logError('Błąd usuwania plików ze Storage:', result.error);
                }
            })
            .catch(function (err) {
                logError('Wyjątek podczas usuwania plików ze Storage:', err);
            });
    },

    // --- Dropzone ---
    initDropzone: function (dropzoneEl, fileInputId, previewsContainer, alertEl, onUpdate) {
        if (!dropzoneEl) return;

        var fileInput = document.getElementById(fileInputId);
        var self = this;

        function showErrors(errors) {
            if (!alertEl || errors.length === 0) return;
            alertEl.textContent = errors[0]; // Pokaż pierwszy błąd
            alertEl.className = 'alert error visible';
        }

        function hideAlert() {
            if (!alertEl) return;
            alertEl.className = 'alert';
            alertEl.textContent = '';
        }

        // Klik w dropzone otwiera dialog wyboru pliku
        dropzoneEl.addEventListener('click', function (e) {
            if (
                e.target.getAttribute('data-action') === 'remove-file' ||
                e.target.closest('[data-action="remove-file"]')
            ) return;
            if (fileInput) fileInput.click();
        });

        // Obsługa klawiatury (a11y) — Enter/Space otwiera dialog
        dropzoneEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (fileInput) fileInput.click();
            }
        });

        // Obsługa przeciągania
        dropzoneEl.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropzoneEl.classList.add('dragover');
        });

        dropzoneEl.addEventListener('dragleave', function (e) {
            e.stopPropagation();
            dropzoneEl.classList.remove('dragover');
        });

        dropzoneEl.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropzoneEl.classList.remove('dragover');
            hideAlert();
            var files = e.dataTransfer.files;
            if (files && files.length > 0) {
                var errors = self.addFiles(files, onUpdate);
                if (errors.length > 0) showErrors(errors);
                self.renderPreviews(previewsContainer);
            }
        });

        // Obsługa zmiany w file input
        if (fileInput) {
            fileInput.addEventListener('change', function () {
                hideAlert();
                if (fileInput.files && fileInput.files.length > 0) {
                    var errors = self.addFiles(fileInput.files, onUpdate);
                    if (errors.length > 0) showErrors(errors);
                    self.renderPreviews(previewsContainer);
                    // Wyczyść input, żeby można było wgrać ten sam plik ponownie
                    fileInput.value = '';
                }
            });
        }

        // Delegacja zdarzeń dla przycisków usuwania podglądu
        if (previewsContainer) {
            previewsContainer.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-action="remove-file"]');
                if (btn) {
                    var fileId = btn.getAttribute('data-file-id');
                    if (fileId) {
                        self.removeFile(fileId, onUpdate);
                        self.renderPreviews(previewsContainer);
                    }
                }
            });
        }
    }
};
