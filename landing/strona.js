(function () {
  // ===== Ustawienia strony (zmień tutaj) =====
  // Skrypt zapisu na serwerze (deploy/zapis.php). Pusty = formularz wyłączony.
  var FORM_ENDPOINT = 'zapis.php';
  // Termin egzaminu z matematyki wg harmonogramu CKE: 11 maja 2027, 9:00 czasu polskiego.
  var EXAM = new Date('2027-05-11T09:00:00+02:00');

  // Odliczanie tygodni
  function tygodnie(n) {
    var l = n % 10, ll = n % 100;
    if (n === 1) return '1 tydzień';
    if (l >= 2 && l <= 4 && !(ll >= 12 && ll <= 14)) return n + ' tygodnie';
    return n + ' tygodni';
  }
  var el = document.getElementById('weeks-left');
  var days = Math.ceil((EXAM - new Date()) / 864e5);
  if (el) {
    if (days > 13) el.textContent = tygodnie(Math.floor(days / 7));
    else if (days > 0) el.textContent = days === 1 ? '1 dzień' : days + ' dni';
    else el.parentNode.hidden = true;
  }

  // Dopiski długopisem rysują się, gdy pojawią się na ekranie
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var notes = document.querySelectorAll('.note');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove('wait'); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    notes.forEach(function (n) { n.classList.add('wait'); io.observe(n); });
  }

  // Komunikat o plikach cookies (zapamiętanie zamknięcia w pamięci przeglądarki)
  var note = document.getElementById('cookie-note');
  var seen = false;
  try { seen = localStorage.getItem('edukwadrat:cookie-note') === '1'; } catch (e) {}
  if (note && !seen) note.hidden = false;
  document.getElementById('cookie-ok').addEventListener('click', function () {
    note.hidden = true;
    try { localStorage.setItem('edukwadrat:cookie-note', '1'); } catch (e) {}
  });

  // Formularz zapisu
  var form = document.getElementById('signup');
  var msg = document.getElementById('form-msg');
  var btn = document.getElementById('signup-btn');
  function say(text, kind) { msg.textContent = text; msg.className = 'form-msg ' + (kind || ''); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say('Wpisz poprawny adres e-mail, np. imie@przyklad.pl.', 'err'); form.email.focus(); return; }
    if (!form.consent.checked) { say('Zaznacz zgodę, żebyśmy mogli wysłać Ci e-mail na start.', 'err'); return; }
    if (!FORM_ENDPOINT) { say('Zapisy jeszcze nie działają na tej stronie. Wróć za kilka dni.', 'err'); return; }
    btn.disabled = true; say('Zapisuję…');
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email, consent: true, strona: form.strona.value })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok || !d.ok) { say(d.wiadomosc || 'Nie udało się zapisać. Spróbuj jeszcze raz za kilka minut.', 'err'); return; }
        form.reset();
        say(d.wiadomosc, 'ok');
      });
    }).catch(function () {
      say('Nie udało się zapisać. Sprawdź połączenie z internetem i spróbuj jeszcze raz.', 'err');
    }).then(function () { btn.disabled = false; });
  });
})();
