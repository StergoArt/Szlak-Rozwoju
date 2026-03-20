// Hash router z auth guards i obsługą błędów
var Router = {
    routes: {
        public: ['#/login', '#/register'],
        protected: ['#/dashboard', '#/notes', '#/schedule', '#/session']
    },

    defaultPublic: '#/login',
    defaultProtected: '#/dashboard',
    _routeListeners: [],

    addRouteListener: function (fn) {
        this._routeListeners.push(fn);
    },

    init: function () {
        window.addEventListener('hashchange', function () { Router.handleRoute(); });
        this.handleRoute();
    },

    handleRoute: function () {
        var hash = window.location.hash || this.defaultPublic;
        var self = this;

        // Wyodrębnij bazowy route (bez parametru) dla #/session/{id}
        var baseRoute = hash;
        if (hash.indexOf('#/session/') === 0) {
            baseRoute = '#/session';
        }

        // Sprawdź sesję i przekieruj odpowiednio
        supabase.auth.getSession().then(function (result) {
            var session = result.data.session;

            if (session && self.routes.public.indexOf(baseRoute) !== -1) {
                window.location.hash = self.defaultProtected;
                return;
            }

            if (!session && self.routes.protected.indexOf(baseRoute) !== -1) {
                window.location.hash = self.defaultPublic;
                return;
            }

            if (!session && self.routes.public.indexOf(baseRoute) === -1 && self.routes.protected.indexOf(baseRoute) === -1) {
                window.location.hash = self.defaultPublic;
                return;
            }

            if (session && self.routes.public.indexOf(baseRoute) === -1 && self.routes.protected.indexOf(baseRoute) === -1) {
                window.location.hash = self.defaultProtected;
                return;
            }

            self.showView(baseRoute);
            for (var i = 0; i < self._routeListeners.length; i++) {
                self._routeListeners[i](hash);
            }
        }).catch(function (err) {
            console.error('Router — błąd sesji:', err);
            // W razie błędu pokaż login
            self.showView(self.defaultPublic);
        });
    },

    showView: function (hash) {
        document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });

        var viewId = hash.replace('#/', 'view-');
        var view = document.getElementById(viewId);
        if (view) {
            view.classList.add('active');
        }
    },

    navigate: function (hash) {
        window.location.hash = hash;
    }
};
