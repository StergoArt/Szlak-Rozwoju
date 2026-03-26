// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Service Card Toggle
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', function (e) {
        if (e.target.classList.contains('cta-button') || e.target.closest('.cta-button')) {
            return;
        }

        const details = this.querySelector('.service-details');
        const toggle = this.querySelector('.service-toggle');

        document.querySelectorAll('.service-card').forEach(otherCard => {
            if (otherCard !== this) {
                otherCard.classList.remove('active');
                otherCard.querySelector('.service-details').classList.remove('active');
                otherCard.querySelector('.service-toggle').style.display = 'block';
            }
        });

        this.classList.toggle('active');
        details.classList.toggle('active');
        toggle.style.display = details.classList.contains('active') ? 'none' : 'block';
    });
});

// FAQ Toggle
document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', function () {
        document.querySelectorAll('.faq-item').forEach(otherItem => {
            if (otherItem !== this) {
                otherItem.classList.remove('active');
            }
        });
        this.classList.toggle('active');
    });
});

// Form Submit
document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();

    var consentCheckbox = document.getElementById('rodoConsent');
    if (!consentCheckbox || !consentCheckbox.checked) {
        alert('Proszę wyrazić zgodę na przetwarzanie danych osobowych.');
        return;
    }

    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    alert('Dziękujemy! Formularz został wysłany. Skontaktujemy się wkrótce.');
    this.reset();
});

// Fade In Animation on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(element => {
    observer.observe(element);
});

// Logo fallback
const logo = document.getElementById('logo');
const footerLogo = document.getElementById('footerLogo');

logo.onerror = function () {
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRkZDQzAwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMzciIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxQTIwMkMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlN6bGFrIFJvendvanU8L3RleHQ+Cjwvc3ZnPg==';
    this.src = placeholder;
};

footerLogo.onerror = function () {
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRkZDQzAwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMzciIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxQTIwMkMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlN6bGFrIFJvendvanU8L3RleHQ+Cjwvc3ZnPg==';
    this.src = placeholder;
};

