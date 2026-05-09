// Показывает модальное окно с подробностями курса
window.openCourseDetails = function(courseTitle) {
  const modal = document.createElement('div');
  modal.className = 'overlay on';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-strip"></div>
      <div class="modal-body">
        <h2>Подробнее о курсе</h2>
        <div class="modal-course-info">
          <div class="modal-course-icon">🎓</div>
          <div>
            <div class="modal-course-name">${courseTitle}</div>
            <div class="modal-course-price">Актуальная программа, поддержка и сертификат</div>
          </div>
        </div>
        <div class="modal-sub">Подробная информация о курсе появится здесь. Для записи или консультации используйте кнопку "Записаться" или войдите в аккаунт.</div>
        <div style="display:flex;gap:10px;">
          <button class="ccard-enroll" onclick="document.body.removeChild(this.closest('.overlay'))">Закрыть</button>
          <a class="ccard-enroll" href="#" onclick="document.body.removeChild(this.closest('.overlay'));window.openEnroll && window.openEnroll(courseTitle,'🎓','-','#f5c842');return false;">Записаться</a>
          <a class="ccard-more" href="assets/Registered/login.html">Войти</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};
/* ============================================
   DavronMarket Engine v2.1 — Core
   Автоматический движок сайта: Header, Footer,
   Auth, Profile, Notifications, Broadcast
   ============================================
   Структура папок:
   DAvronmarkt.com/
   ├── css/  (engine.css, style.css)
   ├── js/   (engine.js, app.js)
   └── Cтраницы/
       ├── index.html, services.html, courses.html,
       │   profile.html, admin.html, app.html
       └── Registered/
           ├── login.html
           └── register.html
   ============================================ */

