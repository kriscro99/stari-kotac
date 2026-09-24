/* Stari Kotač — interakcije i animacije */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Loader ---------- */
  let loaded = false;
  const finishLoading = () => {
    if (loaded) return;
    loaded = true;
    root.classList.add('is-loaded');
    setTimeout(() => $('.loader')?.remove(), 1400);
  };
  const minShow = reduceMotion ? 0 : 900;
  const started = performance.now();
  const onLoad = () => setTimeout(finishLoading, Math.max(0, minShow - (performance.now() - started)));
  if (document.readyState === 'complete') onLoad();
  else window.addEventListener('load', onLoad, { once: true });
  setTimeout(finishLoading, 3200);

  /* ---------- Godine tradicije ---------- */
  const years = new Date().getFullYear() - 1982;
  const godina = (n) => {
    const d = n % 10, h = n % 100;
    if (d === 1 && h !== 11) return 'godinu';
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'godine';
    return 'godina';
  };
  const godinaNom = (n) => {
    const d = n % 10, h = n % 100;
    if (d === 1 && h !== 11) return 'godina';
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'godine';
    return 'godina';
  };
  $$('[data-years-text]').forEach((el) => { el.textContent = `${years} ${godina(years)}`; });
  $$('[data-years]').forEach((el) => { el.dataset.count = years; el.textContent = years; });
  $$('[data-years-label]').forEach((el) => { el.textContent = `${godinaNom(years)} tradicije`; });
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Otvoreno / zatvoreno (vrijeme u Zagrebu) ---------- */
  const zagrebNow = () => {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Zagreb', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t)?.value;
      const day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get('weekday')];
      return { day, min: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
    } catch (e) {
      const d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  };
  const OPEN = 10 * 60, CLOSE = 22 * 60;
  const updateStatus = () => {
    const { day, min } = zagrebNow();
    const workday = day !== 1;
    const open = workday && min >= OPEN && min < CLOSE;
    let text;
    if (open) text = min >= CLOSE - 60 ? 'Otvoreno još kratko · do 22:00' : 'Sada otvoreno · do 22:00';
    else if (workday && min < OPEN) text = 'Zatvoreno · otvaramo danas u 10:00';
    else if (day === 1) text = 'Danas ne radimo · otvaramo sutra u 10:00';
    else if (day === 0) text = 'Zatvoreno · otvaramo u utorak u 10:00';
    else text = 'Zatvoreno · otvaramo sutra u 10:00';
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('is-open', open);
      el.classList.toggle('is-closed', !open);
      const span = el.querySelector('span');
      if (span) span.textContent = text;
    });
    $$('.hours__list li').forEach((li) => li.classList.toggle('is-today', +li.dataset.day === day));
  };
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Razdvajanje teksta ---------- */
  $$('[data-chars]').forEach((line) => {
    const text = line.textContent.trim();
    line.textContent = '';
    [...text].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--ci', i);
      s.textContent = c;
      line.appendChild(s);
    });
    line.setAttribute('aria-hidden', 'true');
  });

  const splitWords = (el) => {
    let wi = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = p;
            inner.style.setProperty('--wi', wi++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
  };
  $$('[data-split]').forEach(splitWords);

  // Citat: riječi se pale dok se stranica pomiče
  const scrub = $('[data-scrub]');
  let scrubWords = [];
  if (scrub) {
    const words = scrub.textContent.trim().split(/\s+/);
    scrub.innerHTML = words.map((w) => `<span class="sw">${w}</span>`).join(' ');
    scrubWords = $$('.sw', scrub);
  }

  /* ---------- Pojavljivanje pri pomicanju ---------- */
  const revealEls = $$('[data-reveal], [data-split]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Brojači ---------- */
  const fmt = new Intl.NumberFormat('hr-HR');
  const runCounter = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = fmt.format(target); return; }
    const dur = 2000;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(2, -10 * p);
      el.textContent = fmt.format(Math.round(target * (p === 1 ? 1 : eased)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => { if (!reduceMotion) el.textContent = '0'; cio.observe(el); });
  }

  /* ---------- Header, napredak, aktivna poveznica, donja traka ---------- */
  const header = $('.header');
  const bar = $('.progress span');
  const dock = $('.dock');
  const hero = $('.hero');
  const heroMedia = $('[data-hero-media]');
  const heroContent = $('[data-hero-content]');
  const spinners = $$('[data-spin]');
  const parallaxEls = $$('[data-parallax]');
  const quote = $('.quote');
  let lastY = window.scrollY;
  let ticking = false;
  let vh = window.innerHeight;

  const inView = new Set();
  if ('IntersectionObserver' in window) {
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)));
    }, { rootMargin: '100px 0px' });
    parallaxEls.forEach((el) => pio.observe(el));
  }

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    header.classList.toggle('is-scrolled', y > 30);
    const menuOpen = root.classList.contains('menu-open');
    if (!menuOpen) header.classList.toggle('is-hidden', y > lastY && y > vh * 0.9);

    const heroH = hero.offsetHeight;
    dock.classList.toggle('is-visible', y > heroH * 0.7);

    if (!reduceMotion) {
      if (y < heroH) {
        const p = y / heroH;
        heroMedia.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
        heroContent.style.transform = `translate3d(0, ${y * -0.12}px, 0)`;
        heroContent.style.opacity = String(Math.max(0, 1 - p * 1.4));
      }
      spinners.forEach((el) => { el.style.transform = `rotate(${y * +el.dataset.spin}deg)`; });
      inView.forEach((el) => {
        const r = el.getBoundingClientRect();
        const off = (r.top + r.height / 2 - vh / 2) * +el.dataset.parallax;
        el.style.translate = `0 ${off.toFixed(1)}px`;
      });
      if (quote && scrubWords.length) {
        const r = quote.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height * 0.75)));
        const n = Math.round(p * scrubWords.length);
        scrubWords.forEach((w, i) => w.classList.toggle('on', i < n));
      }
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', () => { vh = window.innerHeight; onScroll(); positionInk(); }, { passive: true });
  if (reduceMotion) scrubWords.forEach((w) => w.classList.add('on'));

  // Aktivna poveznica u navigaciji
  const navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['o-nama', 'jelovnik', 'galerija', 'tim', 'kontakt'].forEach((id) => { const s = document.getElementById(id); if (s) sio.observe(s); });
  }

  /* ---------- Mobilni izbornik ---------- */
  const burger = $('.burger');
  const mnav = $('#mnav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
    root.classList.toggle('menu-open', open);
    header.classList.remove('is-hidden');
    if (open) {
      mnav.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => mnav.classList.add('is-open')));
    } else {
      mnav.classList.remove('is-open');
      setTimeout(() => { if (!mnav.classList.contains('is-open')) mnav.hidden = true; }, 800);
    }
  };
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $$('a', mnav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false); });

  /* ---------- Žar u uvodu ---------- */
  const canvas = $('.hero__embers');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, parts = [], running = true, raf;
    const count = () => (window.innerWidth < 700 ? 34 : 70);
    const spawn = (initial) => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + Math.random() * 40,
      r: 0.6 + Math.random() * 1.9,
      vy: 0.25 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.3,
      ph: Math.random() * Math.PI * 2,
      life: 0,
      max: 0.55 + Math.random() * 0.45,
      hue: 18 + Math.random() * 22
    });
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: count() }, () => spawn(true));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        p.life += 0.016;
        p.ph += 0.03;
        p.y -= p.vy;
        p.x += p.vx + Math.sin(p.ph) * 0.35;
        const fadeTop = Math.min(1, p.y / (h * 0.55));
        const flicker = 0.7 + Math.sin(p.ph * 3) * 0.3;
        const a = Math.max(0, Math.min(1, p.life * 2)) * fadeTop * flicker * p.max;
        if (p.y < -10 || a <= 0 && p.life > 1) Object.assign(p, spawn(false));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `hsla(${p.hue + 15}, 100%, 72%, ${a})`);
        g.addColorStop(0.3, `hsla(${p.hue}, 100%, 55%, ${a * 0.55})`);
        g.addColorStop(1, `hsla(${p.hue}, 100%, 45%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    };
    resize();
    draw();
    let rw = window.innerWidth;
    window.addEventListener('resize', () => { if (window.innerWidth !== rw) { rw = window.innerWidth; resize(); } }, { passive: true });
    const setRunning = (on) => {
      if (on && !running) { running = true; draw(); }
      else if (!on) { running = false; cancelAnimationFrame(raf); }
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => setRunning(e.isIntersecting)).observe(hero);
    }
    document.addEventListener('visibilitychange', () => setRunning(!document.hidden && window.scrollY < hero.offsetHeight));
  }

  /* ---------- Jelovnik: kartice ---------- */
  const tabs = $$('.menu__tab');
  const panels = $$('.menu__panel');
  const ink = $('.menu__ink');
  const tabBar = $('.menu__tabs');
  function positionInk() {
    const active = $('.menu__tab.is-active');
    if (!active || !ink) return;
    ink.style.width = `${active.offsetWidth}px`;
    ink.style.transform = `translateX(${active.offsetLeft}px)`;
  }
  panels.forEach((p) => $$('.dish', p).forEach((d, i) => d.style.setProperty('--i', Math.min(i, 16))));
  const selectTab = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => {
      const on = p.id === tab.getAttribute('aria-controls');
      p.classList.toggle('is-active', on);
      p.hidden = !on;
    });
    positionInk();
    const box = $('.menu__box');
    const top = box.getBoundingClientRect().top;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 90, behavior: reduceMotion ? 'auto' : 'smooth' });
    const left = tab.offsetLeft - (tabBar.clientWidth - tab.offsetWidth) / 2;
    tabBar.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0];
      if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });
  positionInk();
  document.fonts?.ready.then(positionInk);
  window.addEventListener('load', positionInk);

  /* ---------- Sjaj kartica i nagib (samo miš) ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-glow]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${y * -8}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    $$('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Galerija: lightbox ---------- */
  const items = $$('.gallery__grid .g');
  const lb = $('.lightbox');
  const lbImg = $('.lightbox__fig img');
  const lbCap = $('.lightbox__cap');
  const lbCount = $('.lightbox__count');
  let idx = 0, lastFocus = null;
  const show = (i) => {
    idx = (i + items.length) % items.length;
    const a = items[idx];
    const thumb = $('img', a);
    lbImg.classList.remove('is-ready');
    const next = new Image();
    next.onload = () => {
      lbImg.src = next.src;
      lbImg.alt = thumb.alt;
      requestAnimationFrame(() => lbImg.classList.add('is-ready'));
    };
    next.src = a.getAttribute('href');
    lbCap.textContent = thumb.alt;
    lbCount.textContent = `${idx + 1} / ${items.length}`;
  };
  const openLb = (i) => {
    lastFocus = document.activeElement;
    lb.hidden = false;
    root.classList.add('menu-open');
    requestAnimationFrame(() => lb.classList.add('is-open'));
    show(i);
    $('.lightbox__close').focus();
  };
  const closeLb = () => {
    lb.classList.remove('is-open');
    root.classList.remove('menu-open');
    setTimeout(() => { lb.hidden = true; lbImg.classList.remove('is-ready'); }, 400);
    lastFocus?.focus();
  };
  items.forEach((a, i) => a.addEventListener('click', (e) => { e.preventDefault(); openLb(i); }));
  $('.lightbox__close').addEventListener('click', closeLb);
  $('.lightbox__prev').addEventListener('click', () => show(idx - 1));
  $('.lightbox__next').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__fig')) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
  let sx = null, sy = null;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLb();
    sx = sy = null;
  }, { passive: true });

  /* ---------- Video ---------- */
  const vbtn = $('[data-video]');
  vbtn?.addEventListener('click', () => {
    const id = vbtn.dataset.video;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
    f.title = 'Stari Kotač — promo video';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen = true;
    vbtn.replaceWith(f);
  });

  /* ---------- Recenzije ---------- */
  const track = $('.reviews__track');
  const dots = $$('.reviews__dots i');
  const cards = $$('.review', track);
  const current = () => {
    const left = track.scrollLeft;
    let best = 0, bestD = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - track.offsetLeft - left - parseFloat(getComputedStyle(track).scrollPaddingLeft || 0));
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };
  const goTo = (i) => {
    const c = cards[(i + cards.length) % cards.length];
    const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft || 0);
    track.scrollTo({ left: c.offsetLeft - track.offsetLeft - pad, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  let dotTick = false;
  track.addEventListener('scroll', () => {
    if (dotTick) return;
    dotTick = true;
    requestAnimationFrame(() => {
      const c = current();
      dots.forEach((d, i) => d.classList.toggle('is-active', i === c));
      dotTick = false;
    });
  }, { passive: true });
  $('[data-rev="prev"]').addEventListener('click', () => { stopAuto(); goTo(current() - 1); });
  $('[data-rev="next"]').addEventListener('click', () => { stopAuto(); goTo(current() + 1); });
  let autoTimer = null, autoStopped = reduceMotion;
  const stopAuto = () => { autoStopped = true; clearInterval(autoTimer); };
  ['pointerdown', 'touchstart', 'wheel'].forEach((ev) => track.addEventListener(ev, stopAuto, { passive: true }));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      clearInterval(autoTimer);
      if (e.isIntersecting && !autoStopped) autoTimer = setInterval(() => goTo(current() + 1), 5500);
    }, { threshold: 0.5 }).observe(track);
  }

  /* ---------- Obrazac (mailto) ---------- */
  const form = $('.form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    let ok = true;
    $$('.field', form).forEach((f) => {
      const input = $('input, textarea', f);
      const bad = input.required && (!input.value.trim() || (input.type === 'email' && !input.checkValidity()));
      f.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    const msg = $('.form__msg', form);
    if (!ok) { msg.textContent = 'Molimo ispunite ime, ispravan e-mail i poruku.'; return; }
    const subject = data.get('naslov')?.trim() || 'Upit s web stranice';
    const body = `Ime: ${data.get('ime')}\nE-mail: ${data.get('email')}\n\n${data.get('poruka')}`;
    window.location.href = `mailto:starikotac1982@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    msg.textContent = 'Otvaramo vašu aplikaciju za e-poštu…';
  });

  onScroll();
})();