// Chat Widget
// RODO: Administrator musi regularnie czyscic logi w dashboardzie EmailJS
// (emailjs.com -> Dashboard -> Email History / Contacts).
// Zalecana retencja: max 90 dni. Wylaczyc "Save contacts" jesli niepotrzebne.
(function () {
    var EMAILJS_SERVICE_ID = 'service_vqv8i1b';
    var EMAILJS_TEMPLATE_ID = 'service_vqfs743';
    var EMAILJS_PUBLIC_KEY = 'wJ2SpllarvSg60jLo';

    var chatInput, chatSendBtn;
    var chatMode = 'buttons';
    var chatUserData = { message: '', name: '', contact: '' };

    var chatFlows = {
        welcome: {
            message: 'Cześć! 👋 Jestem wirtualnym konsultantem **Szlaku Rozwoju**.\n\nW czym mogę Ci pomóc?',
            replies: [
                { text: '📋 Jakie usługi oferujecie?', target: 'services' },
                { text: '💰 Cennik', target: 'pricing' },
                { text: '📅 Jak się zapisać?', target: 'booking' },
                { text: '👩‍⚕️ O terapeutce', target: 'about' },
                { text: '👶 Grupy wiekowe', target: 'ages' },
                { text: '📍 Lokalizacja', target: 'location' }
            ]
        },
        services: {
            message: 'Oferujemy **4 główne usługi**:\n\n🧩 **Socjoterapia indywidualna** — praca 1:1 nad emocjami i relacjami\n👥 **Socjoterapia grupowa** — zajęcia w małych grupach (2-6 osób)\n🗣️ **TUS** — Trening Umiejętności Społecznych\n🏕️ **Zajęcia ruchowe i obozy** — rozwój przez aktywność\n\nO której usłudze chcesz dowiedzieć się więcej?',
            replies: [
                { text: '🧩 Indywidualna', target: 'service_individual' },
                { text: '👥 Grupowa', target: 'service_group' },
                { text: '🗣️ TUS', target: 'service_tus' },
                { text: '🏕️ Zajęcia/obozy', target: 'service_outdoor' },
                { text: '💰 Cennik', target: 'pricing' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        service_individual: {
            message: '🧩 **Socjoterapia indywidualna**\n\nPraca jeden na jeden z terapeutką. Sesja trwa **60 minut** i jest dostosowana do indywidualnych potrzeb.\n\nPomaga w:\n• trudnościach emocjonalnych\n• problemach w relacjach\n• niskiej samoocenie\n• lęku społecznym\n\n💰 Cena: od **140 zł** za sesję (160 zł bez pakietu)\n🎁 Pakiet 5 sesji: 700 zł | Pakiet 10 sesji: 1360 zł',
            replies: [
                { text: '📅 Umów się', target: 'booking' },
                { text: '🎁 Pakiety z rabatem', target: 'packages' },
                { text: '👥 Socjoterapia grupowa', target: 'service_group' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        service_group: {
            message: '👥 **Socjoterapia grupowa**\n\nZajęcia w **małych grupach 2-6 osób**, co zapewnia komfortową i bezpieczną atmosferę.\n\nSesje trwają **75 minut**, raz w tygodniu.\n\nUczestnicy uczą się:\n• współpracy i komunikacji\n• rozwiązywania konfliktów\n• budowania relacji\n• rozpoznawania emocji\n\n💰 Cena: **90 zł** / osoba',
            replies: [
                { text: '📅 Umów się', target: 'booking' },
                { text: '🎁 Pakiety z rabatem', target: 'packages' },
                { text: '📋 Inne usługi', target: 'services' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        service_tus: {
            message: '🗣️ **Trening Umiejętności Społecznych (TUS)**\n\nStrukturalne zajęcia rozwijające kompetencje społeczne. Dedykowane również osobom z **ASD/zespołem Aspergera**.\n\nProgram obejmuje:\n• naukę nawiązywania kontaktów\n• asertywność\n• radzenie sobie z emocjami\n• współpracę w grupie\n\n💰 **Indywidualnie:** 50 min / od **105 zł** (120 zł bez pakietu)\n💰 **Grupowo (2-6 osób):** 60 min / **100 zł**\n🎁 Pakiet 5 sesji TUS: 525 zł | Pakiet 10 sesji TUS: 1050 zł',
            replies: [
                { text: '📅 Umów się', target: 'booking' },
                { text: '🎁 Pakiety z rabatem', target: 'packages' },
                { text: '📋 Inne usługi', target: 'services' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        service_outdoor: {
            message: '🏕️ **Zajęcia ruchowe i obozy rozwojowe**\n\nŁączymy aktywność fizyczną z rozwojem osobistym. Organizujemy:\n\n• regularne zajęcia ruchowe\n• obozy rozwojowe w okresie wakacji i ferii\n• wyjazdy integracyjne\n\nTo świetna opcja na budowanie pewności siebie i nowych przyjaźni w naturalnym środowisku.',
            replies: [
                { text: '📅 Umów się', target: 'booking' },
                { text: '📋 Inne usługi', target: 'services' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        pricing: {
            message: '💰 **Cennik usług:**\n\n🧩 Socjoterapia indywidualna — od **140 zł** / 60 min (160 zł bez pakietu)\n👥 Socjoterapia grupowa — **90 zł** / osoba / 75 min\n🗣️ TUS indywidualny — od **105 zł** / 50 min (120 zł bez pakietu)\n🗣️ TUS grupowy (2-6 osób) — **100 zł** / 60 min\n🏕️ Obozy — cena ustalana indywidualnie\n📄 Zaświadczenie — **50 zł** | Opinia — **120 zł**\n\n🎁 Dostępne **pakiety 5 i 10 sesji** z rabatem 12,5%!',
            replies: [
                { text: '🎁 Pakiety z rabatem', target: 'packages' },
                { text: '📅 Umów się', target: 'booking' },
                { text: '📋 Usługi', target: 'services' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        packages: {
            message: '🎁 **Pakiety sesji z rabatem:**\n\n🧩 **Socjoterapia indywidualna:**\n📦 Pakiet 5 sesji: ~~800 zł~~ → **700 zł** (oszczędzasz 100 zł)\n📦 Pakiet 10 sesji: ~~1600 zł~~ → **1360 zł** (oszczędzasz 240 zł)\n\n🗣️ **TUS indywidualny:**\n📦 Pakiet 5 sesji TUS: ~~600 zł~~ → **525 zł** (oszczędzasz 75 zł)\n📦 Pakiet 10 sesji TUS: ~~1200 zł~~ → **1020 zł** (oszczędzasz 180 zł)\n\nPakiety są ważne przez 3 miesiące od zakupu.',
            replies: [
                { text: '📅 Umów się', target: 'booking' },
                { text: '💰 Pełny cennik', target: 'pricing' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        booking: {
            message: '📅 **Jak się zapisać?**\n\nNajprościej przez **formularz kontaktowy** na naszej stronie — odpowiadamy w ciągu 24h.\n\nMożesz też:\n📞 Zadzwonić\n📧 Napisać e-mail\n\n🕐 **Godziny pracy:**\nPoniedziałek–Piątek: 8:00–18:00\nSobota: po uzgodnieniu',
            replies: [
                { text: '📝 Przejdź do formularza', target: 'scrollToContact', cta: true },
                { text: '🔄 Jak wygląda współpraca?', target: 'process' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        about: {
            message: '👩‍⚕️ **Dorota Kluz**\n\nSocjoterapeutka i specjalistka rozwoju osobistego z wieloletnim doświadczeniem.\n\nProwadzi gabinet **Szlak Rozwoju** w Żywcu, gdzie pomaga dzieciom, młodzieży i dorosłym w:\n• budowaniu pewności siebie\n• rozwijaniu umiejętności społecznych\n• radzeniu sobie z trudnymi emocjami\n\nKażdego klienta traktuje indywidualnie, tworząc bezpieczną i wspierającą przestrzeń.',
            replies: [
                { text: '📋 Usługi', target: 'services' },
                { text: '📅 Umów się', target: 'booking' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        ages: {
            message: '👶 **Grupy wiekowe:**\n\n🧒 **Dzieci (6–12 lat)** — socjoterapia, TUS, zajęcia ruchowe\n🧑‍🎓 **Młodzież (13–18 lat)** — socjoterapia indywidualna i grupowa, TUS\n🧑 **Dorośli (18+)** — rozwój osobisty, praca nad relacjami\n\nKażdy program jest dostosowany do potrzeb i możliwości danej grupy wiekowej.',
            replies: [
                { text: '📋 Usługi', target: 'services' },
                { text: '💰 Cennik', target: 'pricing' },
                { text: '📅 Umów się', target: 'booking' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        location: {
            message: '📍 **Lokalizacja:**\n\nGabinet **Szlak Rozwoju** mieści się w **Żywcu**.\n\n🕐 **Godziny pracy:**\nPoniedziałek–Piątek: 8:00–18:00\nSobota: po uzgodnieniu\n\n💻 Dostępne są również **sesje online** — wygodna opcja dla osób spoza Żywca.',
            replies: [
                { text: '💻 Sesje online', target: 'online' },
                { text: '📅 Umów się', target: 'booking' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        online: {
            message: '💻 **Sesje online**\n\nOferujemy sesje przez wideorozmowę — tak samo skuteczne jak stacjonarne.\n\n**Jak to działa:**\n1. Umawiasz termin\n2. Otrzymujesz link do spotkania\n3. Łączysz się z domu o umówionej porze\n\nPotrzebujesz jedynie komputera/telefonu z kamerą i stabilnego internetu.\n\nCeny takie same jak sesji stacjonarnych.',
            replies: [
                { text: '📅 Umów się', target: 'booking' },
                { text: '💰 Cennik', target: 'pricing' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        },
        process: {
            message: '🔄 **5 kroków współpracy:**\n\n**1. Kontakt** — napisz lub zadzwoń\n**2. Konsultacja** — bezpłatna rozmowa wstępna\n**3. Plan** — ustalamy cele i formę pracy\n**4. Sesje** — regularne spotkania (stacjonarnie lub online)\n**5. Efekty** — monitorujemy postępy i dostosowujemy plan\n\nPierwszy krok jest najważniejszy — resztą zajmiemy się razem! 😊',
            replies: [
                { text: '📅 Umów się', target: 'booking' },
                { text: '💰 Cennik', target: 'pricing' },
                { text: '🔙 Wróć do menu', target: 'welcome' }
            ]
        }
    };

    var chatFab = document.getElementById('chatFab');
    var chatWindow = document.getElementById('chatWindow');
    var chatClose = document.getElementById('chatClose');
    var chatMessages = document.getElementById('chatMessages');
    var chatReplies = document.getElementById('chatReplies');
    var chatBadge = chatFab.querySelector('.chat-fab-badge');
    var chatOpened = false;
    var chatInitialized = false;

    function renderSafeMessage(text, container) {
        text = String(text);
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            if (i > 0) container.appendChild(document.createElement('br'));
            parseInline(lines[i], container);
        }
    }

    function parseInline(text, parent) {
        var re = /(\*\*)(.*?)\1|~~(.*?)~~|_(.*?)_|\[([^\]]+)\]\(([^)]+)\)/g;
        var last = 0;
        var m;
        while ((m = re.exec(text)) !== null) {
            if (m.index > last) {
                parent.appendChild(document.createTextNode(text.substring(last, m.index)));
            }
            if (m[2] !== undefined) {
                var strong = document.createElement('strong');
                strong.textContent = m[2];
                parent.appendChild(strong);
            } else if (m[3] !== undefined) {
                var del = document.createElement('del');
                del.textContent = m[3];
                parent.appendChild(del);
            } else if (m[4] !== undefined) {
                var em = document.createElement('em');
                parseInline(m[4], em);
                parent.appendChild(em);
            } else if (m[5] !== undefined && m[6] !== undefined) {
                var href = m[6];
                if (isSafeUrl(href)) {
                    var a = document.createElement('a');
                    a.href = href;
                    a.textContent = m[5];
                    a.rel = 'noopener noreferrer';
                    a.target = '_blank';
                    parent.appendChild(a);
                } else {
                    parent.appendChild(document.createTextNode(m[5]));
                }
            }
            last = re.lastIndex;
        }
        if (last < text.length) {
            parent.appendChild(document.createTextNode(text.substring(last)));
        }
    }

    function isSafeUrl(url) {
        if (url.indexOf(':') === -1) return true;
        if (/^https?:\/\//i.test(url)) {
            try {
                var parsed = new URL(url, window.location.href);
                if (parsed.origin === window.location.origin) return true;
                var allowed = ['szlak-rozwoju.pl', 'www.szlak-rozwoju.pl'];
                return allowed.indexOf(parsed.hostname) !== -1;
            } catch (e) { return false; }
        }
        return false;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addUserMessage(text) {
        var msg = document.createElement('div');
        msg.className = 'chat-msg-user';
        msg.textContent = text;
        chatMessages.appendChild(msg);
        scrollToBottom();
    }

    function showTyping() {
        var typing = document.createElement('div');
        typing.className = 'chat-typing';
        typing.id = 'chatTypingIndicator';
        for (var di = 0; di < 3; di++) { var dot = document.createElement('span'); dot.className = 'chat-typing-dot'; typing.appendChild(dot); }
        chatMessages.appendChild(typing);
        scrollToBottom();
    }

    function hideTyping() {
        var typing = document.getElementById('chatTypingIndicator');
        if (typing) typing.remove();
    }

    function addBotMessage(text, callback) {
        showTyping();
        setTimeout(function () {
            hideTyping();
            var msg = document.createElement('div');
            msg.className = 'chat-msg-bot';
            renderSafeMessage(text, msg);
            chatMessages.appendChild(msg);
            scrollToBottom();
            if (callback) callback();
        }, 600);
    }

    function showReplies(replies) {
        while (chatReplies.firstChild) chatReplies.removeChild(chatReplies.firstChild);
        replies.forEach(function (reply) {
            var btn = document.createElement('button');
            btn.className = 'chat-reply-btn' + (reply.cta ? ' chat-reply-cta' : '');
            btn.textContent = reply.text;
            btn.addEventListener('click', function () {
                handleReply(reply);
            });
            chatReplies.appendChild(btn);
        });
    }

    function handleReply(reply) {
        addUserMessage(reply.text);
        while (chatReplies.firstChild) chatReplies.removeChild(chatReplies.firstChild);

        if (reply.target === 'scrollToContact') {
            setTimeout(function () {
                closeChat();
                var contact = document.getElementById('contact');
                if (contact) {
                    contact.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
            return;
        }

        navigateTo(reply.target);
    }

    function navigateTo(nodeId) {
        var node = chatFlows[nodeId];
        if (!node) return;
        addBotMessage(node.message, function () {
            showReplies(node.replies);
        });
    }

    function openChat() {
        chatWindow.classList.add('open');
        chatFab.classList.add('active');
        chatBadge.classList.add('hidden');
        chatOpened = true;

        if (window.innerWidth <= 968) {
            document.body.classList.add('chat-open');
        }

        if (!chatInitialized) {
            chatInitialized = true;
            navigateTo('welcome');
        }
    }

    function closeChat() {
        chatWindow.classList.remove('open');
        chatFab.classList.remove('active');
        document.body.classList.remove('chat-open');
    }

    function toggleChat() {
        if (chatWindow.classList.contains('open')) {
            closeChat();
        } else {
            openChat();
        }
    }

    chatFab.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', closeChat);

    chatInput = document.getElementById('chatInput');
    chatSendBtn = document.getElementById('chatSendBtn');

    function handleTextInput() {
        var text = chatInput.value.trim();
        if (!text || chatMode === 'sending') return;

        chatInput.value = '';

        if (chatMode === 'buttons') {
            chatUserData.message = text;
            addUserMessage(text);
            while (chatReplies.firstChild) chatReplies.removeChild(chatReplies.firstChild);
            addBotMessage('Dziękuję za wiadomość! Aby mogła do Ciebie odpisać, podaj proszę swoje **imię**:', function () {
                chatMode = 'collecting_name';
                chatInput.focus();
            });
        } else if (chatMode === 'collecting_name') {
            chatUserData.name = text;
            addUserMessage(text);
            addBotMessage('Świetnie, ' + text + '! Podaj jeszcze **e-mail lub numer telefonu**, żebyśmy mogli się z Tobą skontaktować.\n\n_Podając dane, wyrażasz zgodę na ich przetwarzanie ([Polityka Prywatności](polityka-prywatnosci.html))._', function () {
                chatMode = 'collecting_contact';
                chatInput.focus();
            });
        } else if (chatMode === 'collecting_contact') {
            chatUserData.contact = text;
            addUserMessage(text);
            chatMode = 'sending';
            chatSendBtn.disabled = true;
            sendChatEmail();
        }
    }

    function buildChatHistory() {
        var msgs = chatMessages.querySelectorAll('.chat-msg-bot, .chat-msg-user');
        var history = [];
        msgs.forEach(function (m) {
            var prefix = m.classList.contains('chat-msg-user') ? 'Klient' : 'Bot';
            history.push(prefix + ': ' + m.textContent);
        });
        return history.join('\n');
    }

    function sendChatEmail() {
        addBotMessage('Wysyłam wiadomość... ⏳', function () {
            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                message: chatUserData.message,
                user_name: chatUserData.name,
                user_contact: chatUserData.contact,
                chat_history: buildChatHistory()
            }, EMAILJS_PUBLIC_KEY).then(function () {
                addBotMessage('Wiadomość wysłana! ✅ Dorota skontaktuje się z Tobą najszybciej jak to możliwe.\n\nCzy mogę pomóc w czymś jeszcze?', function () {
                    resetChatMode();
                    showReplies(chatFlows.welcome.replies);
                });
            }, function () {
                addBotMessage('Niestety nie udało się wysłać wiadomości. 😔\n\nSkontaktuj się z nami bezpośrednio:\n📧 **biuro@szlak-rozwoju.pl**\n\nLub skorzystaj z formularza kontaktowego na stronie.', function () {
                    resetChatMode();
                    showReplies([
                        { text: '📋 Formularz kontaktowy', target: 'scrollToContact' },
                        { text: '🔙 Wróć do menu', target: 'welcome' }
                    ]);
                });
            });
        });
    }

    function resetChatMode() {
        chatMode = 'buttons';
        chatUserData = { message: '', name: '', contact: '' };
        chatSendBtn.disabled = false;
    }

    chatSendBtn.addEventListener('click', handleTextInput);
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTextInput();
        }
    });
})();

// Hamburger Menu
(function() {
    var hamburger = document.getElementById('hamburger');
    var navLinks = document.querySelector('.nav-links');
    if (!hamburger || !navLinks) return;
    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('open');
        this.setAttribute('aria-expanded', navLinks.classList.contains('open'));
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
})();

// Banner RODO
(function() {
    if (!localStorage.getItem('rodo_banner_accepted')) {
        var banner = document.getElementById('privacyBanner');
        if (banner) banner.style.display = 'block';
    }
    var closeBtn = document.getElementById('privacyBannerClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('privacyBanner').style.display = 'none';
            localStorage.setItem('rodo_banner_accepted', '1');
        });
    }
})();
