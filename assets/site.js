/* Поведение макета: окно «Написать», каталог в боковой колонке, витрина, вид и сортировка раздела, галерея. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var ask = $('#ask');
  $$('[data-open-form]').forEach(function (b) {
    b.addEventListener('click', function () {
      var subject = b.getAttribute('data-subject') || '';
      var title = b.getAttribute('data-title') || 'Написать нам';
      $('#ask-title').textContent = title;
      $('#ask-subject').value = subject;
      var line = $('#ask-about');
      line.textContent = subject;
      line.hidden = !subject || subject === title;
      $('#ask-form').hidden = false;
      $('#ask-done').hidden = true;
      if (ask.showModal) { ask.showModal(); } else { ask.setAttribute('open', ''); }
    });
  });
  $$('[data-close-form]').forEach(function (b) { b.addEventListener('click', function () { ask.close(); }); });
  if (ask) {
    ask.addEventListener('click', function (e) { if (e.target === ask) { ask.close(); } });
    $('#ask-form').addEventListener('submit', function (e) {
      e.preventDefault();
      e.target.hidden = true;
      $('#ask-done').hidden = false;
    });
  }

  var search = $('form[role="search"]');
  if (search) {
    search.addEventListener('submit', function (e) {
      e.preventDefault();
      location.href = 'poisk.html';
    });
  }

  $$('form[data-mock]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = $('[data-mock-note]', f);
      if (note) { note.hidden = false; }
    });
  });

  $$('[data-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var target = document.getElementById(b.getAttribute('data-toggle'));
      var open = target.hidden;
      target.hidden = !open;
      b.setAttribute('aria-expanded', String(open));
      $$('[data-when]', b).forEach(function (i) { i.hidden = i.getAttribute('data-when') !== (open ? 'open' : 'closed'); });
    });
  });

  var menu = $('#catalog-menu');
  var menuBtn = $('[data-toggle="catalog-menu"]');
  var closeMenu = function () { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); };
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target) && !menuBtn.contains(e.target)) { closeMenu(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuBtn.focus(); }
  });

  var strip = $('#showcase');
  if (strip) {
    var step = function (dir) {
      var card = strip.firstElementChild;
      strip.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: 'smooth' });
    };
    $('#showcase-prev').addEventListener('click', function () { step(-1); });
    $('#showcase-next').addEventListener('click', function () { step(1); });
  }

  var list = $('#products');
  if (list) {
    var cards = $$('.product-card', list);
    var perPage = 16;
    var page = 1;
    var render = function () {
      cards.forEach(function (c, i) { c.hidden = i < (page - 1) * perPage || i >= page * perPage; });
      var pager = $('#pager');
      if (!pager) { return; }
      var pages = Math.ceil(cards.length / perPage);
      pager.innerHTML = '';
      pager.hidden = pages < 2;
      for (var n = 1; n <= pages; n++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = n;
        b.className = 'btn ' + (n === page ? 'btn-primary' : 'btn-outline');
        b.setAttribute('aria-label', 'Страница ' + n);
        (function (value) { b.addEventListener('click', function () { page = value; render(); list.scrollIntoView(); }); })(n);
        pager.appendChild(b);
      }
    };
    var setView = function (view) {
      list.setAttribute('data-view', view);
      $$('[data-view-btn]').forEach(function (b) {
        var on = b.getAttribute('data-view-btn') === view;
        b.setAttribute('aria-pressed', String(on));
        b.className = 'btn ' + (on ? 'btn-primary' : 'btn-outline');
      });
      try { localStorage.setItem('bs-view', view); } catch (e) { /* хранилище недоступно */ }
    };
    $$('[data-view-btn]').forEach(function (b) {
      b.addEventListener('click', function () { setView(b.getAttribute('data-view-btn')); });
    });
    var saved = null;
    try { saved = localStorage.getItem('bs-view'); } catch (e) { /* хранилище недоступно */ }
    if (saved === 'list') { setView('list'); }
    var sort = $('#sort');
    if (sort) {
      sort.addEventListener('change', function () {
        var key = sort.value;
        cards.sort(function (a, b) { return Number(a.getAttribute('data-' + key)) - Number(b.getAttribute('data-' + key)); });
        cards.forEach(function (c) { list.appendChild(c); });
        page = 1;
        render();
      });
    }
    var per = $('#per-page');
    if (per) {
      per.addEventListener('change', function () { perPage = Number(per.value); page = 1; render(); });
    }
    render();
  }

  var main = $('#gallery-main');
  if (main) {
    $$('[data-gallery]').forEach(function (b) {
      b.addEventListener('click', function () {
        main.src = b.getAttribute('data-gallery');
        $$('[data-gallery]').forEach(function (o) { o.setAttribute('aria-current', String(o === b)); });
      });
    });
  }
})();
