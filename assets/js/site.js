/* HaBikta site behaviour: nav, reveal, menu scrollspy, WhatsApp request forms. No dependencies. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var CFG = window.HABAKTA || {};
  var LANG = root.lang === 'en' ? 'en' : 'he';
  root.classList.add('js');

  /* ---------- Hide the kosher line once the certificate has expired ---------- */
  [].slice.call(doc.querySelectorAll('[data-until]')).forEach(function (el) {
    var u = el.getAttribute('data-until');
    if (u && u < todayStr()) el.hidden = true;
  });

  /* ---------- Navigation (mobile) ---------- */
  var header = doc.querySelector('.site-header');
  var toggle = doc.querySelector('.nav-toggle');
  var nav = doc.getElementById('site-nav');
  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setNav(false); toggle.focus(); } });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = [].slice.call(doc.querySelectorAll('.reveal'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Menu category scrollspy ---------- */
  var pills = [].slice.call(doc.querySelectorAll('.pills a[href^="#"]'));
  if (pills.length && 'IntersectionObserver' in window) {
    var map = {};
    pills.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          pills.forEach(function (p) { p.removeAttribute('aria-current'); });
          map[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Copy ---------- */
  var T = {
    he: {
      needName: 'נא למלא שם.', needDate: 'נא לבחור תאריך.', past: 'התאריך כבר עבר, נא לבחור תאריך אחר.',
      closedFri: 'בימי שישי אנחנו סגורים. נא לבחור יום אחר.',
      tue: 'בימי שלישי השעות משתנות, נאשר איתכם בוואטסאפ.',
      ready: 'ההודעה מוכנה. ההזמנה נשלחת רק אחרי שתלחצו על שליחה בוואטסאפ.',
      note: 'זו בקשה ולא אישור. השולחן סגור רק אחרי שהבקתה עונה לכם.',
      open: 'פתיחה בוואטסאפ'
    },
    en: {
      needName: 'Please enter your name.', needDate: 'Please choose a date.', past: 'That date has already passed, please pick another.',
      closedFri: 'We are closed on Fridays. Please choose another day.',
      tue: 'Tuesday hours vary, we will confirm with you on WhatsApp.',
      ready: 'Your message is ready. Nothing is sent until you press send in WhatsApp.',
      note: 'This is a request, not a confirmation. Your table is reserved only once HaBikta replies.',
      open: 'Open WhatsApp'
    }
  };
  var tx = T[LANG];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDate(v) { var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dateLabel(v) {
    try { return parseDate(v).toLocaleDateString(LANG === 'he' ? 'he-IL' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'numeric' }); }
    catch (e) { return v; }
  }
  function waUrl(msg) { return 'https://wa.me/' + (CFG.phoneIntl || '972584633555') + '?text=' + encodeURIComponent(msg); }

  /* ---------- Steppers ---------- */
  [].slice.call(doc.querySelectorAll('[data-step]')).forEach(function (b) {
    b.addEventListener('click', function () {
      var input = doc.getElementById(b.getAttribute('data-target'));
      if (!input) return;
      var v = (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10);
      input.value = Math.max(+input.min || 1, Math.min(+input.max || 99, v));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  /* ---------- Request forms (table / event) -> WhatsApp message ---------- */
  var today = todayStr();
  [].slice.call(doc.querySelectorAll('input[type=date]')).forEach(function (i) { i.min = today; });

  function wireForm(form) {
    var kind = form.getAttribute('data-kind');
    var status = form.querySelector('.form-status');
    var result = form.querySelector('.result');
    var dateEl = form.elements.date, nameEl = form.elements.name;

    function say(text, cls) { status.textContent = text || ''; status.className = 'form-status' + (cls ? ' ' + cls : ''); }
    function dateHint() {
      if (!dateEl || !dateEl.value) { say(''); return; }
      var day = parseDate(dateEl.value).getDay();
      if (day === 5) say(tx.closedFri, 'is-error');
      else if (day === 2) say(tx.tue, 'is-note');
      else say('');
    }
    if (dateEl) dateEl.addEventListener('change', dateHint);
    form.addEventListener('input', function () { result.classList.remove('is-on'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      [].slice.call(form.querySelectorAll('[aria-invalid]')).forEach(function (el) { el.removeAttribute('aria-invalid'); });
      var name = (nameEl.value || '').trim();
      if (!name) { nameEl.setAttribute('aria-invalid', 'true'); say(tx.needName, 'is-error'); nameEl.focus(); return; }
      var dv = dateEl ? dateEl.value : '';
      if (kind === 'reserve' && !dv) { dateEl.setAttribute('aria-invalid', 'true'); say(tx.needDate, 'is-error'); dateEl.focus(); return; }
      if (dv) {
        if (dv < today) { dateEl.setAttribute('aria-invalid', 'true'); say(tx.past, 'is-error'); dateEl.focus(); return; }
        if (parseDate(dv).getDay() === 5) { dateEl.setAttribute('aria-invalid', 'true'); say(tx.closedFri, 'is-error'); dateEl.focus(); return; }
      }
      var guests = form.elements.guests ? form.elements.guests.value : '';
      var notes = form.elements.notes ? (form.elements.notes.value || '').trim() : '';
      var msg;
      if (kind === 'reserve') {
        var time = form.elements.time.value;
        msg = LANG === 'he'
          ? 'שלום, אשמח לבקש שולחן ל-' + guests + ' סועדים, ' + dateLabel(dv) + ', בשעה ' + time + '. על שם ' + name + '.'
          : 'Hi, I would like to request a table for ' + guests + ' on ' + dateLabel(dv) + ' at ' + time + '. Name: ' + name + '.';
      } else {
        var type = form.elements.type.options[form.elements.type.selectedIndex].text;
        msg = LANG === 'he'
          ? 'שלום, אני מתעניין/ת באירוע בבקתה: ' + type + ', בערך ' + guests + ' אנשים' + (dv ? ', בתאריך ' + dateLabel(dv) : '') + '. שם: ' + name + '.'
          : 'Hi, I am interested in an event at HaBikta: ' + type + ', about ' + guests + ' people' + (dv ? ', on ' + dateLabel(dv) : '') + '. Name: ' + name + '.';
      }
      if (notes) msg += (LANG === 'he' ? ' הערה: ' : ' Note: ') + notes;
      var url = waUrl(msg);
      result.querySelector('.msg').textContent = msg;
      var link = result.querySelector('a');
      link.href = url;
      result.classList.add('is-on');
      say(tx.ready + ' ' + tx.note, 'is-note');
      try { window.open(url, '_blank', 'noopener'); } catch (err) { /* the visible link is the fallback */ }
    });
  }
  [].slice.call(doc.querySelectorAll('form[data-kind]')).forEach(wireForm);
})();
