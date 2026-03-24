/* AKA Software — lightweight i18n engine */
(function () {
  var LANG_KEY = 'aka-lang';
  var DEFAULT = 'tr';
  var _cache = {};

  function fetch_(lang, cb) {
    if (_cache[lang]) { cb(_cache[lang]); return; }
    fetch('/locales/' + lang + '.json')
      .then(function (r) { return r.json(); })
      .then(function (t) { _cache[lang] = t; cb(t); })
      .catch(function () { cb({}); });
  }

  function apply(t) {
    var lang = window.__akaLang || DEFAULT;

    // textContent replacements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t[el.getAttribute('data-i18n')];
      if (v !== undefined) el.textContent = v;
    });

    // aria-label replacements
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var v = t[el.getAttribute('data-i18n-aria')];
      if (v !== undefined) el.setAttribute('aria-label', v);
    });

    // placeholder replacements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var v = t[el.getAttribute('data-i18n-placeholder')];
      if (v !== undefined) el.setAttribute('placeholder', v);
    });

    // html lang attribute
    document.documentElement.lang = lang;

    // switcher button active state
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      var active = btn.getAttribute('data-lang-btn') === lang;
      btn.classList.toggle('lang-btn--active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function setLang(lang) {
    window.__akaLang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    fetch_(lang, apply);
  }

  function init() {
    var saved;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    var lang = saved || DEFAULT;
    window.__akaLang = lang;

    if (lang !== DEFAULT) {
      fetch_(lang, apply);
    } else {
      // Just update switcher active state — no fetch needed for default lang
      document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
        var active = btn.getAttribute('data-lang-btn') === lang;
        btn.classList.toggle('lang-btn--active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
  }

  window.setLang = setLang;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
