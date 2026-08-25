/* AKA Software — lightweight i18n engine */
(function () {
  'use strict';

  var LANG_KEY  = 'aka-lang';
  var DEFAULT   = 'tr';
  var SUPPORTED = ['tr', 'en'];
  var _cache    = {};
  var _current  = {};   // active translation table
  var _base     = {};   // default-language table, used as fallback

  /*
   * Locale files are plain static assets, so browsers cache them hard. The
   * layout loads this script as /i18n.js?v=<build>; reusing that same query on
   * the locale requests makes a new deploy fetch fresh copy instead of
   * silently serving yesterday's translations.
   */
  var VERSION = (function () {
    var self = document.currentScript;
    var src  = self && self.src ? self.src : '';
    var m    = src.match(/[?&]v=([^&]+)/);
    return m ? m[1] : '';
  })();

  /* ── Load a locale file (cached) ──────────────────────────── */
  function load(lang) {
    if (_cache[lang]) return Promise.resolve(_cache[lang]);
    return fetch('/locales/' + lang + '.json' + (VERSION ? '?v=' + VERSION : ''))
      .then(function (r) {
        if (!r.ok) throw new Error('locale ' + lang + ' -> HTTP ' + r.status);
        return r.json();
      })
      .then(function (t) { _cache[lang] = t; return t; })
      .catch(function (e) {
        console.warn('[i18n] "' + lang + '" yüklenemedi, kaynak dil korunuyor.', e);
        _cache[lang] = {};
        return _cache[lang];
      });
  }

  /* ── Look up a key, falling back to the default language ──── */
  function t(key, fallback) {
    if (key in _current) return _current[key];
    if (key in _base)    return _base[key];
    return fallback !== undefined ? fallback : key;
  }

  /*
   * Replace an element's visible text WITHOUT destroying child
   * elements (icons, dots, chevrons live alongside the label).
   * `textContent = v` would wipe them out, so only text nodes move.
   */
  function setText(el, value) {
    var textNodes = [];
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 3) textNodes.push(el.childNodes[i]);
    }

    if (!textNodes.length) {
      el.appendChild(document.createTextNode(value));
      return;
    }

    // Prefer the first node that actually carries text.
    var target = textNodes[0];
    for (var j = 0; j < textNodes.length; j++) {
      if (textNodes[j].nodeValue.trim()) { target = textNodes[j]; break; }
    }
    target.nodeValue = value;

    // Blank out any other non-empty text nodes so the label isn't duplicated.
    for (var k = 0; k < textNodes.length; k++) {
      if (textNodes[k] !== target && textNodes[k].nodeValue.trim()) {
        textNodes[k].nodeValue = '';
      }
    }
  }

  /* ── Apply the active table to the document ───────────────── */
  function apply(root) {
    var scope = root || document;
    var lang  = window.__akaLang || DEFAULT;

    each(scope, '[data-i18n]', function (el, key) {
      var v = t(key, null);
      if (v !== null) setText(el, v);
    }, 'data-i18n');

    each(scope, '[data-i18n-html]', function (el, key) {
      var v = t(key, null);
      if (v !== null) el.innerHTML = v;
    }, 'data-i18n-html');

    each(scope, '[data-i18n-aria]', function (el, key) {
      var v = t(key, null);
      if (v !== null) el.setAttribute('aria-label', v);
    }, 'data-i18n-aria');

    each(scope, '[data-i18n-placeholder]', function (el, key) {
      var v = t(key, null);
      if (v !== null) el.setAttribute('placeholder', v);
    }, 'data-i18n-placeholder');

    each(scope, '[data-i18n-title]', function (el, key) {
      var v = t(key, null);
      if (v !== null) el.setAttribute('title', v);
    }, 'data-i18n-title');

    each(scope, '[data-i18n-content]', function (el, key) {
      var v = t(key, null);
      if (v !== null) el.setAttribute('content', v);
    }, 'data-i18n-content');

    // Avatar initials derived from a translated name (e.g. "Ü" → "P")
    each(scope, '[data-i18n-initial]', function (el, key) {
      var v = t(key, null);
      if (v && v.trim()) setText(el, v.trim().charAt(0).toUpperCase());
    }, 'data-i18n-initial');

    // <time data-i18n-date datetime="…"> → reformat for the active locale
    var dates = scope.querySelectorAll('time[data-i18n-date][datetime]');
    for (var d = 0; d < dates.length; d++) {
      var parsed = new Date(dates[d].getAttribute('datetime'));
      if (isNaN(parsed.getTime())) continue;
      try {
        setText(dates[d], parsed.toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', {
          year: 'numeric', month: 'long', day: 'numeric',
        }));
      } catch (e) { /* keep the server-rendered date */ }
    }

    if (!root) {
      document.documentElement.lang = lang;
      var docTitle = t('meta.' + (document.body && document.body.dataset.page || ''), null);
      if (docTitle) document.title = docTitle;
      syncSwitcher(lang);
    }
  }

  function each(scope, selector, fn, attr) {
    var list = scope.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      var key = list[i].getAttribute(attr);
      if (key) fn(list[i], key);
    }
  }

  /* ── Language switcher button states ──────────────────────── */
  function syncSwitcher(lang) {
    var btns = document.querySelectorAll('[data-lang-btn]');
    for (var i = 0; i < btns.length; i++) {
      var active = btns[i].getAttribute('data-lang-btn') === lang;
      btns[i].classList.toggle('lang-btn--active', active);
      btns[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  /* ── Public: switch language ──────────────────────────────── */
  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT;
    window.__akaLang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}

    // Default table is always needed as the fallback layer.
    return Promise.all([load(DEFAULT), load(lang)]).then(function (res) {
      _base    = res[0];
      _current = res[1];
      apply();
      document.dispatchEvent(
        new CustomEvent('aka:langchange', { detail: { lang: lang } })
      );
      return lang;
    });
  }

  function currentLang() {
    return window.__akaLang || DEFAULT;
  }

  /* ── Boot ─────────────────────────────────────────────────── */
  var _readyResolve;
  var _ready = new Promise(function (res) { _readyResolve = res; });

  function init() {
    var saved;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    var lang = SUPPORTED.indexOf(saved) !== -1 ? saved : DEFAULT;

    // Paint the switcher immediately so it never lags behind the choice.
    window.__akaLang = lang;
    syncSwitcher(lang);
    document.documentElement.lang = lang;

    /*
     * Always load and apply — including Turkish. The markup is the
     * Turkish source, but applying tr.json too keeps the locale files
     * as the single source of truth and stops the two from drifting.
     */
    setLang(lang).then(function () { _readyResolve(currentLang()); });
  }

  window.setLang  = setLang;          // kept for existing inline onclick handlers
  window.akaI18n  = {
    t        : t,
    apply    : apply,
    setLang  : setLang,
    lang     : currentLang,
    ready    : function (cb) { return cb ? _ready.then(cb) : _ready; },
    SUPPORTED: SUPPORTED,
    DEFAULT  : DEFAULT,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
