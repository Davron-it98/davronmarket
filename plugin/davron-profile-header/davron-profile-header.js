// DavronMarket Profile Header Plugin
// Показывает шапку профиля на всех страницах
(function(){
  if(document.getElementById('dm-profile-header')) return;
  function getUser() {
    return window.dmEngine?.auth?.currentUser ? window.dmEngine.auth.currentUser() : null;
  }
  function renderHeader() {
    const user = getUser();
    const header = document.createElement('div');
    header.id = 'dm-profile-header';
    header.className = 'dm-profile-header';
    header.innerHTML = `
      <div class="dm-profile-header-inner">
        <a href="/My-account/panel.html" class="dm-profile-avatar">
          <img src="${user?.avatar || '/assets/img/default-avatar.png'}" alt="Профиль" onerror="this.src='/assets/img/default-avatar.png'">
        </a>
        <div class="dm-profile-info">
          <div class="dm-profile-name">${user ? (user.name || user.email || 'Пользователь') : 'Гость'}</div>
          <div class="dm-profile-role">${user ? (user.role || 'Пользователь') : 'Войти в аккаунт'}</div>
        </div>
        <a href="/My-account/panel.html" class="dm-profile-link">Профиль</a>
      </div>
    `;
    document.body.insertBefore(header, document.body.firstChild);
  }
  function injectStyles() {
    if(document.getElementById('dm-profile-header-style')) return;
    const style = document.createElement('style');
    style.id = 'dm-profile-header-style';
    style.textContent = `
      .dm-profile-header { width: 100%; background: #fff; box-shadow: 0 2px 16px rgba(0,0,0,0.06); padding: 0; position: sticky; top: 0; z-index: 10010; }
      .dm-profile-header-inner { display: flex; align-items: center; gap: 14px; padding: 12px 18px; }
      .dm-profile-avatar img { width: 44px; height: 44px; border-radius: 50%; border: 2px solid #ff7a00; background: #f5f5f5; object-fit: cover; }
      .dm-profile-info { flex: 1; }
      .dm-profile-name { font-size: 17px; font-weight: 700; color: #222; }
      .dm-profile-role { font-size: 13px; color: #888; }
      .dm-profile-link { background: linear-gradient(135deg, #ff9a00, #ff5e00); color: #fff; padding: 8px 18px; border-radius: 10px; font-size: 14px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
      .dm-profile-link:hover { background: linear-gradient(135deg, #ff7a00, #ff3b00); }
      @media (max-width: 600px) { .dm-profile-header-inner { flex-direction: column; align-items: flex-start; gap: 8px; padding: 10px 8px; } .dm-profile-link { width: 100%; text-align: center; } }
    `;
    document.head.appendChild(style);
  }
  injectStyles();
  renderHeader();
})();
