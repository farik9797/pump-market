/* BrookStone Group: поведение макета. Формы, шапка, меню, поиск, слайдер, окно каталога, фильтры, галерея, появление блоков. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var BS = window.BS || { g: {}, p: {} };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var esc = function (s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim(); };
  var plural = function (n, a, b, c) { var n10 = n % 10, n100 = n % 100; return n + ' ' + (n10 === 1 && n100 !== 11 ? a : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? b : c); };
  var goods = function (n) { return plural(n, 'товар', 'товара', 'товаров'); };
  var ICON_ARROW = '<svg class="w-4 h-4 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

  /* ---------- Диалоги и формы (ТЗ, раздел 8) ---------- */
  var openDialog = function (d) { if (d.showModal) { d.showModal(); } else { d.setAttribute('open', ''); } };
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d) { d.close(); } });
    $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { d.close(); }); });
  });
  var resetForm = function (f) {
    if (!f) { return; }
    f.hidden = false;
    f.classList.remove('is-busy', 'was-checked');
    var done = f.nextElementSibling;
    if (done && done.classList.contains('form-done')) { done.hidden = true; }
    $$('[aria-invalid]', f).forEach(function (i) { i.removeAttribute('aria-invalid'); });
    $$('.field-error', f).forEach(function (p) { p.hidden = true; p.textContent = ''; });
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]');
    if (!b) { return; }
    var d = document.getElementById('dlg-' + b.getAttribute('data-open'));
    if (!d) { return; }
    var f = $('form', d);
    resetForm(f);
    var pf = $('[data-product-field]', d);
    if (pf) { pf.value = b.getAttribute('data-product') || ''; }
    f.setAttribute('data-product-url', b.getAttribute('data-product-url') || '');
    f.setAttribute('data-source', (b.textContent || '').replace(/\s+/g, ' ').trim());
    var drawer = $('#drawer');
    if (drawer && drawer.open) { drawer.close(); }
    openDialog(d);
  });

  var PHONE_HINT = 'Введите номер полностью, например +7 777 000 00 00';
  var check = function (el) {
    var v = (el.value || '').trim();
    if (el.type === 'checkbox') { return el.required && !el.checked ? 'Нужно согласие на обработку данных' : ''; }
    if (el.required && !v) { return el.tagName === 'SELECT' ? 'Выберите вариант' : 'Заполните поле'; }
    if (v && el.getAttribute('data-validate') === 'phone') {
      var d = v.replace(/\D/g, '');
      if (!(d.length === 11 && (d[0] === '7' || d[0] === '8')) && d.length !== 10) { return PHONE_HINT; }
    }
    if (v && el.getAttribute('data-validate') === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { return 'Проверьте email, например name@company.kz'; }
    return '';
  };
  var mark = function (el, msg) {
    var p = document.getElementById(el.id + '-err');
    if (msg) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', el.id + '-err'); } else { el.removeAttribute('aria-invalid'); }
    if (p) { p.textContent = msg; p.hidden = !msg; }
  };
  $$('form.bs-form').forEach(function (f) {
    var fields = $$('input:not([type=hidden]):not([name=website]), textarea, select', f);
    fields.forEach(function (el) {
      if (el.getAttribute('data-validate') === 'phone') {
        // при выходе из поля приводим номер к виду +7 777 123 45 67 (10 цифр без кода тоже принимаем)
        el.addEventListener('blur', function () {
          var d = el.value.replace(/\D/g, '');
          if (d.length === 10) { d = '7' + d; }
          if (d.length === 11 && (d[0] === '7' || d[0] === '8')) {
            el.value = '+7 ' + d.slice(1, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7, 9) + ' ' + d.slice(9, 11);
            if (f.classList.contains('was-checked')) { mark(el, check(el)); }
          }
        });
      }
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () {
        if (f.classList.contains('was-checked')) { mark(el, check(el)); }
      });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      f.classList.add('was-checked');
      var first = null;
      fields.forEach(function (el) { var m = check(el); mark(el, m); if (m && !first) { first = el; } });
      if (first) { first.focus(); return; }
      f.elements.page.value = location.href;
      f.elements.product_url.value = f.getAttribute('data-product-url') || ($('[data-product-field]', f) ? location.href : '');
      var done = f.nextElementSibling;
      if (f.elements.website.value) { f.hidden = true; if (done) { done.hidden = false; } return; }   // бот: делаем вид, что отправили
      f.classList.add('is-busy');
      $('button[type=submit]', f).disabled = true;
      setTimeout(function () {
        f.classList.remove('is-busy');
        $('button[type=submit]', f).disabled = false;
        f.hidden = true;
        if (done) { done.hidden = false; done.setAttribute('tabindex', '-1'); done.focus(); }
      }, 900);
    });
  });

  /* ---------- Шапка: компактная при прокрутке, мегаменю, выпадающее меню, мобильное меню ---------- */
  var bar = $('[data-header]');
  if (bar) {
    var onScroll = function () { bar.classList.toggle('is-compact', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  var popups = [];
  var setupPopup = function (btn, panel, hover) {
    var t;
    var open = function () { popups.forEach(function (p) { if (p.panel !== panel) { p.close(); } }); panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
    var close = function () { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function () { if (panel.hidden) { open(); } else { close(); } });
    if (hover && finePointer) {
      [btn, panel].forEach(function (el) {
        el.addEventListener('mouseenter', function () { clearTimeout(t); t = setTimeout(open, 120); });
        el.addEventListener('mouseleave', function () { clearTimeout(t); t = setTimeout(close, 220); });
      });
    }
    popups.push({ btn: btn, panel: panel, close: close });
  };
  var megaBtn = $('[data-mega]');
  if (megaBtn) { setupPopup(megaBtn, $('#mega'), true); }
  $$('[data-dropdown]').forEach(function (w) { setupPopup($('button', w), $('.dropdown', w), true); });
  document.addEventListener('click', function (e) {
    popups.forEach(function (p) { if (!p.panel.hidden && !p.panel.contains(e.target) && !p.btn.contains(e.target)) { p.close(); } });
    $$('details.fdrop[open]').forEach(function (d) { if (!d.contains(e.target)) { d.open = false; } });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') { return; }
    popups.forEach(function (p) { if (!p.panel.hidden) { p.close(); p.btn.focus(); } });
    $$('details.fdrop[open]').forEach(function (d) { d.open = false; });
    hideFly();
  });
  var drawer = $('#drawer');
  $$('[data-drawer-open]').forEach(function (b) {
    b.addEventListener('click', function () { openDialog(drawer); b.setAttribute('aria-expanded', 'true'); });
  });
  if (drawer) { drawer.addEventListener('close', function () { $$('[data-drawer-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }); }
  $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', function () { openDialog(drawer); setTimeout(function () { $('#q2').focus(); }, 50); }); });

  /* ---------- Поиск: подсказки без перезагрузки и страница результатов ---------- */
  var search = function (q) {
    var words = norm(q).split(' ').filter(Boolean);
    if (!words.length) { return { g: [], p: [] }; }
    var gs = Object.keys(BS.g).filter(function (id) { var t = norm(BS.g[id][0]); return words.every(function (w) { return t.indexOf(w) >= 0; }); });
    var ps = Object.keys(BS.p).filter(function (id) { var s = BS.p[id][6]; return words.every(function (w) { return s.indexOf(w) >= 0; }); });
    var score = function (id) { var t = norm(BS.p[id][0]); return (t.indexOf(words[0]) === 0 ? 2 : 0) + (words.every(function (w) { return t.indexOf(w) >= 0; }) ? 1 : 0); };
    ps.sort(function (a, b) { return score(b) - score(a); });
    gs.sort(function (a, b) { return BS.g[b][3] - BS.g[a][3]; });
    return { g: gs, p: ps };
  };
  $$('form[data-search]').forEach(function (f) {
    var input = $('input[type=search]', f);
    var box = $('.suggest', f);
    var sel = -1, t;
    var items = function () { return $$('.sg-item', box); };
    var hide = function () { box.hidden = true; sel = -1; input.setAttribute('aria-expanded', 'false'); };
    var render = function () {
      var q = input.value.trim();
      if (q.length < 2) { hide(); return; }
      var r = search(q);
      var html = '';
      if (r.g.length) {
        html += '<p class="sg-label">Разделы</p>' + r.g.slice(0, 3).map(function (id) { var g = BS.g[id]; return '<a class="sg-item" role="option" href="' + g[1] + '"><span class="sub-thumb" style="--s:32px">' + (g[4] ? '<img src="' + g[4] + '" alt="">' : '') + '</span><span>' + esc(g[0]) + '<small>' + goods(g[3]) + '</small></span></a>'; }).join('');
      }
      if (r.p.length) {
        html += '<p class="sg-label">Товары</p>' + r.p.slice(0, 6).map(function (id) { var p = BS.p[id]; return '<a class="sg-item" role="option" href="' + p[1] + '"><span class="sub-thumb" style="--s:40px">' + (p[3] ? '<img src="' + p[3] + '" alt="">' : '') + '</span><span>' + esc(p[0]) + '<small>' + esc((BS.g[p[2]] || [''])[0]) + '</small></span></a>'; }).join('');
      }
      html += r.g.length || r.p.length ? '<a class="sg-all" href="poisk.html?q=' + encodeURIComponent(q) + '">Все результаты: ' + goods(r.p.length) + '</a>' : '<p class="sg-label" style="text-transform:none">Ничего не нашли. Попробуйте модель или раздел.</p>';
      box.innerHTML = html;
      box.hidden = false;
      sel = -1;
      input.setAttribute('aria-expanded', 'true');
    };
    input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(render, 120); });
    input.addEventListener('keydown', function (e) {
      var list = items();
      if (box.hidden || !list.length) { return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
        list.forEach(function (a, i) { a.setAttribute('aria-selected', String(i === sel)); });
        list[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); location.href = list[sel].getAttribute('href'); } else if (e.key === 'Escape') { hide(); }
    });
    document.addEventListener('click', function (e) { if (!f.contains(e.target)) { hide(); } });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (f.hasAttribute('data-search-page')) { history.replaceState(null, '', 'poisk.html?q=' + encodeURIComponent(q)); showResults(q); hide(); return; }
      location.href = 'poisk.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });
  });
  var waLink = function (p) { return 'https://wa.me/' + BS.wa + '?text=' + encodeURIComponent('Здравствуйте! Интересует товар: ' + p[0] + '\n' + BS.site + p[8]); };
  var cardHtml = function (id) {
    var p = BS.p[id];
    var photo = p[7] ? '<img src="' + p[7] + '" alt="' + esc(p[0]) + '" loading="lazy">' : '';
    return '<article class="product-card"><a class="product-photo" href="' + p[1] + '" tabindex="-1" aria-hidden="true">' + photo + '</a><div class="product-body">' +
      (p[4] ? '<span class="presence ' + (p[4] === 'В наличии' ? 'is-in' : 'is-out') + '">' + esc(p[4]) + '</span>' : '') +
      '<h3 class="card-title"><a href="' + p[1] + '">' + esc(p[0]) + '</a></h3>' + (p[5] ? '<p class="card-spec">Производитель: ' + esc(p[5]) + '</p>' : '') +
      '<div class="card-actions"><button type="button" class="btn btn-outline" data-open="price" data-product="' + esc(p[0]) + '" data-product-url="' + esc(BS.site + p[8]) + '">Запросить цену</button>' +
      '<a class="btn btn-wa sm:px-0" href="' + esc(waLink(p)) + '" target="_blank" rel="noopener" aria-label="Написать в WhatsApp: ' + esc(p[0]) + '">WA</a></div>' +
      '<a class="card-more tap" href="' + p[1] + '">Подробнее' + ICON_ARROW + '</a></div></article>';
  };
  var results = $('#search-results');
  var showResults = function (q) {
    if (!results) { return; }
    var status = $('[data-search-status]');
    var groups = $('[data-search-groups]');
    if (!q) { status.textContent = 'Введите запрос: название, модель, раздел или производитель.'; results.innerHTML = ''; groups.innerHTML = ''; return; }
    var r = search(q);
    status.textContent = r.p.length ? 'По запросу «' + q + '» найдено: ' + goods(r.p.length) : 'По запросу «' + q + '» ничего не нашли. Проверьте написание или поищите по разделу.';
    groups.innerHTML = r.g.slice(0, 6).map(function (id) { var g = BS.g[id]; return '<a class="chip tap" href="' + g[1] + '"><span class="sub-thumb" style="--s:26px">' + (g[4] ? '<img src="' + g[4] + '" alt="">' : '') + '</span>' + esc(g[0]) + '<span class="num text-muted">' + g[3] + '</span></a>'; }).join('');
    results.innerHTML = r.p.slice(0, 48).map(cardHtml).join('');
    var wa = $('#tpl-wa');
    $$('.btn-wa', results).forEach(function (a) { if (wa) { a.innerHTML = wa.innerHTML; } });
  };
  if (results) {
    var q0 = new URLSearchParams(location.search).get('q') || '';
    $$('input[type=search]').forEach(function (i) { i.value = q0; });
    showResults(q0);
  }

  /* ---------- Слайдер первого экрана ---------- */
  var slider = $('[data-slider]');
  if (slider) {
    var slides = $$('[data-slide]', slider), cur = 0, timer;
    var num = $('[data-slide-num]', slider);
    var show = function (i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === cur); s.setAttribute('aria-hidden', String(k !== cur)); $$('a, button', s).forEach(function (x) { x.tabIndex = k === cur ? 0 : -1; }); });
      if (num) { num.textContent = String(cur + 1).padStart(2, '0'); }
    };
    var play = function () { if (!reduce) { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 7000); } };
    $('[data-slide-prev]', slider).addEventListener('click', function () { show(cur - 1); play(); });
    $('[data-slide-next]', slider).addEventListener('click', function () { show(cur + 1); play(); });
    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', play);
    slider.addEventListener('focusin', function () { clearInterval(timer); });
    var x0 = null;
    slider.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    slider.addEventListener('pointerup', function (e) { if (x0 !== null && Math.abs(e.clientX - x0) > 50) { show(cur + (e.clientX < x0 ? 1 : -1)); play(); } x0 = null; });
    show(0);
    play();
  }

  /* ---------- Окно с товарами при наведении на раздел в каталоге слева ---------- */
  var flyCur = null, flyEl = null, tOpen, tClose;
  function hideFly() {
    clearTimeout(tOpen);
    if (flyEl) { flyEl.hidden = true; }
    $$('.is-flying').forEach(function (a) { a.classList.remove('is-flying'); });
    flyCur = null;
  }
  var zone = $('[data-flyzone]');
  if (zone && finePointer) {
    flyEl = $('#fly', zone);
    var renderFly = function (id) {
      var g = BS.g[id];
      if (!g) { return false; }
      var subs = g[5].map(function (s) { var x = BS.g[s]; return '<a class="chip" href="' + x[1] + '"><span class="sub-thumb" style="--s:26px">' + (x[4] ? '<img src="' + x[4] + '" alt="">' : '') + '</span>' + esc(x[0]) + '<span class="num text-muted">' + x[3] + '</span></a>'; }).join('');
      var cards = g[6].map(function (pid) { var p = BS.p[pid]; return '<li><a class="fly-card" href="' + p[1] + '"><span class="ph">' + (p[3] ? '<img src="' + p[3] + '" alt="">' : '') + '</span><b>' + esc(p[0]) + '</b>' + (p[4] ? '<span class="presence ' + (p[4] === 'В наличии' ? 'is-in' : 'is-out') + '">' + esc(p[4]) + '</span>' : '') + '</a></li>'; }).join('');
      flyEl.innerHTML = '<div class="fly-head"><a class="fly-title" href="' + g[1] + '">' + esc(g[0]) + '</a><span class="num text-sm text-muted">' + goods(g[3]) + '</span><a class="fly-all" href="' + g[1] + '">Все товары раздела' + ICON_ARROW + '</a></div>' +
        (subs ? '<div class="fly-subs">' + subs + '</div>' : '') + (cards ? '<ul class="fly-grid">' + cards + '</ul>' : '');
      return true;
    };
    var place = function (a) {
      var zr = zone.getBoundingClientRect(), ar = a.getBoundingClientRect();
      var top = ar.top - zr.top - 12;
      var maxTop = Math.max(0, window.innerHeight - zr.top - flyEl.offsetHeight - 16);
      flyEl.style.top = Math.max(0, Math.min(top, maxTop)) + 'px';
    };
    zone.addEventListener('mouseover', function (e) {
      var a = e.target.closest('[data-fly]');
      if (!a || !zone.contains(a)) { return; }
      clearTimeout(tClose);
      var id = a.getAttribute('data-fly');
      if (id === flyCur) { return; }
      clearTimeout(tOpen);
      tOpen = setTimeout(function () {
        if (!renderFly(id)) { return; }
        $$('.is-flying', zone).forEach(function (x) { x.classList.remove('is-flying'); });
        a.classList.add('is-flying');
        flyCur = id;
        flyEl.hidden = false;
        place(a);
      }, flyCur ? 200 : 160);
    });
    flyEl.addEventListener('mouseenter', function () { clearTimeout(tOpen); clearTimeout(tClose); });
    zone.addEventListener('mouseleave', function () { clearTimeout(tOpen); tClose = setTimeout(hideFly, 250); });
  }

  /* ---------- Раздел: подразделы, фильтры, сортировка, страницы, вид ---------- */
  $$('[data-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var target = document.getElementById(b.getAttribute('data-toggle'));
      var open = target.hidden;
      target.hidden = !open;
      b.setAttribute('aria-expanded', String(open));
      $$('[data-when]', b).forEach(function (i) { i.hidden = i.getAttribute('data-when') !== (open ? 'open' : 'closed'); });
    });
  });
  var list = $('#products');
  if (list) {
    var cards = $$('.product-card', list);
    cards.forEach(function (c) { try { c._attrs = JSON.parse(c.getAttribute('data-attrs') || '{}'); } catch (err) { c._attrs = {}; } });
    var perPage = 12, page = 1, chosen = {};
    var found = $('[data-found]'), empty = $('[data-empty]'), pager = $('#pager');
    var matches = function (c) { return Object.keys(chosen).every(function (k) { return !chosen[k].length || chosen[k].indexOf(c._attrs[k]) >= 0; }); };
    var render = function () {
      var vis = cards.filter(matches);
      var pages = Math.max(1, Math.ceil(vis.length / perPage));
      if (page > pages) { page = pages; }
      cards.forEach(function (c) { c.hidden = true; });
      vis.forEach(function (c, i) { c.hidden = i < (page - 1) * perPage || i >= page * perPage; });
      if (found) { found.textContent = goods(vis.length); }
      if (empty) { empty.hidden = vis.length > 0; }
      var any = Object.keys(chosen).some(function (k) { return chosen[k].length; });
      $$('.toolbar [data-reset]').forEach(function (b) { b.hidden = !any; });
      $$('details.fdrop').forEach(function (d) { var n = $$('input:checked', d).length; var badge = $('.fcount', d); badge.textContent = n; badge.hidden = !n; });
      if (pager) {
        pager.innerHTML = '';
        pager.parentElement.hidden = vis.length <= 12;
        for (var n = 1; n <= pages && pages > 1; n++) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = n;
          b.className = 'btn w-11 px-0 ' + (n === page ? 'btn-primary' : 'btn-outline');
          b.setAttribute('aria-label', 'Страница ' + n);
          if (n === page) { b.setAttribute('aria-current', 'page'); }
          (function (v) { b.addEventListener('click', function () { page = v; render(); list.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }); })(n);
          pager.appendChild(b);
        }
      }
    };
    $$('[data-filter]').forEach(function (i) {
      i.addEventListener('change', function () {
        var k = i.getAttribute('data-filter');
        chosen[k] = $$('[data-filter="' + CSS.escape(k) + '"]:checked').map(function (x) { return x.value; });
        page = 1;
        render();
      });
    });
    $$('[data-reset]').forEach(function (b) { b.addEventListener('click', function () { chosen = {}; $$('[data-filter]').forEach(function (i) { i.checked = false; }); page = 1; render(); }); });
    var sort = $('#sort');
    if (sort) {
      sort.addEventListener('change', function () {
        var k = sort.value;
        cards.sort(function (a, b) { return k === 'title' ? a.getAttribute('data-title').localeCompare(b.getAttribute('data-title'), 'ru') : Number(a.getAttribute('data-' + k)) - Number(b.getAttribute('data-' + k)); });
        cards.forEach(function (c) { list.appendChild(c); });
        page = 1;
        render();
      });
    }
    var per = $('#per-page');
    if (per) { per.addEventListener('change', function () { perPage = Number(per.value); page = 1; render(); }); }
    var setView = function (v) {
      list.setAttribute('data-view', v);
      $$('[data-view-btn]').forEach(function (b) { var on = b.getAttribute('data-view-btn') === v; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('btn-primary', on); b.classList.toggle('btn-outline', !on); });
      try { localStorage.setItem('bs-view', v); } catch (err) { /* хранилище недоступно */ }
    };
    $$('[data-view-btn]').forEach(function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view-btn')); }); });
    try { if (localStorage.getItem('bs-view') === 'list') { setView('list'); } } catch (err) { /* хранилище недоступно */ }
    render();
  }

  /* Длинное описание раздела: свёрнуто, кнопка «Читать полностью» */
  $$('[data-clamp]').forEach(function (el) {
    if (el.scrollHeight < 220) { return; }
    el.classList.add('is-clamped');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'clamp-btn';
    b.textContent = 'Читать полностью';
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () { var open = el.classList.toggle('is-clamped'); b.textContent = open ? 'Читать полностью' : 'Свернуть'; b.setAttribute('aria-expanded', String(!open)); });
    el.after(b);
  });

  /* Галерея товара */
  var main = $('#gallery-main');
  if (main) {
    $$('[data-gallery]').forEach(function (b) {
      b.addEventListener('click', function () { main.src = b.getAttribute('data-gallery'); $$('[data-gallery]').forEach(function (o) { o.setAttribute('aria-current', String(o === b)); }); });
    });
  }

  /* Появление блоков: только для того, что ниже первого экрана; без JS и при reduced motion всё видно сразу */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        var el = en.target;
        var sib = el.parentElement ? $$(':scope > [data-reveal]', el.parentElement) : [];
        el.style.animationDelay = (Math.max(0, sib.indexOf(el)) % 4) * 70 + 'ms';
        el.classList.add('reveal');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px 12% 0px' });
    $$('[data-reveal]').forEach(function (el) { if (el.getBoundingClientRect().top > window.innerHeight) { io.observe(el); } });
  }
})();