(function() {
  'use strict';

  // ═══ ROUTING ═══
  // Map legacy engine page names to the current project structure.
  const ROUTES = {
    'index.html': '/index.html',
    'services.html': '/servises.html',
    'courses.html': '/Course.html',
    'app.html': '/File/Programms/app.html',
    'cutlist.html': '/File/Programms/cutlist.html',
    'kino.html': '/Films.html',
    'profile.html': '/profile.html',
    'panel.html': '/My-account/panel.html',
    'admin.html': '/My-account/admin.html',
    'owner.html': '/My-account/owner.html',
    'resume.html': '/My-account/anketa.html',
    'announcements.html': '/My-account/obyavleniya.html',
    'header-footer.html': '/assets/Footer and header/panel.html',
    'login.html': '/assets/Registered/login.html',
    'register.html': '/assets/Registered/register.html',
    // New sections
    'shop.html': '/shop.html',
    'productions.html': '/productions.html',
    'avia.html': '/avia.html',
    'taxi.html': '/taxi.html',
    'sport.html': '/sport.html',
    'dating.html': '/dating.html',
    'games-online.html': '/games-online.html',
    'news.html': '/news.html'
    ,'music.html': '/music.html'
  };

  function P(filename) {
    return ROUTES[filename] || filename;
  }

  function regLink(filename) {
    return ROUTES[filename] || filename;
  }

  // ═══ CONFIG ═══
  const DM = {
    name: 'DavronMarket',
    tagline: 'Первый маркетплейс Таджикистана',
    phone: '+992 92 961-21-11',
    email: 'info@davronmarket.tj',
    whatsapp: 'https://wa.me/992929612111',
    telegram: 'https://t.me/Davronjonsamadov',
    telegramChannel: 'https://t.me/davronmarket',
    address: '32 мкр, Бозори Сомониён, Худжанд',
    year: new Date().getFullYear(),
    version: '2.1.0'
  };

  const UI_KEY = 'dm_ui_settings';
  const GOOGLE_QUICK_KEY = 'dm_google_quick_user';
  const THEME_KEY = 'dm_theme';

  // Apply theme immediately to prevent flash of wrong theme
  (function applyStoredTheme() {
    var t = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  })();
  const DEFAULT_UI_SETTINGS = {
    brandName: DM.name,
    tagline: DM.tagline,
    phone: DM.phone,
    email: DM.email,
    whatsapp: DM.whatsapp,
    telegram: DM.telegram,
    telegramChannel: DM.telegramChannel,
    address: DM.address,
    instagram: 'https://www.instagram.com/davronmarket/',
    youtube: 'https://www.youtube.com/@davronmarket',
    footerNote: 'Все права защищены.',
    aboutLabel: 'О нас',
    contactsLabel: 'Контакты'
  };

  let pendingAuthRedirect = '';
  const DEFAULT_OWNER = {
    name: 'Davron Owner',
    email: 'owner@davronmarket.com',
    phone: '+992929612111',
    password: 'DavronOwner2026!'
  };

  function getUiSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(UI_KEY)) || {};
      return Object.assign({}, DEFAULT_UI_SETTINGS, saved);
    } catch {
      return Object.assign({}, DEFAULT_UI_SETTINGS);
    }
  }

  function saveUiSettings(settings) {
    const next = Object.assign({}, DEFAULT_UI_SETTINGS, settings || {});
    localStorage.setItem(UI_KEY, JSON.stringify(next));
    return next;
  }

  function isAuthHref(href) {
    const h = String(href || '').toLowerCase();
    return h.indexOf('login.html') !== -1
      || h.indexOf('register.html') !== -1
      || h.indexOf('/login/') !== -1
      || h.indexOf('/register/') !== -1
      || h.indexOf('/lostpassword/') !== -1
      || h.indexOf('/resetpass/') !== -1;
  }

  function splitNameParts(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  }

  function isProfileComplete(user) {
    if (!user) return false;
    const first = String(user.firstName || '').trim();
    const last = String(user.lastName || '').trim();
    const phone = String(user.phone || '').trim();
    if (first && last && phone) return true;
    const split = splitNameParts(user.name);
    return !!(split.firstName && split.lastName && phone);
  }

  function requireProfileCompletion(actionLabel) {
    const user = Auth.currentUser();
    if (!user) {
      toast('🔒 Сначала войдите в аккаунт', 'error');
      window.location.href = regLink('login.html');
      return false;
    }
    if (isProfileComplete(user)) return true;

    const msg = 'Для участия в розыгрыше и открытия всех функций заполните: имя, фамилию и телефон в настройках аккаунта.';
    const hasRecent = Notify.forCurrentUser().some(function(n) {
      return n && n.type === 'update' && n.title === '⚠️ Заполните профиль' && n.msg === msg;
    });
    if (!hasRecent) {
      Notify.addForUser(user.id, {
        title: '⚠️ Заполните профиль',
        msg: msg,
        type: 'update'
      });
    }
    toast('⚠️ ' + (actionLabel || 'Действие') + ' доступно после заполнения профиля', 'error');
    setTimeout(function() {
      window.location.href = P('profile.html') + '?setup=1';
    }, 700);
    return false;
  }

  function getAuthModeFromHref(href) {
    const h = String(href || '').toLowerCase();
    return (h.indexOf('register.html') !== -1 || h.indexOf('/register/') !== -1) ? 'register' : 'login';
  }

  // ═══ AUTH — LocalStorage based ═══
  const Auth = {
    _key: 'dm_user',
    _usersKey: 'dm_users',

    getUsers() {
      try { return JSON.parse(localStorage.getItem(this._usersKey)) || []; }
      catch { return []; }
    },

    saveUsers(users) {
      localStorage.setItem(this._usersKey, JSON.stringify(users));
    },

    currentUser() {
      try { return JSON.parse(localStorage.getItem(this._key)); }
      catch { return null; }
    },

    isLoggedIn() {
      return !!this.currentUser();
    },

    register(name, email, phone, password) {
      if (!name || !email || !phone || !password) return { ok: false, msg: 'Заполните все поля' };
      if (password.length < 6) return { ok: false, msg: 'Пароль минимум 6 символов' };

      const users = this.getUsers();
      if (users.find(u => u.email === email)) return { ok: false, msg: 'Email уже зарегистрирован' };

      const user = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name,
        email,
        phone,
        password: this._hash(password),
        avatar: name.charAt(0).toUpperCase(),
        role: users.length === 0 ? 'owner' : 'user',
        created: new Date().toISOString()
      };

      const parts = splitNameParts(name);
      user.firstName = parts.firstName;
      user.lastName = parts.lastName;

      users.push(user);
      this.saveUsers(users);

      const session = { ...user };
      delete session.password;
      localStorage.setItem(this._key, JSON.stringify(session));

      // Send welcome broadcast to the new user
      Notify.addForUser(user.id, {
        title: '🎉 Добро пожаловать в DavronMarket!',
        msg: 'Вы успешно зарегистрированы. Изучите наши услуги, курсы и акции!',
        type: 'welcome'
      });

      return { ok: true, user: session };
    },

    login(email, password) {
      if (!email || !password) return { ok: false, msg: 'Заполните все поля' };

      const users = this.getUsers();
      const user = users.find(u => u.email === email);
      if (!user) return { ok: false, msg: 'Пользователь не найден' };
      if (user.password !== this._hash(password)) return { ok: false, msg: 'Неверный пароль' };

      const session = { ...user };
      delete session.password;
      localStorage.setItem(this._key, JSON.stringify(session));

      return { ok: true, user: session };
    },

    // Google Sign-In callback
    googleLogin(googleUser) {
      const name = googleUser.name || 'Google User';
      const email = googleUser.email;
      const avatar = googleUser.picture || name.charAt(0).toUpperCase();

      if (!email) return { ok: false, msg: 'Не удалось получить email от Google' };

      const users = this.getUsers();
      let user = users.find(u => u.email === email);

      if (user) {
        // Existing user — log in
        const session = { ...user };
        delete session.password;
        if (avatar && avatar.length > 2) session.avatar = avatar;
        localStorage.setItem(this._key, JSON.stringify(session));
        if (!isProfileComplete(session)) {
          Notify.addForUser(session.id, {
            title: '🎁 Розыгрыш и полный доступ',
            msg: 'Заполните имя, фамилию и телефон в настройках аккаунта, чтобы открыть все функции сайта.',
            type: 'update'
          });
        }
        return { ok: true, user: session };
      }

      // New user — auto-register
      user = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name,
        email,
        phone: '',
        password: '',
        avatar: avatar,
        role: users.length === 0 ? 'owner' : 'user',
        provider: 'google',
        created: new Date().toISOString()
      };

      const parts = splitNameParts(name);
      user.firstName = parts.firstName;
      user.lastName = parts.lastName;

      users.push(user);
      this.saveUsers(users);

      const session = { ...user };
      delete session.password;
      localStorage.setItem(this._key, JSON.stringify(session));

      Notify.addForUser(user.id, {
        title: '🎁 Розыгрыш и полный доступ',
        msg: 'Обязательно заполните имя, фамилию и телефон в настройках аккаунта, чтобы открыть все функции сайта.',
        type: 'update'
      });

      Notify.addForUser(user.id, {
        title: '🎉 Добро пожаловать в DavronMarket!',
        msg: 'Вы зарегистрировались через Google. Изучите наши услуги, курсы и акции!',
        type: 'welcome'
      });

      return { ok: true, user: session, isNew: true };
    },

    logout() {
      localStorage.removeItem(this._key);
      window.location.href = P('index.html');
    },

    updateProfile(data) {
      const user = this.currentUser();
      if (!user) return false;

      const updated = { ...user, ...data };
      localStorage.setItem(this._key, JSON.stringify(updated));

      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        Object.assign(users[idx], data);
        this.saveUsers(users);
      }
      return true;
    },

    resetPasswordRequest(email) {
      if (!email) return { ok: false, msg: 'Email не указан' };
      const users = this.getUsers();
      const user = users.find(u => u.email === email);
      if (!user) return { ok: true, msg: 'Если email зарегистрирован, инструкция отправлена' };
      const resetCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user._reset_code = resetCode;
      user._reset_time = Date.now();
      this.saveUsers(users);
      return { ok: true, msg: 'Код восстановления готов', resetCode, userId: user.id };
    },

    resetPasswordConfirm(userId, resetCode, newPassword) {
      if (!userId || !resetCode || !newPassword) return { ok: false, msg: 'Все поля обязательны' };
      if (newPassword.length < 6) return { ok: false, msg: 'Пароль минимум 6 символов' };
      const users = this.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return { ok: false, msg: 'Пользователь не найден' };
      if (user._reset_code !== resetCode) return { ok: false, msg: 'Неверный или истёкший код' };
      if (Date.now() - user._reset_time > 3600000) {
        delete user._reset_code; delete user._reset_time;
        this.saveUsers(users);
        return { ok: false, msg: 'Код истёк, запросите новый' };
      }
      user.password = this._hash(newPassword);
      delete user._reset_code; delete user._reset_time;
      this.saveUsers(users);
      return { ok: true, msg: 'Пароль успешно изменён' };
    },

    _hash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
      }
      return 'h_' + Math.abs(hash).toString(36);
    }
  };

  function ensureDefaultOwner() {
    const users = Auth.getUsers();
    const hasOwner = users.some(function(u) { return u && u.role === 'owner'; });
    const existingByEmail = users.find(function(u) { return u && u.email === DEFAULT_OWNER.email; });

    if (existingByEmail) {
      if (existingByEmail.role !== 'owner') {
        existingByEmail.role = 'owner';
        Auth.saveUsers(users);
      }
      return;
    }

    if (hasOwner) return;

    const ownerUser = {
      id: 'owner_' + Date.now().toString(36),
      name: DEFAULT_OWNER.name,
      firstName: 'Davron',
      lastName: 'Owner',
      email: DEFAULT_OWNER.email,
      phone: DEFAULT_OWNER.phone,
      password: Auth._hash(DEFAULT_OWNER.password),
      avatar: 'D',
      role: 'owner',
      created: new Date().toISOString()
    };

    users.push(ownerUser);
    Auth.saveUsers(users);
  }

  // ═══ NOTIFICATIONS / BROADCAST SYSTEM ═══
  const Notify = {
    _key: 'dm_notifications',
    _broadcastKey: 'dm_broadcasts',

    getAll() {
      try { return JSON.parse(localStorage.getItem(this._key)) || []; }
      catch { return []; }
    },

    save(list) {
      localStorage.setItem(this._key, JSON.stringify(list));
    },

    getBroadcasts() {
      try { return JSON.parse(localStorage.getItem(this._broadcastKey)) || []; }
      catch { return []; }
    },

    saveBroadcasts(list) {
      localStorage.setItem(this._broadcastKey, JSON.stringify(list));
    },

    // Add notification for specific user
    addForUser(userId, data) {
      const all = this.getAll();
      all.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        userId: userId,
        title: data.title || '',
        msg: data.msg || '',
        type: data.type || 'info',
        date: new Date().toISOString(),
        read: false
      });
      this.save(all);
    },

    // Broadcast to ALL registered users (admin or worker)
    broadcast(data) {
      const user = Auth.currentUser();
      if (!user || (user.role !== 'owner' && user.role !== 'admin' && user.role !== 'worker')) return false;

      const users = Auth.getUsers();
      const broadcastId = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

      // Save broadcast record
      const broadcasts = this.getBroadcasts();
      broadcasts.push({
        id: broadcastId,
        title: data.title || '',
        msg: data.msg || '',
        type: data.type || 'promo',
        sentBy: user.name,
        date: new Date().toISOString(),
        recipients: users.length
      });
      this.saveBroadcasts(broadcasts);

      // Add notification for each user
      const all = this.getAll();
      users.forEach(function(u) {
        all.push({
          id: broadcastId + '_' + u.id,
          userId: u.id,
          title: data.title || '',
          msg: data.msg || '',
          type: data.type || 'promo',
          date: new Date().toISOString(),
          read: false
        });
      });
      this.save(all);
      return true;
    },

    // Get unread count for current user
    unreadCount() {
      const user = Auth.currentUser();
      if (!user) return 0;
      return this.getAll().filter(n => n.userId === user.id && !n.read).length;
    },

    // Get notifications for current user
    forCurrentUser() {
      const user = Auth.currentUser();
      if (!user) return [];
      return this.getAll()
        .filter(n => n.userId === user.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // Mark all as read for current user
    markAllRead() {
      const user = Auth.currentUser();
      if (!user) return;
      const all = this.getAll();
      all.forEach(n => { if (n.userId === user.id) n.read = true; });
      this.save(all);
    },

    // Mark single as read
    markRead(id) {
      const all = this.getAll();
      const n = all.find(x => x.id === id);
      if (n) { n.read = true; this.save(all); }
    },

    // Delete notification
    remove(id) {
      const all = this.getAll().filter(n => n.id !== id);
      this.save(all);
    }
  };

  // ═══ AUTH GUARD — Protected pages ═══
  const PROTECTED_PAGES = ['admin', 'panel', 'owner'];
  const PUBLIC_PAGES = ['index', 'login', 'register'];

  function guardPage() {
    const page = getCurrentPage();
    if (PROTECTED_PAGES.indexOf(page) !== -1 && !Auth.isLoggedIn()) {
      window.location.href = regLink('login.html');
      return true; // blocked
    }
    return false;
  }

  function googleOneClickLogin(callback) {
    let remembered = null;
    try {
      remembered = JSON.parse(localStorage.getItem(GOOGLE_QUICK_KEY) || 'null');
    } catch (_) {
      remembered = null;
    }
    if (remembered && remembered.email) {
      callback(remembered);
      return;
    }
    showGoogleModal(function(user) {
      localStorage.setItem(GOOGLE_QUICK_KEY, JSON.stringify({
        name: user.name || 'Google User',
        email: user.email || '',
        picture: user.picture || ''
      }));
      callback(user);
    });
  }

  // Intercept auth links and open them in modal UI.
  function guardLinks() {
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (isAuthHref(href)) {
        e.preventDefault();
        const h = String(href || '').toLowerCase();
        if (h.indexOf('/lostpassword/') !== -1 || h.indexOf('/resetpass/') !== -1) {
          showResetPasswordModal();
        } else {
          showAuthModal(getAuthModeFromHref(href));
        }
        return;
      }
    });
  }

  // ═══ THEME ═══
  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  function setTheme(theme) {
    var t = (theme === 'light') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.setAttribute('data-theme', t);
  }

  // ═══ HEADER COMPONENT ═══
  function renderHeader() {
    const existing = document.getElementById('dm-header');
    if (existing) existing.remove();
    const existingMobile = document.getElementById('dm-mobile-nav');
    if (existingMobile) existingMobile.remove();

    const page = getCurrentPage();
    const user = Auth.currentUser();
    const unread = Notify.unreadCount();
    const ui = getUiSettings();

    const nav = document.createElement('nav');
    nav.id = 'dm-header';
    nav.className = 'dm-nav';
    nav.innerHTML = `
      <a href="${P('index.html')}" class="dm-nav-logo">${ui.brandName}</a>
      <div class="dm-nav-links">
        <a class="dm-nav-link ${page === 'shop' ? 'active' : ''}" href="${P('shop.html')}">Магазин</a>
        <a class="dm-nav-link ${page === 'services' ? 'active' : ''}" href="${P('services.html')}">Услуги</a>
        <a class="dm-nav-link ${page === 'courses' ? 'active' : ''}" href="${P('courses.html')}">Курсы</a>
        <a class="dm-nav-link ${page === 'kino' ? 'active' : ''}" href="${P('kino.html')}">Кино</a>
        <a class="dm-nav-link ${page === 'about' ? 'active' : ''}" href="${P('index.html')}#about">${ui.aboutLabel}</a>
        <a class="dm-nav-link ${page === 'contacts' ? 'active' : ''}" href="${P('index.html')}#contacts">${ui.contactsLabel}</a>
      </div>
      <div class="dm-nav-right">
        <div class="dm-theme-toggle" title="Переключить тему">
          <button class="dm-theme-toggle-btn ${getTheme()==='dark'?'active':''}" onclick="window.dmEngine.setTheme('dark');window.dmEngine.renderHeader()" title="Тёмная">🌙</button>
          <button class="dm-theme-toggle-btn ${getTheme()==='light'?'active':''}" onclick="window.dmEngine.setTheme('light');window.dmEngine.renderHeader()" title="Светлая">☀️</button>
        </div>
        ${user ? `
          ${unread > 0 ? '<span class="dm-nav-notif-badge" onclick="window.dmEngine.toggleNotifPanel()" title="Уведомления">🔔 <b>' + unread + '</b></span>' : ''}
          <div class="dm-nav-profile" onclick="window.dmEngine.toggleProfileMenu()">
            <div class="dm-nav-avatar">${user.avatarImage ? '<img src="' + user.avatarImage + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">' : (user.avatar || user.name.charAt(0))}</div>
            <span class="dm-nav-username">${user.name.split(' ')[0]}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="dm-profile-dropdown" id="dm-profile-dropdown">
            <div class="dm-dd-header">
              <div class="dm-dd-avatar">${user.avatarImage ? '<img src="' + user.avatarImage + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">' : (user.avatar || user.name.charAt(0))}</div>
              <div>
                <div class="dm-dd-name">${user.name}</div>
                <div class="dm-dd-email">${user.email}</div>
              </div>
            </div>
            <div class="dm-dd-divider"></div>
            <a class="dm-dd-item" href="${P('panel.html')}">📊 Моя панель</a>
            <a class="dm-dd-item" href="${P('resume.html')}">📋 Мои анкеты</a>
            <a class="dm-dd-item" href="${P('announcements.html')}">📢 Объявления</a>
            ${user.role === 'owner' ? '<a class="dm-dd-item" href="' + P('owner.html') + '">👑 Владелец</a>' : ''}
            ${(user.role === 'owner' || user.role === 'admin' || user.role === 'worker') ? '<a class="dm-dd-item" href="' + P('admin.html') + '">⚙️ Админ-панель</a>' : ''}
            ${user.role === 'owner' ? '<a class="dm-dd-item" href="' + P('header-footer.html') + '">🧩 Header / Footer</a>' : ''}
            <div class="dm-dd-divider"></div>
            <a class="dm-dd-item" href="${P('shop.html')}">Магазин</a>
            <a class="dm-dd-item" href="${P('services.html')}">Заказ услуг</a>
            <a class="dm-dd-item" href="${P('courses.html')}">Курсы</a>
            <a class="dm-dd-item" href="${P('music.html')}">🎵 Music</a>
            <a class="dm-dd-item" href="${P('kino.html')}">Кино</a>
            <a class="dm-dd-item" href="${P('games-online.html')}">🧩 Онлайн-игры</a>
            <a class="dm-dd-item" href="${P('news.html')}">📰 Новости</a>
            <a class="dm-dd-item" href="${P('app.html')}">📲 Программы и игры</a>
            <a class="dm-dd-item" href="${P('cutlist.html')}">✂️ Раскрой листов</a>
            <div class="dm-dd-divider"></div>
            <a class="dm-dd-item dm-dd-logout" onclick="window.dmEngine.auth.logout()">🚪 Выйти</a>
          </div>
        ` : `
          <div style="display:flex;gap:10px;align-items:center;">
            <a href="${regLink('login.html')}" class="dm-nav-cta">Войти</a>
            <a href="${regLink('register.html')}" class="dm-nav-cta" style="background:rgba(245,200,66,.08);color:#ffe066;border:1px solid rgba(245,200,66,.24);">Регистрация</a>
          </div>
        `}
      </div>
      <div class="dm-nav-burger" onclick="window.dmEngine.toggleMobileNav()" id="dm-burger">
        <span></span><span></span><span></span>
      </div>
    `;

    const mobile = document.createElement('div');
    mobile.id = 'dm-mobile-nav';
    mobile.className = 'dm-mobile-nav';
    mobile.innerHTML = `
      <a class="dm-mob-link ${page === 'shop' ? 'active' : ''}" href="${P('shop.html')}">🛍 Магазин</a>
      <a class="dm-mob-link ${page === 'music' ? 'active' : ''}" href="${P('music.html')}">🎵 Music</a>
      <a class="dm-mob-link ${page === 'services' ? 'active' : ''}" href="${P('services.html')}">💼 Заказ услуг</a>
      <a class="dm-mob-link ${page === 'courses' ? 'active' : ''}" href="${P('courses.html')}">🎓 Курсы</a>
      <a class="dm-mob-link ${page === 'kino' ? 'active' : ''}" href="${P('kino.html')}">🎬 Кино</a>
      <a class="dm-mob-link ${page === 'games-online' ? 'active' : ''}" href="${P('games-online.html')}">🧩 Онлайн-игры</a>
      <a class="dm-mob-link ${page === 'news' ? 'active' : ''}" href="${P('news.html')}">📰 Новости</a>
      <a class="dm-mob-link ${page === 'app' ? 'active' : ''}" href="${P('app.html')}">📲 Программы и игры</a>
      <a class="dm-mob-link" href="${P('index.html')}#about">🏢 ${ui.aboutLabel}</a>
      <a class="dm-mob-link" href="${P('index.html')}#contacts">📞 ${ui.contactsLabel}</a>
      <div class="dm-mob-divider"></div>
      <div style="display:flex;align-items:center;gap:10px;padding:10px 20px;">
        <span style="font-size:12px;color:rgba(255,255,255,.4);">Тема:</span>
        <div class="dm-theme-toggle">
          <button class="dm-theme-toggle-btn ${getTheme()==='dark'?'active':''}" onclick="window.dmEngine.setTheme('dark');window.dmEngine.renderHeader()" title="Тёмная">🌙</button>
          <button class="dm-theme-toggle-btn ${getTheme()==='light'?'active':''}" onclick="window.dmEngine.setTheme('light');window.dmEngine.renderHeader()" title="Светлая">☀️</button>
        </div>
      </div>
      <div class="dm-mob-divider"></div>
      ${user ? `
        <a class="dm-mob-link">👤 ${user.name} ${unread > 0 ? '<span style="background:rgba(245,200,66,.2);color:#ffe066;padding:2px 8px;border-radius:8px;font-size:10px;margin-left:6px;">🔔 ' + unread + '</span>' : ''}</a>
        <a class="dm-mob-link" href="${P('panel.html')}">📊 Моя панель</a>
        <a class="dm-mob-link" href="${P('resume.html')}">📋 Мои анкеты</a>
        <a class="dm-mob-link" href="${P('announcements.html')}">📢 Мои объявления</a>
        ${user.role === 'owner' ? '<a class="dm-mob-link" href="' + P('owner.html') + '">👑 Панель владельца</a>' : ''}
        ${(user.role === 'owner' || user.role === 'admin' || user.role === 'worker') ? '<a class="dm-mob-link" href="' + P('admin.html') + '">⚙️ Админ-панель</a>' : ''}
        ${user.role === 'owner' ? '<a class="dm-mob-link" href="' + P('header-footer.html') + '">🧩 Header / Footer</a>' : ''}
        <a class="dm-mob-link dm-mob-logout" onclick="window.dmEngine.auth.logout()">🚪 Выйти</a>
      ` : `
        <a class="dm-mob-link dm-mob-login" href="${regLink('login.html')}">🔑 Войти</a>
        <a class="dm-mob-link dm-mob-reg" href="${regLink('register.html')}">📝 Регистрация</a>
      `}
    `;

    document.body.prepend(mobile);
    document.body.prepend(nav);
  }

  // ═══ NOTIFICATION PANEL ═══
  function toggleNotifPanel() {
    let panel = document.getElementById('dm-notif-panel');
    if (panel) {
      panel.remove();
      return;
    }

    const notifs = Notify.forCurrentUser().slice(0, 20);
    panel = document.createElement('div');
    panel.id = 'dm-notif-panel';
    panel.className = 'dm-notif-panel';
    panel.innerHTML = `
      <div class="dm-notif-head">
        <span>🔔 Уведомления</span>
        <button onclick="window.dmEngine.notify.markAllRead();window.dmEngine.renderHeader();document.getElementById('dm-notif-panel')&&document.getElementById('dm-notif-panel').remove();" style="background:none;border:none;color:#ffe066;font-size:11px;cursor:pointer;font-weight:700;">Прочитать всё</button>
      </div>
      <div class="dm-notif-list">
        ${notifs.length === 0 ? '<div style="padding:28px;text-align:center;color:rgba(255,255,255,.3);font-size:13px;">Нет уведомлений</div>' : notifs.map(function(n) {
          const ico = n.type === 'welcome' ? '🎉' : n.type === 'promo' ? '📢' : n.type === 'update' ? '🔄' : '📩';
          return '<div class="dm-notif-item' + (n.read ? '' : ' unread') + '" onclick="window.dmEngine.notify.markRead(\'' + n.id + '\');this.classList.remove(\'unread\');">' +
            '<div class="dm-notif-ico">' + ico + '</div>' +
            '<div class="dm-notif-body">' +
              '<div class="dm-notif-title">' + (n.title || 'Уведомление') + '</div>' +
              '<div class="dm-notif-msg">' + n.msg + '</div>' +
              '<div class="dm-notif-date">' + new Date(n.date).toLocaleDateString('ru') + '</div>' +
            '</div>' +
          '</div>';
        }).join('')}
      </div>
    `;
    document.body.appendChild(panel);

    // Close on outside click
    setTimeout(function() {
      document.addEventListener('click', function closeNotif(e) {
        if (!e.target.closest('#dm-notif-panel') && !e.target.closest('.dm-nav-notif-badge')) {
          const p = document.getElementById('dm-notif-panel');
          if (p) p.remove();
          document.removeEventListener('click', closeNotif);
        }
      });
    }, 50);
  }

  // ═══ FOOTER COMPONENT ═══
  function renderFooter() {
    const existing = document.getElementById('dm-footer');
    if (existing) existing.remove();

    const ui = getUiSettings();
    const footer = document.createElement('footer');
    footer.id = 'dm-footer';
    footer.className = 'dm-footer';
    footer.innerHTML = `
      <div class="dm-footer-inner">
        <div class="dm-footer-top">
          <div class="dm-footer-brand">
            <span class="dm-footer-logo">${ui.brandName}</span>
            <p>${ui.tagline}. Магазины, услуги, объявления, работа — всё в одном месте.</p>
            <div class="dm-footer-socials">
              <a class="dm-footer-soc" href="${ui.telegramChannel}" target="_blank" title="Telegram">✈</a>
              <a class="dm-footer-soc" href="${ui.whatsapp}" target="_blank" title="WhatsApp">💬</a>
              <a class="dm-footer-soc" href="${ui.instagram}" target="_blank" title="Instagram">📸</a>
              <a class="dm-footer-soc" href="${ui.youtube}" target="_blank" title="YouTube">▶</a>
            </div>
          </div>
          <div class="dm-footer-col">
            <h5>Навигация</h5>
            <a href="${P('index.html')}">Главная</a>
            <a href="${P('services.html')}">Услуги</a>
            <a href="${P('courses.html')}">Курсы</a>
            <a href="${P('app.html')}">📲 Приложение</a>
            <a href="${P('index.html')}#about">${ui.aboutLabel}</a>
            <a href="${P('index.html')}#contacts">${ui.contactsLabel}</a>
          </div>
          <div class="dm-footer-col">
            <h5>Сервисы</h5>
            <a href="${P('services.html')}">Дизайн-студия</a>
            <a href="${P('services.html')}">Маркетинг</a>
            <a href="${P('services.html')}">3D Печать</a>
            <a href="${P('services.html')}">Видеонаблюдение</a>
            <a href="${P('courses.html')}">Обучающие курсы</a>
          </div>
          <div class="dm-footer-col">
            <h5>Контакты</h5>
            <a href="tel:${ui.phone.replace(/\s/g, '')}">${ui.phone}</a>
            <a href="${ui.whatsapp}" target="_blank">WhatsApp</a>
            <a href="${ui.telegram}" target="_blank">Telegram</a>
            <a href="mailto:${ui.email}">${ui.email}</a>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ui.address)}" target="_blank" rel="noopener" class="dm-footer-addr">${ui.address}</a>
          </div>
        </div>
        <div class="dm-footer-divider"></div>
        <div class="dm-footer-bottom">
          <span class="dm-footer-copy">© ${DM.year} ${ui.brandName} — ${ui.tagline}. ${ui.footerNote}</span>
          <span class="dm-footer-ver">v${DM.version}</span>
        </div>
      </div>
    `;

    const scripts = document.body.querySelectorAll('script');
    if (scripts.length > 0) {
      document.body.insertBefore(footer, scripts[0]);
    } else {
      document.body.appendChild(footer);
    }
  }

  // ═══ TOAST ═══
  function toast(msg, type) {
    let t = document.getElementById('dm-engine-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'dm-engine-toast';
      t.className = 'dm-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'dm-toast ' + (type || '');
    t.classList.add('on');
    clearTimeout(t._x);
    t._x = setTimeout(() => t.classList.remove('on'), 3000);
  }

  // ═══ HELPERS ═══
  function getCurrentPage() {
    const path = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    if (path === 'servises') return 'services';
    if (path === 'Course') return 'courses';
    if (path === 'Films') return 'kino';
    return path;
  }

  function toggleMobileNav() {
    const nav = document.getElementById('dm-mobile-nav');
    const burger = document.getElementById('dm-burger');
    if (nav) nav.classList.toggle('open');
    if (burger) burger.classList.toggle('open');
  }

  function closeMobileNav() {
    const nav = document.getElementById('dm-mobile-nav');
    const burger = document.getElementById('dm-burger');
    if (nav) nav.classList.remove('open');
    if (burger) burger.classList.remove('open');
  }

  function toggleProfileMenu() {
    const dd = document.getElementById('dm-profile-dropdown');
    if (dd) dd.classList.toggle('open');
  }

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    const dd = document.getElementById('dm-profile-dropdown');
    const profile = e.target.closest('.dm-nav-profile');
    if (dd && !profile) dd.classList.remove('open');
  });

  // Show unread notifications popup after login
  function checkNewNotifications() {
    const user = Auth.currentUser();
    if (!user) return;
    const unread = Notify.unreadCount();
    if (unread > 0) {
      setTimeout(function() {
        toast('🔔 У вас ' + unread + ' новых уведомлений', 'info');
      }, 1500);
    }
  }

  function closeAuthModal() {
    const modal = document.getElementById('dm-auth-overlay');
    if (modal) modal.remove();
  }

  function showResetPasswordModal() {
    closeAuthModal();
    const el = document.getElementById('dm-reset-overlay');
    if (el) el.remove();

    const overlay = document.createElement('div');
    overlay.id = 'dm-reset-overlay';
    overlay.className = 'dm-auth-overlay';
    overlay.innerHTML = `
      <div class="dm-auth-modal">
        <div class="dm-auth-head">
          <div class="dm-auth-brand">Восстановление пароля</div>
          <button class="dm-auth-close" type="button" aria-label="Закрыть">✕</button>
        </div>
        <div class="dm-auth-body">
          <div class="dm-auth-title">Забыли пароль?</div>
          <div class="dm-auth-sub">Введите email вашего аккаунта — мы выдадим код восстановления</div>
          <div id="dm-reset-step" style="display:none;"></div>
          <div id="dm-reset-form">
            <div class="dm-auth-field">
              <label>Email</label>
              <input id="dm-reset-email" type="email" placeholder="you@email.com">
            </div>
            <div id="dm-reset-msg" class="dm-auth-alert" role="status" aria-live="polite"></div>
            <button class="dm-auth-submit" id="dm-reset-submit">Получить код →</button>
            <div class="dm-auth-foot">Вспомнили? <a href="#" id="dm-reset-back">Вернуться ко входу</a></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.dm-auth-close').addEventListener('click', function(e) {
      e.stopPropagation();
      overlay.remove();
    });
    document.getElementById('dm-reset-back').addEventListener('click', function(e) {
      e.preventDefault();
      overlay.remove();
      showAuthModal('login');
    });
    document.getElementById('dm-reset-submit').addEventListener('click', function() {
      const email = document.getElementById('dm-reset-email').value;
      if (!email) { dmResetMsg('Введите email', 'error'); return; }
      const result = Auth.resetPasswordRequest(email);
      if (result.ok && result.resetCode) {
        dmResetMsg(result.msg, 'success');
        showResetConfirmStep(overlay, result.userId, result.resetCode);
      } else {
        dmResetMsg(result.msg || 'Ошибка', result.ok ? 'success' : 'error');
      }
    });

    function dmResetMsg(text, type) {
      const el = document.getElementById('dm-reset-msg');
      if (!el) return;
      el.textContent = text;
      el.className = 'dm-auth-alert show ' + (type || 'error');
    }

    function showResetConfirmStep(overlay, userId, resetCode) {
      setTimeout(function() {
        document.getElementById('dm-reset-form').style.display = 'none';
        const step = document.getElementById('dm-reset-step');
        step.innerHTML = `
          <div class="dm-auth-field">
            <label>Код восстановления</label>
            <input id="dm-confirm-code" type="text" value="${resetCode}" readonly>
          </div>
          <div class="dm-auth-field">
            <label>Новый пароль</label>
            <input id="dm-confirm-pass" type="password" placeholder="Минимум 6 символов">
          </div>
          <div class="dm-auth-field">
            <label>Повторите пароль</label>
            <input id="dm-confirm-pass2" type="password" placeholder="Повторите пароль">
          </div>
          <div id="dm-confirm-msg" class="dm-auth-alert" role="status" aria-live="polite"></div>
          <button class="dm-auth-submit" id="dm-confirm-submit">Установить пароль →</button>
        `;
        step.style.display = 'block';
        document.getElementById('dm-confirm-submit').addEventListener('click', function() {
          const code = document.getElementById('dm-confirm-code').value;
          const pass1 = document.getElementById('dm-confirm-pass').value;
          const pass2 = document.getElementById('dm-confirm-pass2').value;
          const msgEl = document.getElementById('dm-confirm-msg');
          function dmConfirmMsg(text, type) {
            if (!msgEl) return;
            msgEl.textContent = text;
            msgEl.className = 'dm-auth-alert show ' + (type || 'error');
          }
          if (!code || !pass1 || !pass2) { dmConfirmMsg('Заполните все поля', 'error'); return; }
          if (pass1 !== pass2) { dmConfirmMsg('Пароли не совпадают', 'error'); return; }
          const result = Auth.resetPasswordConfirm(userId, code, pass1);
          if (result.ok) {
            dmConfirmMsg(result.msg, 'success');
            setTimeout(function() {
              overlay.remove();
              showAuthModal('login');
              toast('✅ Пароль изменён. Теперь войдите в аккаунт', 'success');
            }, 1500);
          } else {
            dmConfirmMsg(result.msg || 'Ошибка', 'error');
          }
        });
      }, 600);
    }
  }

  function handleAuthSuccess() {
    closeAuthModal();
    renderHeader();
    renderFooter();
    checkNewNotifications();
    if (pendingAuthRedirect) {
      const next = pendingAuthRedirect;
      pendingAuthRedirect = '';
      window.location.href = next;
    }
  }

  function renderAuthModalStyles() {
    if (document.getElementById('dm-auth-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'dm-auth-modal-styles';
    style.textContent = '' +
      '.dm-auth-overlay{position:fixed;inset:0;z-index:12000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(5,7,10,.42);backdrop-filter:blur(12px);}' +
      '.dm-auth-modal{width:100%;max-width:520px;border-radius:28px;border:1px solid rgba(245,200,66,.18);background:linear-gradient(180deg,#101217,#0d0f14);box-shadow:0 24px 90px rgba(0,0,0,.42);overflow:hidden;}' +
      '.dm-auth-head{padding:20px 22px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;}' +
      '.dm-auth-brand{font-family:Unbounded,sans-serif;font-size:18px;font-weight:900;color:#fff;}' +
      '.dm-auth-close{width:36px;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:rgba(255,255,255,.72);font-size:16px;cursor:pointer;}' +
      '.dm-auth-tabs{display:flex;gap:8px;padding:18px 22px 0;}' +
      '.dm-auth-tab{flex:1;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(255,255,255,.6);font:800 12px Mulish,sans-serif;cursor:pointer;}' +
      '.dm-auth-tab.on{background:rgba(245,200,66,.12);border-color:rgba(245,200,66,.25);color:#ffe066;}' +
      '.dm-auth-body{padding:22px;}' +
      '.dm-auth-title{font-family:Unbounded,sans-serif;font-size:20px;font-weight:800;color:#fff;margin-bottom:8px;}' +
      '.dm-auth-sub{font-size:13px;line-height:1.7;color:rgba(255,255,255,.58);margin-bottom:18px;}' +
      '.dm-auth-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}' +
      '.dm-auth-field{margin-bottom:12px;}' +
      '.dm-auth-field label{display:block;margin-bottom:6px;font-size:11px;font-weight:800;color:rgba(255,255,255,.42);}' +
      '.dm-auth-field input{width:100%;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);color:#fff;font:600 13px Mulish,sans-serif;outline:none;}' +
      '.dm-auth-field input:focus{border-color:rgba(245,200,66,.28);}' +
      '.dm-auth-submit,.dm-auth-google{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border:none;border-radius:14px;cursor:pointer;font-family:Unbounded,sans-serif;font-size:12px;font-weight:900;}' +
      '.dm-auth-submit{background:linear-gradient(135deg,#f5c842,#ff8a5c);color:#111;margin-top:4px;}' +
      '.dm-auth-google{background:rgba(255,255,255,.04);color:#fff;border:1px solid rgba(255,255,255,.08);margin-top:10px;}' +
      '.dm-auth-foot{margin-top:14px;text-align:center;font-size:12px;color:rgba(255,255,255,.5);}' +
      '.dm-auth-foot a{color:#ffe066;text-decoration:none;font-weight:800;}' +
      '@media(max-width:640px){.dm-auth-grid{grid-template-columns:1fr;}.dm-auth-modal{max-width:100%;}}';
    document.head.appendChild(style);
  }

  function submitAuth(mode) {
    if (mode === 'register') {
      const name = document.getElementById('dm-auth-name').value.trim();
      const surname = document.getElementById('dm-auth-surname').value.trim();
      const email = document.getElementById('dm-auth-email').value.trim();
      const phone = document.getElementById('dm-auth-phone').value.trim();
      const pass = document.getElementById('dm-auth-pass').value;
      const pass2 = document.getElementById('dm-auth-pass2').value;

      if (!name || name.length < 2) { setAuthInlineMsg('⚠️ Укажите имя (минимум 2 символа)', 'error'); return; }
      if (!surname || surname.length < 2) { setAuthInlineMsg('⚠️ Укажите фамилию (минимум 2 символа)', 'error'); return; }
      if (!email || email.indexOf('@') === -1) { setAuthInlineMsg('⚠️ Введите корректный email', 'error'); return; }
      if (!phone || phone.length < 7) { setAuthInlineMsg('⚠️ Введите телефон', 'error'); return; }
      if (!pass || pass.length < 6) { setAuthInlineMsg('⚠️ Пароль минимум 6 символов', 'error'); return; }
      if (pass !== pass2) { setAuthInlineMsg('⚠️ Пароли не совпадают', 'error'); return; }

      const result = Auth.register((name + ' ' + surname).trim(), email, phone, pass);
      if (!result.ok) {
        setAuthInlineMsg('⚠️ ' + result.msg, 'error');
        return;
      }
      setAuthInlineMsg('✅ Аккаунт создан', 'success');
      toast('✅ Аккаунт создан', 'success');
      handleAuthSuccess();
      return;
    }
    const email = document.getElementById('dm-auth-email').value.trim();
    const pass = document.getElementById('dm-auth-pass').value;
    const result = Auth.login(email, pass);
    if (!result.ok) {
      setAuthInlineMsg('⚠️ ' + result.msg, 'error');
      return;
    }
    setAuthInlineMsg('✅ Добро пожаловать!', 'success');
    toast('✅ Добро пожаловать!', 'success');
    handleAuthSuccess();
  }

  function submitGoogleAuth() {
    showGoogleModal(function(googleUser) {
      const result = Auth.googleLogin(googleUser);
      if (!result.ok) {
        setAuthInlineMsg('⚠️ ' + result.msg, 'error');
        return;
      }
      if (!result.user || !result.user.phone) {
        pendingAuthRedirect = P('profile.html') + '?setup=1';
      }
      setAuthInlineMsg('✅ ' + (result.isNew ? 'Аккаунт создан через Google!' : 'Добро пожаловать!'), 'success');
      toast('✅ ' + (result.isNew ? 'Аккаунт создан через Google!' : 'Добро пожаловать!'), 'success');
      handleAuthSuccess();
    });
  }

  function setAuthInlineMsg(text, type) {
    const el = document.getElementById('dm-auth-inline-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'dm-auth-alert show ' + (type || 'error');
  }

  function renderAuthMode(mode) {
    const box = document.getElementById('dm-auth-box');
    if (!box) return;
    const isRegister = mode === 'register';
    box.innerHTML = `
      <div class="dm-auth-title">${isRegister ? 'Создать аккаунт' : 'Войти в аккаунт'}</div>
      <div class="dm-auth-sub">${isRegister ? 'Регистрация откроется поверх страницы, а фон останется на месте с размытием.' : 'Вход открывается поверх текущей страницы без закрытия фона.'}</div>
      ${isRegister ? `
      <div class="dm-auth-grid">
        <div class="dm-auth-field">
          <label>Имя</label>
          <input id="dm-auth-name" type="text" placeholder="Ваше имя">
        </div>
        <div class="dm-auth-field">
          <label>Фамилия</label>
          <input id="dm-auth-surname" type="text" placeholder="Ваша фамилия">
        </div>
      </div>
      <div class="dm-auth-grid">
        <div class="dm-auth-field">
          <label>Email</label>
          <input id="dm-auth-email" type="email" placeholder="you@email.com">
        </div>
        <div class="dm-auth-field">
          <label>Телефон</label>
          <input id="dm-auth-phone" type="tel" placeholder="+992 92 961-21-11">
        </div>
      </div>
      ` : `
      <div class="dm-auth-field">
        <label>Email</label>
        <input id="dm-auth-email" type="email" placeholder="you@email.com">
      </div>
      `}
      <div class="dm-auth-field">
        <label>Пароль</label>
        <input id="dm-auth-pass" type="password" placeholder="Минимум 6 символов">
      </div>
      ${isRegister ? `
      <div class="dm-auth-field">
        <label>Повторный пароль</label>
        <input id="dm-auth-pass2" type="password" placeholder="Повторите пароль">
      </div>
      ` : ''}
      <div id="dm-auth-inline-msg" class="dm-auth-alert" role="status" aria-live="polite"></div>
      <button class="dm-auth-submit" id="dm-auth-submit">${isRegister ? 'Зарегистрироваться' : 'Войти'} →</button>
      <button class="dm-auth-google" id="dm-auth-google">Google</button>
      <div class="dm-auth-foot">${isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'} <a href="#" id="dm-auth-switch">${isRegister ? 'Войти' : 'Зарегистрироваться'}</a>${!isRegister ? ' · <a href="#" id="dm-auth-reset">Забыли пароль?</a>' : ''}</div>
    `;
    document.getElementById('dm-auth-submit').addEventListener('click', function() { submitAuth(mode); });
    document.getElementById('dm-auth-google').addEventListener('click', function() { submitGoogleAuth(); });
    document.getElementById('dm-auth-switch').addEventListener('click', function(e) {
      e.preventDefault();
      showAuthModal(isRegister ? 'login' : 'register');
    });
    if (!isRegister && document.getElementById('dm-auth-reset')) {
      document.getElementById('dm-auth-reset').addEventListener('click', function(e) {
        e.preventDefault();
        showResetPasswordModal();
      });
    }
    box.querySelectorAll('input').forEach(function(input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') submitAuth(mode);
      });
    });
    const firstInput = box.querySelector('input');
    if (firstInput) firstInput.focus();
    document.querySelectorAll('.dm-auth-tab').forEach(function(tab) {
      tab.classList.toggle('on', tab.dataset.mode === mode);
    });
  }

  function showAuthModal(mode) {
    renderAuthModalStyles();
    // If modal already open — just switch mode, do NOT recreate
    const existing = document.getElementById('dm-auth-overlay');
    if (existing) {
      renderAuthMode(mode || 'login');
      return;
    }
    const ui = getUiSettings();
    const overlay = document.createElement('div');
    overlay.id = 'dm-auth-overlay';
    overlay.className = 'dm-auth-overlay';
    overlay.innerHTML = `
      <div class="dm-auth-modal">
        <div class="dm-auth-head">
          <div class="dm-auth-brand">${ui.brandName}</div>
          <button class="dm-auth-close" type="button" aria-label="Закрыть">✕</button>
        </div>
        <div class="dm-auth-tabs">
          <button class="dm-auth-tab" type="button" data-mode="login">Вход</button>
          <button class="dm-auth-tab" type="button" data-mode="register">Регистрация</button>
        </div>
        <div class="dm-auth-body" id="dm-auth-box"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    // Close on X button — stop event so guardLinks doesn't intercept
    overlay.querySelector('.dm-auth-close').addEventListener('click', function(e) {
      e.stopPropagation();
      closeAuthModal();
    });
    // Tabs — switching mode inside the SAME overlay (no recreate)
    overlay.querySelectorAll('.dm-auth-tab').forEach(function(tab) {
      tab.addEventListener('click', function(e) {
        e.stopPropagation();
        renderAuthMode(tab.dataset.mode);
      });
    });
    // Close on Escape key
    function onEsc(e) {
      if (e.key === 'Escape') { closeAuthModal(); document.removeEventListener('keydown', onEsc); }
    }
    document.addEventListener('keydown', onEsc);
    renderAuthMode(mode || 'login');
  }

  // ═══ GOOGLE SIGN-IN MODAL ═══
  function showGoogleModal(callback) {
    // Remove if already open
    const old = document.getElementById('dm-google-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'dm-google-modal';
    modal.className = 'dm-gmodal-overlay';
    modal.innerHTML = `
      <div class="dm-gmodal">
        <button class="dm-gmodal-close" onclick="document.getElementById('dm-google-modal').remove()">&times;</button>
        <div class="dm-gmodal-header">
          <svg class="dm-gmodal-logo" viewBox="0 0 48 48" width="40" height="40">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <div class="dm-gmodal-title">Войти через Google</div>
          <div class="dm-gmodal-sub">Введите данные вашего Google-аккаунта</div>
        </div>
        <div class="dm-gmodal-body">
          <div class="dm-gmodal-field">
            <label>Имя и фамилия</label>
            <input type="text" id="gm-name" placeholder="Ваше имя" autocomplete="name">
          </div>
          <div class="dm-gmodal-field">
            <label>Email (Gmail)</label>
            <input type="email" id="gm-email" placeholder="you@gmail.com" autocomplete="email">
          </div>
          <button class="dm-gmodal-submit" id="gm-submit">
            <svg viewBox="0 0 48 48" width="18" height="18"><path fill="#fff" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#fff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#fff" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/><path fill="#fff" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Продолжить с Google
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });

    // Submit handler
    document.getElementById('gm-submit').addEventListener('click', function() {
      const name = document.getElementById('gm-name').value.trim();
      const email = document.getElementById('gm-email').value.trim();
      if (!name) { toast('⚠️ Введите имя', 'error'); return; }
      if (!email || !email.includes('@')) { toast('⚠️ Введите корректный email', 'error'); return; }
      modal.remove();
      callback({ name: name, email: email, picture: '' });
    });

    // Enter key
    modal.querySelectorAll('input').forEach(function(inp) {
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('gm-submit').click();
      });
    });

    // Auto-focus
    setTimeout(function() { document.getElementById('gm-name').focus(); }, 100);
  }

  function injectGlobalVisualEnhancements() {
    if (document.getElementById('dm-global-ux')) return;
    var style = document.createElement('style');
    style.id = 'dm-global-ux';
    style.textContent = '' +
      '[data-theme="light"] body{' +
        'background:linear-gradient(180deg,#f7f9ff 0%,#eef3ff 45%,#f8fbff 100%)!important;' +
        'color:#0f172a!important;' +
      '}' +
      '[data-theme="light"] body::before{' +
        'opacity:.2!important;' +
        'background:' +
          'radial-gradient(ellipse at 10% 0%, rgba(255,107,43,.18) 0%, transparent 42%),' +
          'radial-gradient(ellipse at 90% 6%, rgba(43,156,255,.18) 0%, transparent 40%),' +
          'repeating-linear-gradient(60deg, rgba(15,23,42,.025) 0, rgba(15,23,42,.025) 1px, transparent 1px, transparent 18px)!important;' +
      '}' +
      '[data-theme="light"] .dm-nav{' +
        'background:rgba(255,255,255,.86)!important;' +
        'border-bottom-color:rgba(15,23,42,.12)!important;' +
        'box-shadow:0 10px 28px rgba(15,23,42,.08)!important;' +
      '}' +
      '[data-theme="light"] .dm-mobile-nav{' +
        'background:rgba(255,255,255,.93)!important;' +
        'box-shadow:0 20px 50px rgba(15,23,42,.14)!important;' +
      '}' +
      '[data-theme="light"] .dm-nav-link, [data-theme="light"] .dm-mob-link{' +
        'color:rgba(15,23,42,.72)!important;' +
      '}' +
      '[data-theme="light"] .dm-nav-link:hover, [data-theme="light"] .dm-mob-link:hover{' +
        'background:rgba(43,156,255,.1)!important;' +
        'color:#0b1220!important;' +
      '}' +
      '[data-theme="light"] [class*="-card"], [data-theme="light"] .dm-profile-card, [data-theme="light"] .svc, [data-theme="light"] .stat, [data-theme="light"] .map-card{' +
        'background:rgba(255,255,255,.9)!important;' +
        'border-color:rgba(15,23,42,.1)!important;' +
        'box-shadow:0 12px 28px rgba(15,23,42,.08)!important;' +
      '}' +
      '[data-theme="light"] h1, [data-theme="light"] h2, [data-theme="light"] h3{' +
        'color:#0f172a!important;' +
      '}' +
      '[data-theme="light"] p, [data-theme="light"] .dm-sub, [data-theme="light"] .dm-card-desc{' +
        'color:rgba(15,23,42,.7)!important;' +
      '}' +
      '[data-dm-reveal]{' +
        'opacity:0;' +
        'transform:translateY(18px) scale(.985);' +
        'transition:opacity .55s ease, transform .55s cubic-bezier(.22,.61,.36,1);' +
        'will-change:opacity,transform;' +
      '}' +
      '[data-dm-reveal].dm-in{' +
        'opacity:1;' +
        'transform:none;' +
      '}' +
      '.dm-anim-hover{' +
        'transition:transform .24s ease, box-shadow .24s ease, border-color .24s ease;' +
      '}' +
      '.dm-anim-hover:hover{' +
        'transform:translateY(-4px);' +
        'box-shadow:0 16px 35px rgba(0,0,0,.2);' +
      '}' +
      '@media (prefers-reduced-motion: reduce){' +
        '[data-dm-reveal], .dm-anim-hover{transition:none!important; transform:none!important;}' +
      '}';
    document.head.appendChild(style);
  }

  function initGlobalAnimations() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var reveal = document.querySelectorAll('main section, .dm-profile-card, .dm-auth-card, [class*="-card"], article, .svc, .btn, .dm-btn-primary');
    for (var i = 0; i < reveal.length; i++) {
      if (i > 180) break;
      reveal[i].setAttribute('data-dm-reveal', '');
      reveal[i].style.transitionDelay = (i % 8) * 0.04 + 's';
    }

    var hover = document.querySelectorAll('[class*="-card"], .svc, .btn, .dm-btn-primary, .taxi-btn, .srv-card');
    for (var j = 0; j < hover.length; j++) {
      hover[j].classList.add('dm-anim-hover');
    }

    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('dm-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('[data-dm-reveal]').forEach(function(el) { io.observe(el); });
  }

  // ═══ INIT ═══
  function init() {
    ensureDefaultOwner();
    if (guardPage()) return; // redirect if not authorized
    injectGlobalVisualEnhancements();
    renderHeader();
    renderFooter();
    document.body.style.paddingTop = '62px';
    guardLinks(); // block protected links for guests
    checkNewNotifications();
    initGlobalAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══ PUBLIC API ═══
  window.dmEngine = {
    config: DM,
    auth: Auth,
    notify: Notify,
    toast: toast,
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    toggleMobileNav: toggleMobileNav,
    closeMobileNav: closeMobileNav,
    toggleProfileMenu: toggleProfileMenu,
    toggleNotifPanel: toggleNotifPanel,
    showGoogleModal: showGoogleModal,
    googleOneClickLogin: googleOneClickLogin,
    showAuthModal: showAuthModal,
    closeAuthModal: closeAuthModal,
    getUiSettings: getUiSettings,
    saveUiSettings: saveUiSettings,
    isProfileComplete: isProfileComplete,
    requireProfileCompletion: requireProfileCompletion,
    getTheme: getTheme,
    setTheme: setTheme,
    P: P,
    regLink: regLink
  };

})();

