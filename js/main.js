/* =========================================================
   Aidan Joshi — portfolio behaviour
   Vanilla JS, no dependencies, no build step.
   ========================================================= */
(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Typing effect in the hero
     EDIT: change these strings to whatever you want cycled.
     --------------------------------------------------------- */
  var ROLES = [
    'cs student @ csuf',
    'future software developer',
    'class of 2028'
  ];

  function startTyping() {
    var el = $('#typed');
    if (!el) return;

    if (reduceMotion) {          // no animation: just show the first role
      el.textContent = ROLES[0];
      return;
    }

    var role = 0;
    var chars = 0;
    var deleting = false;

    function tick() {
      var word = ROLES[role];
      chars += deleting ? -1 : 1;
      el.textContent = word.slice(0, chars);

      var delay = deleting ? 45 : 85;

      if (!deleting && chars === word.length) {
        delay = 1900;            // hold the finished word
        deleting = true;
      } else if (deleting && chars === 0) {
        deleting = false;
        role = (role + 1) % ROLES.length;
        delay = 420;
      }
      window.setTimeout(tick, delay);
    }
    tick();
  }

  /* ---------------------------------------------------------
     2. Reveal on scroll
     --------------------------------------------------------- */
  function startReveals() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // stagger siblings slightly so groups cascade instead of popping
        var siblings = Array.prototype.slice.call(entry.target.parentNode.children);
        var i = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     3. Count-up stats
     --------------------------------------------------------- */
  function startCounters() {
    var nums = $$('.stat__num');
    if (!nums.length) return;

    function run(el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      var suffix = el.dataset.suffix || '';

      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }

      var duration = 1400;
      var start = null;

      function frame(now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);       // ease-out cubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     4. Nav: shrink on scroll, scroll-spy, mobile drawer
     --------------------------------------------------------- */
  function startNav() {
    var nav = $('#nav');
    var burger = $('#burger');
    var links = $('#navLinks');
    var bar = $('#progressBar');

    var spyLinks = $$('#navLinks a[href^="#"]').filter(function (a) {
      return document.querySelector(a.getAttribute('href'));
    });
    var sections = spyLinks.map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    });

    function closeMenu() {
      if (!links || !burger) return;
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('is-locked');
    }

    if (burger && links) {
      burger.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('is-locked', open);
      });

      // any nav tap closes the drawer
      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) closeMenu();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
      });
    }

    // reset the drawer if the viewport grows back to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 720) closeMenu();
    });

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(function () {
        var y = window.scrollY || window.pageYOffset;

        if (nav) nav.classList.toggle('scrolled', y > 20);

        if (bar) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        }

        // scroll-spy: last section whose top has passed the header line
        var current = -1;
        sections.forEach(function (section, i) {
          if (section.getBoundingClientRect().top <= 140) current = i;
        });
        spyLinks.forEach(function (a, i) {
          a.classList.toggle('active', i === current);
        });

        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     5. Cursor spotlight (pointer devices only)
     --------------------------------------------------------- */
  function startSpotlight() {
    var el = $('.spotlight');
    if (!el || reduceMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    window.addEventListener('mousemove', function (e) {
      el.style.setProperty('--mx', e.clientX + 'px');
      el.style.setProperty('--my', e.clientY + 'px');
      el.classList.add('on');
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      el.classList.remove('on');
    });
  }

  /* ---------------------------------------------------------
     6. Copy-email button
     --------------------------------------------------------- */
  function startCopy() {
    var btn = $('#copyEmail');
    var note = $('#copied');
    if (!btn) return;

    function flash(msg) {
      if (!note) return;
      note.textContent = msg;
      note.classList.add('show');
      window.setTimeout(function () { note.classList.remove('show'); }, 2200);
    }

    btn.addEventListener('click', function () {
      var email = btn.dataset.email || '';

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(
          function () { flash('copied to clipboard'); },
          function () { flash(email); }
        );
        return;
      }

      // file:// and other non-secure contexts have no clipboard API
      var tmp = document.createElement('textarea');
      tmp.value = email;
      tmp.setAttribute('readonly', '');
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(tmp);
      flash(ok ? 'copied to clipboard' : email);
    });
  }

  /* ---------------------------------------------------------
     7. Misc
     --------------------------------------------------------- */
  function startMisc() {
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    // a small hello for anyone who opens devtools
    if (window.console && console.log) {
      console.log(
        '%c aidan.dev %c thanks for looking under the hood ',
        'background:#7c5cff;color:#0a0a14;font-weight:700;border-radius:4px 0 0 4px;padding:4px 8px',
        'background:#111827;color:#22d3ee;border-radius:0 4px 4px 0;padding:4px 8px'
      );
    }
  }

  function init() {
    startTyping();
    startReveals();
    startCounters();
    startNav();
    startSpotlight();
    startCopy();
    startMisc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
