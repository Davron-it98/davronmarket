(function () {
  'use strict';

  var INDEX_URL = '../Services/services.index.json';
  var TARGET_ID = 'grid-auto';

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function titleFromSlug(slug) {
    return (slug || '')
      .replace(/\.html$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function pickColor(i) {
    var arr = ['c-blue', 'c-gold', 'c-orange', 'c-green', 'c-purple'];
    return arr[i % arr.length];
  }

  function renderCard(item, idx) {
    var url = item.url || ('../Services/' + (item.file || ''));
    var slug = item.slug || item.file || '';
    var name = item.title || titleFromSlug(slug);
    var desc = item.description || 'Откройте страницу услуги для подробной информации и контактов.';
    var tag = item.tag || 'Услуга';
    var img = item.image || '';
    var color = item.color || pickColor(idx);

    var photo = img
      ? '<img class="srv-card-photo" src="' + esc(img) + '" alt="' + esc(name) + '" loading="lazy" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div class=\\\'srv-card-photo-placeholder\\\'>🧩</div>\'">'
      : '<div class="srv-card-photo-placeholder">🧩</div>';

    return '' +
      '<div class="srv-card ' + color + '" data-s="' + esc(name) + '">' +
      '  <div class="srv-card-photo-wrap">' + photo + '</div>' +
      '  <div class="srv-card-body">' +
      '    <span class="srv-card-tag">' + esc(tag) + '</span>' +
      '    <div class="srv-card-name">' + esc(name) + '</div>' +
      '    <div class="srv-card-desc">' + esc(desc) + '</div>' +
      '    <div class="srv-card-foot">' +
      '      <a class="srv-card-btn" href="' + esc(url) + '">Подробнее →</a>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  function renderList(items) {
    var grid = document.getElementById(TARGET_ID);
    if (!grid) return;

    if (!items || !items.length) {
      grid.innerHTML = '<div class="srv-no-results" style="display:block;padding:20px;">Пока нет услуг в папке Services</div>';
      return;
    }

    grid.innerHTML = items.map(renderCard).join('');
  }

  function loadAutoServices() {
    fetch(INDEX_URL, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('bad-status');
        return r.json();
      })
      .then(function (data) {
        var items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
        renderList(items);
      })
      .catch(function () {
        var grid = document.getElementById(TARGET_ID);
        if (grid) {
          grid.innerHTML = '<div class="srv-no-results" style="display:block;padding:20px;">Не удалось загрузить авто-список услуг. Запустите генератор индекса.</div>';
        }
      });
  }

  window.loadAutoServices = loadAutoServices;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAutoServices);
  } else {
    loadAutoServices();
  }
}());
