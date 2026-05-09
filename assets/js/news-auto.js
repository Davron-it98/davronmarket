(function () {
  'use strict';

  var INDEX_URL = window.DM_NEWS_INDEX_URL || 'assets/data/news.index.json';

  var CAT_META = {
    platform: { label: 'Платформа', color: '#60a5fa', emoji: '🚀' },
    shop: { label: 'Магазин', color: '#f59e0b', emoji: '🛍️' },
    services: { label: 'Услуги', color: '#4ade80', emoji: '💼' },
    promo: { label: 'Акции', color: '#fb7185', emoji: '🎁' },
    courses: { label: 'Курсы', color: '#a78bfa', emoji: '🎓' },
    transport: { label: 'Транспорт', color: '#38bdf8', emoji: '🚕' },
    media: { label: 'Медиа', color: '#fb923c', emoji: '🎬' },
    community: { label: 'Сообщество', color: '#22d3ee', emoji: '👥' },
    other: { label: 'Новости', color: '#9ca3af', emoji: '📰' }
  };

  function esc(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function getCatMeta(cat) {
    return CAT_META[cat] || CAT_META.other;
  }

  function fmtDate(isoDate) {
    if (!isoDate) return 'Сегодня';
    var d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'Сегодня';
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function ensureUrl(url) {
    if (!url) return '/news.html';
    return url;
  }

  function normalizeItems(raw) {
    var list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.items) ? raw.items : []);
    return list
      .filter(function (item) { return item && item.title && item.url; })
      .sort(function (a, b) {
        var da = new Date(a.updatedAt || a.createdAt || 0).getTime();
        var db = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return db - da;
      });
  }

  function renderHome(items) {
    var grid = document.getElementById('home-news-grid');
    if (!grid) return;

    if (!items.length) {
      grid.innerHTML = '' +
        '<article class="nw-card"><div class="nw-card-body">' +
        '<h3 class="nw-card-title">Новости пока не добавлены</h3>' +
        '<p class="nw-card-desc">Добавьте новую HTML-страницу и обновите news.index.json генератором.</p>' +
        '<div class="nw-card-footer"><a class="nw-card-btn" href="/news.html">Открыть новости</a></div>' +
        '</div></article>';
      return;
    }

    var top = items.slice(0, 4);
    grid.innerHTML = top.map(function (item) {
      var meta = getCatMeta(item.category);
      return '' +
        '<article class="nw-card">' +
        '  <div class="nw-card-body">' +
        '    <h3 class="nw-card-title">' + esc(meta.emoji + ' ' + item.title) + '</h3>' +
        '    <p class="nw-card-desc">' + esc(item.description || ('Обновлена страница: ' + item.title)) + '</p>' +
        '    <div class="nw-card-footer">' +
        '      <a class="nw-card-btn" href="' + esc(ensureUrl(item.url)) + '">Открыть</a>' +
        '    </div>' +
        '  </div>' +
        '</article>';
    }).join('');
  }

  function renderFeatured(item) {
    var root = document.getElementById('news-featured-auto');
    if (!root || !item) return;

    var meta = getCatMeta(item.category);
    root.innerHTML = '' +
      '<div class="feat-emoji">' + esc(meta.emoji) + '</div>' +
      '<div class="feat-body">' +
      '  <div class="feat-cat">' + esc(meta.label) + '</div>' +
      '  <div class="feat-title">' + esc(item.title) + '</div>' +
      '  <div class="feat-text">' + esc(item.description || ('Добавлена новая страница: ' + item.title)) + '</div>' +
      '  <div class="feat-meta">' +
      '    <span>📅 ' + esc(fmtDate(item.updatedAt || item.createdAt)) + '</span>' +
      '    <span>✍️ DavronMarket</span>' +
      '    <span>📰 Главная новость</span>' +
      '  </div>' +
      '  <div style="margin-top:12px;"><a class="btn-blue-sm" href="' + esc(ensureUrl(item.url)) + '">Открыть страницу</a></div>' +
      '</div>';
  }

  function renderNewsList(items) {
    var list = document.getElementById('newsList');
    if (!list) return;

    if (!items.length) {
      list.innerHTML = '<div class="news-item"><div class="ni-body"><div class="ni-title">Новостей пока нет</div><div class="ni-text">Добавьте новую страницу и обновите индекс.</div></div></div>';
      return;
    }

    list.innerHTML = items.map(function (item) {
      var meta = getCatMeta(item.category);
      return '' +
        '<div class="news-item">' +
        '  <div class="ni-emoji">' + esc(meta.emoji) + '</div>' +
        '  <div class="ni-body">' +
        '    <div class="ni-cat" style="color:' + esc(meta.color) + ';">' + esc(meta.label) + '</div>' +
        '    <div class="ni-title">' + esc(item.title) + '</div>' +
        '    <div class="ni-text">' + esc(item.description || ('Добавлена новая страница: ' + item.title)) + '</div>' +
        '    <div class="ni-meta">📅 ' + esc(fmtDate(item.updatedAt || item.createdAt)) + ' · ' + esc(meta.emoji + ' ' + meta.label) + '</div>' +
        '    <div style="margin-top:10px;"><a class="btn-blue-sm" href="' + esc(ensureUrl(item.url)) + '">Открыть</a></div>' +
        '  </div>' +
        '</div>';
    }).join('');
  }

  function bindFilters(allItems) {
    var buttons = document.querySelectorAll('.news-filter[data-cat]');
    if (!buttons.length) return;

    function apply(cat) {
      var filtered = cat === 'all' ? allItems : allItems.filter(function (item) { return item.category === cat; });
      renderNewsList(filtered);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        apply(btn.getAttribute('data-cat') || 'all');
      });
    });
  }

  function loadNews() {
    fetch(INDEX_URL, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('bad-status');
        return response.json();
      })
      .then(function (raw) {
        var items = normalizeItems(raw);
        renderHome(items);

        if (document.getElementById('newsList')) {
          renderFeatured(items[0]);
          renderNewsList(items.slice(1));
          bindFilters(items);
        }
      })
      .catch(function () {
        renderHome([]);
        renderNewsList([]);
      });
  }

  window.dmNewsAuto = { load: loadNews };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNews);
  } else {
    loadNews();
  }
}());
