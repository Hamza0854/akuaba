/* ==========================================================================
   Akuaba Medical Centre
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------------
     Scroll state: header, progress bar, back-to-top
     ---------------------------------------------------------------------- */
  var header   = doc.getElementById('siteHeader');
  var toTop     = doc.getElementById('toTop');
  var progress  = doc.getElementById('progressFill');
  var ticking   = false;

  function onScroll() {
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    var max = doc.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle('is-stuck', y > 40);
    if (toTop)  toTop.classList.toggle('is-visible', y > 700);
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------------------
     Active section in the navigation
     ---------------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.navbar-nav .nav-link[href^="#"]'));
  var sections = navLinks.map(function (l) { return doc.querySelector(l.getAttribute('href')); }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ----------------------------------------------------------------------
     Close the mobile menu on choice
     ---------------------------------------------------------------------- */
  var navCollapse = doc.getElementById('primaryNav');
  if (navCollapse) {
    navCollapse.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (!navCollapse.classList.contains('show')) return;
        if (window.bootstrap && window.bootstrap.Collapse) {
          window.bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
        }
      });
    });
  }

  /* ----------------------------------------------------------------------
     Rotating headline word
     ---------------------------------------------------------------------- */
  var words = doc.querySelectorAll('.swap__word');
  if (words.length > 1 && !reduceMotion) {
    var wi = 0;
    window.setInterval(function () {
      words[wi].classList.remove('is-on');
      wi = (wi + 1) % words.length;
      words[wi].classList.add('is-on');
    }, 2800);
  }

  /* ----------------------------------------------------------------------
     Count-up numbers, run once when scrolled into view
     ---------------------------------------------------------------------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = target + suffix; return; }

    var start = null;
    var duration = 1400;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  var counters = doc.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { countObserver.observe(c); });
  } else {
    counters.forEach(countUp);
  }

  /* ----------------------------------------------------------------------
     Virtual tour tabs
     ---------------------------------------------------------------------- */
  var tourImage   = doc.getElementById('tourImage');
  var tourCaption = doc.getElementById('tourCaption');
  var tourTabs    = doc.querySelectorAll('.tourbox__tabs button');

  tourTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (tab.classList.contains('is-on')) return;

      tourTabs.forEach(function (t) {
        t.classList.remove('is-on');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-on');
      tab.setAttribute('aria-selected', 'true');

      if (!tourImage) return;
      tourImage.classList.add('is-fading');
      window.setTimeout(function () {
        tourImage.src = tab.getAttribute('data-img');
        tourImage.alt = tab.getAttribute('data-alt') || '';
        if (tourCaption) tourCaption.textContent = tab.getAttribute('data-label') || '';
        tourImage.classList.remove('is-fading');
      }, reduceMotion ? 0 : 260);
    });
  });

  /* ----------------------------------------------------------------------
     data-book → load a service into the appointment form
     ---------------------------------------------------------------------- */
  var bookCard    = doc.getElementById('book');
  var serviceSel  = doc.getElementById('bkService');

  function selectService(value) {
    if (!serviceSel) return;
    var wanted = value.trim().toLowerCase();
    var matched = false;

    Array.prototype.forEach.call(serviceSel.options, function (opt) {
      if (opt.text.trim().toLowerCase() === wanted) {
        serviceSel.value = opt.value || opt.text;
        matched = true;
      }
    });

    if (!matched) {
      var extra = doc.createElement('option');
      extra.text = value;
      serviceSel.add(extra);
      serviceSel.value = extra.value || extra.text;
    }
    serviceSel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function focusFirstEmpty(form) {
    var fields = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].value) { fields[i].focus({ preventScroll: true }); return; }
    }
  }

  doc.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-book]');
    if (!trigger) return;

    event.preventDefault();
    selectService(trigger.getAttribute('data-book'));

    if (!bookCard) return;
    bookCard.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });

    bookCard.classList.remove('is-flash');
    void bookCard.offsetWidth;
    bookCard.classList.add('is-flash');

    window.setTimeout(function () {
      var form = doc.getElementById('bookingForm');
      if (form) focusFirstEmpty(form);
    }, reduceMotion ? 0 : 560);
  });

  /* ----------------------------------------------------------------------
     Appointment form: date floor + completion bar
     ---------------------------------------------------------------------- */
  var dateInput = doc.getElementById('bkDate');
  if (dateInput) {
    var today = new Date();
    var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    dateInput.min = iso;
  }

  var bookingForm = doc.getElementById('bookingForm');
  var stepFill    = doc.getElementById('stepFill');

  function updateProgress() {
    if (!bookingForm || !stepFill) return;
    var required = bookingForm.querySelectorAll('[required]');
    if (!required.length) return;
    var done = 0;
    required.forEach(function (f) { if (f.value) done++; });
    stepFill.style.width = Math.round((done / required.length) * 100) + '%';
  }

  if (bookingForm) {
    bookingForm.addEventListener('input', updateProgress);
    bookingForm.addEventListener('change', updateProgress);
    updateProgress();
  }

  /* ----------------------------------------------------------------------
     Missing images should never show raw alt text over a card
     ---------------------------------------------------------------------- */
  doc.querySelectorAll('.tile > img, .svc__media img, .frame img, .tourbox__stage img').forEach(function (img) {
    img.addEventListener('error', function () { img.classList.add('is-broken'); });
    if (img.complete && img.naturalWidth === 0) img.classList.add('is-broken');
  });

  /* ----------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */
  var revealTargets = doc.querySelectorAll(
    '.concern, .spec, .tile, .svc, .whylist li, .frame, .stats, .panel, ' +
    '.insurers li, .promise, .callout, .tourbox, .bookcard, .contactlist'
  );

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var delay = Math.min(i, 5) * 65;
        window.setTimeout(function () { entry.target.classList.add('is-in'); }, delay);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ----------------------------------------------------------------------
     Lead forms
     Posts to data-endpoint when set, otherwise hands off to WhatsApp so no
     enquiry is lost before the backend is wired up.
     ---------------------------------------------------------------------- */
  var LABELS = {
    name: 'Patient', phone: 'Phone', email: 'Email', service: 'Service',
    date: 'Preferred date', time: 'Preferred time', insurance: 'Insurance',
    notes: 'Notes', subject: 'Subject', message: 'Message'
  };

  function serialise(form) {
    var data = {};
    new FormData(form).forEach(function (v, k) {
      data[k] = typeof v === 'string' ? v.trim() : v;
    });
    return data;
  }

  function toWhatsAppText(data, heading) {
    var lines = [heading, ''];
    Object.keys(data).forEach(function (k) {
      if (!data[k]) return;
      lines.push((LABELS[k] || k) + ': ' + data[k]);
    });
    return encodeURIComponent(lines.join('\n'));
  }

  function setStatus(node, message, ok) {
    if (!node) return;
    node.textContent = message;
    node.classList.add('is-visible');
    node.classList.toggle('is-ok', !!ok);
    node.classList.toggle('is-error', !ok);
  }

  function handleForm(formId, statusId, heading, successText) {
    var form = doc.getElementById(formId);
    if (!form) return;
    var status = doc.getElementById(statusId);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        var firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var button   = form.querySelector('button[type="submit"]');
      var data     = serialise(form);
      var endpoint = form.getAttribute('data-endpoint');
      var whatsapp = form.getAttribute('data-whatsapp');

      data.page = window.location.href;
      data.submitted_at = new Date().toISOString();

      if (button) button.classList.add('is-loading');

      function finish(ok, message) {
        if (button) button.classList.remove('is-loading');
        setStatus(status, message, ok);
        if (ok) {
          form.reset();
          form.classList.remove('was-validated');
          updateProgress();
        }
      }

      if (endpoint) {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
          .then(function (res) {
            if (!res.ok) throw new Error('Request failed');
            finish(true, successText);
          })
          .catch(function () {
            finish(false, 'That did not send. Please call 0540 121 563 or message us on WhatsApp and we will take the details directly.');
          });
        return;
      }

      if (whatsapp) {
        window.open('https://wa.me/' + whatsapp + '?text=' + toWhatsAppText(data, heading), '_blank', 'noopener');
        finish(true, successText);
        return;
      }

      finish(false, 'No delivery method is configured for this form yet.');
    });
  }

  handleForm(
    'bookingForm', 'bookingStatus',
    'New appointment request from akuabamc.com',
    'Appointment request received. Our front desk will call you to confirm the time and the consultant.'
  );

  handleForm(
    'contactForm', 'contactStatus',
    'New message from akuabamc.com',
    'Message sent. We reply the same working day.'
  );

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */
  var year = doc.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
