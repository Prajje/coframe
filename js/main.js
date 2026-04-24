/* =========================================================
   Coframe Landing — Animations
   ========================================================= */

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Ink trail scroll progress ----------
  const inkFill = document.querySelector('.ink-fill');
  if (inkFill) {
    const updateInk = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      inkFill.style.height = `${Math.min(100, Math.max(0, pct))}%`;
    };
    window.addEventListener('scroll', updateInk, { passive: true });
    updateInk();
  }

  // ---------- Hero variation-grid canvas ----------
  // A subtle grid of micro-tiles cycling between a few states (greens pulse in/out
  // like A/B variants being tested). Nods to what Coframe does without being busy.
  const canvas = document.getElementById('variation-grid');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    let w, h, cols, rows, cells, lastMutate;
    const TILE = 56;
    const MUTATE_MS = 140;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / TILE) + 1;
      rows = Math.ceil(h / TILE) + 1;
    };

    const seed = () => {
      cells = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          cells.push({
            x, y,
            lit: 0,     // 0..1 target
            t: 0,       // 0..1 current (eased)
            life: 0,    // countdown frames
          });
        }
      }
    };

    const mutate = () => {
      // Light up a few random cells with short life; clear existing briefly.
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * cells.length);
        const c = cells[idx];
        c.lit = 1;
        c.life = 22 + Math.floor(Math.random() * 20);
      }
    };

    const draw = (now) => {
      ctx.clearRect(0, 0, w, h);
      // Mutate a few cells periodically
      if (!lastMutate || now - lastMutate > MUTATE_MS) {
        mutate();
        lastMutate = now;
      }

      for (const c of cells) {
        // Tick life
        if (c.life > 0) {
          c.life--;
          if (c.life === 0) c.lit = 0;
        }
        // Ease t toward lit
        c.t += (c.lit - c.t) * 0.14;
        if (c.t < 0.01 && c.lit === 0) continue;

        const px = c.x * TILE;
        const py = c.y * TILE;
        const alpha = c.t * 0.22;
        // Subtle filled tile
        ctx.fillStyle = `rgba(74, 227, 135, ${alpha})`;
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        // Thin outline
        if (c.t > 0.3) {
          ctx.strokeStyle = `rgba(74, 227, 135, ${c.t * 0.45})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
        }
      }
      requestAnimationFrame(draw);
    };

    const init = () => { resize(); seed(); requestAnimationFrame(draw); };
    init();
    window.addEventListener('resize', () => { resize(); seed(); });
  }

  // ---------- Observer-based in-view reveals (timeline) ----------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.node').forEach(n => io.observe(n));
  } else {
    document.querySelectorAll('.node').forEach(n => n.classList.add('in-view'));
  }

  // ---------- Metric count-up ----------
  const metricEls = document.querySelectorAll('.metric-value');
  if (metricEls.length && 'IntersectionObserver' in window) {
    const countUp = el => {
      const target = parseFloat(el.dataset.count || '0');
      const suffix = el.dataset.suffix || '';
      if (prefersReduced) { el.textContent = target + suffix; return; }
      const duration = 1400;
      const start = performance.now();
      const tick = now => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased * 10) / 10;
        const display = (target >= 10) ? Math.round(target * eased) : value;
        el.textContent = display + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(tick);
    };
    const mio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { countUp(e.target); mio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    metricEls.forEach(el => mio.observe(el));
  }

  // ---------- "Optimize the future." assemble animation ----------
  const assemble = document.querySelector('.assemble');
  if (assemble) {
    const text = assemble.dataset.text || assemble.textContent;
    assemble.innerHTML = '';
    const frag = document.createDocumentFragment();
    const spans = [];
    [...text].forEach(ch => {
      const span = document.createElement('span');
      span.className = 'letter-char';
      span.textContent = ch === ' ' ? ' ' : ch;
      if (!prefersReduced) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 240;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const rot = (Math.random() - 0.5) * 120;
        span.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      } else {
        span.style.opacity = 1;
      }
      frag.appendChild(span);
      spans.push(span);
    });
    assemble.appendChild(frag);

    if (!prefersReduced && window.gsap) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      window.gsap.to(spans, {
        x: 0, y: 0, rotate: 0, opacity: 1,
        duration: 1.1,
        ease: 'power4.out',
        stagger: { each: 0.025, from: 'random' },
        scrollTrigger: {
          trigger: '.closing',
          start: 'top 70%',
          once: true,
        }
      });
    } else {
      spans.forEach(s => { s.style.opacity = 1; s.style.transform = 'none'; });
    }
  }

  // ---------- Card hover tracking + attention stats ----------
  const cards = document.querySelectorAll('.cc-card[data-card-id]');
  const statsList = document.getElementById('stats-bars');
  if (cards.length && statsList) {
    const STORE_KEY = 'coframe-hover-stats';
    const ENGAGE_THRESHOLD_MS = 1500;

    const loadStats = () => {
      try {
        const raw = sessionStorage.getItem(STORE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (_) { return {}; }
    };
    const saveStats = (s) => {
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (_) {}
    };

    const totals = loadStats();
    const cardsById = new Map();
    cards.forEach(c => cardsById.set(c.dataset.cardId, c));

    const fmt = (ms) => {
      const s = ms / 1000;
      return s < 10 ? s.toFixed(1) + 's' : Math.round(s) + 's';
    };

    const renderStats = () => {
      const entries = [];
      cards.forEach(c => {
        entries.push({
          id: c.dataset.cardId,
          title: c.dataset.cardTitle,
          ms: totals[c.dataset.cardId] || 0,
        });
      });
      const max = Math.max(1, ...entries.map(e => e.ms));
      const hasAny = entries.some(e => e.ms > 0);
      entries.sort((a, b) => b.ms - a.ms);

      statsList.innerHTML = '';
      entries.forEach((e, i) => {
        const isLeader = hasAny && i === 0 && e.ms > 0;
        const pct = hasAny ? Math.max(4, (e.ms / max) * 100) : 0;
        const li = document.createElement('li');
        li.className = 'stats-row' + (isLeader ? ' leader' : '');
        li.innerHTML =
          '<div class="stats-title"><span class="stats-rank">' +
          String(i + 1).padStart(2, '0') +
          '</span>' + e.title + '</div>' +
          '<div class="stats-bar-wrap"><div class="stats-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="stats-value">' + (e.ms > 0 ? fmt(e.ms) : '—') + '</div>';
        statsList.appendChild(li);
      });
      statsList.classList.toggle('has-data', hasAny);

      // Engaged state: only the leader with ≥ threshold hover gets engaged.
      cards.forEach(c => c.classList.remove('engaged'));
      if (hasAny) {
        const top = entries[0];
        if (top.ms >= ENGAGE_THRESHOLD_MS) {
          const el = cardsById.get(top.id);
          if (el) el.classList.add('engaged');
        }
      }
    };

    // Per-card hover tracking with live dwell display
    cards.forEach(card => {
      const id = card.dataset.cardId;
      const dwellEl = card.querySelector('.tag-dwell');
      let hoverStart = null;
      let rafId = null;

      const tick = () => {
        if (hoverStart === null) return;
        const live = (totals[id] || 0) + (performance.now() - hoverStart);
        if (dwellEl) dwellEl.textContent = fmt(live);
        rafId = requestAnimationFrame(tick);
      };

      const begin = () => {
        if (hoverStart !== null) return;
        hoverStart = performance.now();
        card.classList.add('hovering');
        tick();
      };
      const end = () => {
        if (hoverStart === null) return;
        const delta = performance.now() - hoverStart;
        hoverStart = null;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        totals[id] = (totals[id] || 0) + delta;
        saveStats(totals);
        card.classList.remove('hovering');
        if (dwellEl) dwellEl.textContent = '';
        renderStats();
      };

      card.addEventListener('mouseenter', begin);
      card.addEventListener('mouseleave', end);
      // Touch: finger down = hover start, finger up = hover end
      card.addEventListener('touchstart', (ev) => { begin(); }, { passive: true });
      card.addEventListener('touchend', end);
      card.addEventListener('touchcancel', end);
    });

    // Commit in-flight hover if the user scrolls/navigates away
    window.addEventListener('beforeunload', () => {
      cards.forEach(c => {
        if (c.classList.contains('hovering')) {
          c.dispatchEvent(new MouseEvent('mouseleave'));
        }
      });
    });

    renderStats();
  }

  // ---------- Section attention tracking + Live Signal HUD ----------
  const sections = document.querySelectorAll('section[data-section]');
  const stack = document.getElementById('reorderable-stack');
  if (sections.length) {
    const SECTION_STORE = 'coframe-section-stats';
    const ORDER_STORE = 'coframe-layout-order';
    const REORDERABLE = ['metrics', 'experience', 'work', 'attention', 'skills', 'dear'];
    const ORIGINAL_ORDER = REORDERABLE.slice();

    const loadObj = (key) => {
      try { return JSON.parse(sessionStorage.getItem(key) || '{}'); } catch (_) { return {}; }
    };
    const saveObj = (key, v) => {
      try { sessionStorage.setItem(key, JSON.stringify(v)); } catch (_) {}
    };

    const sectionTotals = loadObj(SECTION_STORE);
    const layoutState = loadObj(ORDER_STORE); // { optimized: bool, order: [ids] }

    const sectionById = new Map();
    sections.forEach(s => sectionById.set(s.dataset.section, s));

    const fmtMs = (ms) => {
      const s = ms / 1000;
      if (s < 10) return s.toFixed(1) + 's';
      if (s < 60) return Math.round(s) + 's';
      const m = Math.floor(s / 60);
      return m + 'm' + String(Math.round(s % 60)).padStart(2, '0');
    };

    // ---- Build HUD ----
    const hud = document.createElement('div');
    hud.className = 'signal-hud';
    hud.setAttribute('aria-label', 'Live attention signal');
    hud.innerHTML =
      '<button class="hud-dot-btn" aria-label="Expand signal HUD"></button>' +
      '<div class="hud-header">' +
        '<span class="hud-title">Live Signal</span>' +
        '<div class="hud-controls">' +
          '<button class="hud-btn-icon" data-action="min" aria-label="Minimize">_</button>' +
          '<button class="hud-btn-icon" data-action="close" aria-label="Dismiss">×</button>' +
        '</div>' +
      '</div>' +
      '<div class="hud-body">' +
        '<ul class="hud-bars" id="hud-bars"></ul>' +
        '<div class="hud-cta-row">' +
          '<button class="hud-cta" id="hud-optimize">Optimize layout</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(hud);

    const toast = document.createElement('div');
    toast.className = 'signal-toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
    const showToast = (msg) => {
      toast.textContent = msg;
      toast.classList.add('visible');
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => toast.classList.remove('visible'), 2400);
    };

    const barsList = hud.querySelector('#hud-bars');
    const optimizeBtn = hud.querySelector('#hud-optimize');
    const dotBtn = hud.querySelector('.hud-dot-btn');

    // HUD appears after 3s unless dismissed
    if (sessionStorage.getItem('coframe-hud-dismissed') !== '1') {
      setTimeout(() => hud.classList.add('visible'), 3000);
    }
    hud.querySelector('[data-action="min"]').addEventListener('click', () => {
      hud.classList.add('minimized');
    });
    hud.querySelector('[data-action="close"]').addEventListener('click', () => {
      hud.classList.remove('visible');
      sessionStorage.setItem('coframe-hud-dismissed', '1');
    });
    dotBtn.addEventListener('click', () => hud.classList.remove('minimized'));

    // ---- Live dwell updater (while mouse is inside a section) ----
    let activeSection = null;
    let activeStart = null;

    const renderHUD = () => {
      const entries = [];
      sections.forEach(sec => {
        const id = sec.dataset.section;
        const base = sectionTotals[id] || 0;
        const live = (activeSection === id && activeStart !== null)
          ? (performance.now() - activeStart) : 0;
        entries.push({
          id,
          label: sec.dataset.sectionLabel || id,
          ms: base + live,
        });
      });
      const max = Math.max(1, ...entries.map(e => e.ms));
      entries.sort((a, b) => b.ms - a.ms);
      const hasAny = entries.some(e => e.ms > 0);

      barsList.innerHTML = '';
      entries.forEach((e, i) => {
        const pct = hasAny ? Math.max(2, (e.ms / max) * 100) : 0;
        const isLeader = hasAny && i === 0 && e.ms > 0;
        const li = document.createElement('li');
        li.className = 'hud-row' + (isLeader ? ' leader' : '');
        li.innerHTML =
          '<span class="hud-row-label">' + e.label + '</span>' +
          '<span class="hud-row-time">' + (e.ms > 0 ? fmtMs(e.ms) : '—') + '</span>' +
          '<span class="hud-row-track"><span class="hud-row-fill" style="width:' + pct + '%"></span></span>';
        barsList.appendChild(li);
      });
    };

    let rafHandle = null;
    const rafLoop = () => {
      renderHUD();
      rafHandle = requestAnimationFrame(rafLoop);
    };
    const startRaf = () => { if (!rafHandle) rafHandle = requestAnimationFrame(rafLoop); };
    const stopRaf = () => { if (rafHandle) { cancelAnimationFrame(rafHandle); rafHandle = null; } };

    sections.forEach(sec => {
      const id = sec.dataset.section;
      sec.addEventListener('mouseenter', () => {
        activeSection = id;
        activeStart = performance.now();
        startRaf();
      });
      sec.addEventListener('mouseleave', () => {
        if (activeSection === id && activeStart !== null) {
          const delta = performance.now() - activeStart;
          sectionTotals[id] = (sectionTotals[id] || 0) + delta;
          saveObj(SECTION_STORE, sectionTotals);
        }
        activeSection = null;
        activeStart = null;
        stopRaf();
        renderHUD();
      });
      // Touch fallback: a tap-hold on mobile counts as entering the section
      sec.addEventListener('touchstart', () => {
        activeSection = id;
        activeStart = performance.now();
        startRaf();
      }, { passive: true });
      sec.addEventListener('touchend', () => {
        if (activeSection === id && activeStart !== null) {
          sectionTotals[id] = (sectionTotals[id] || 0) + (performance.now() - activeStart);
          saveObj(SECTION_STORE, sectionTotals);
        }
        activeSection = null; activeStart = null; stopRaf(); renderHUD();
      });
    });

    // ---- Reorder logic ----
    const applyOrder = (order) => {
      if (!stack) return;
      order.forEach(id => {
        const el = sectionById.get(id);
        if (el && el.parentElement === stack) stack.appendChild(el);
      });
    };

    const optimizeLayout = () => {
      const weights = REORDERABLE.map(id => ({ id, ms: sectionTotals[id] || 0 }));
      weights.sort((a, b) => b.ms - a.ms);
      const newOrder = weights.map(w => w.id);

      const doReorder = () => {
        applyOrder(newOrder);
        layoutState.optimized = true;
        layoutState.order = newOrder;
        saveObj(ORDER_STORE, layoutState);
        optimizeBtn.textContent = 'Restore original';
        optimizeBtn.classList.add('secondary');
        showToast('Layout optimized for your attention ✓');
      };

      if (prefersReduced) { doReorder(); return; }
      stack.classList.add('reordering');
      setTimeout(() => {
        doReorder();
        requestAnimationFrame(() => stack.classList.remove('reordering'));
      }, 450);
    };

    const restoreLayout = () => {
      const doRestore = () => {
        applyOrder(ORIGINAL_ORDER);
        layoutState.optimized = false;
        layoutState.order = ORIGINAL_ORDER.slice();
        saveObj(ORDER_STORE, layoutState);
        optimizeBtn.textContent = 'Optimize layout';
        optimizeBtn.classList.remove('secondary');
        showToast('Layout restored');
      };
      if (prefersReduced) { doRestore(); return; }
      stack.classList.add('reordering');
      setTimeout(() => {
        doRestore();
        requestAnimationFrame(() => stack.classList.remove('reordering'));
      }, 450);
    };

    optimizeBtn.addEventListener('click', () => {
      if (layoutState.optimized) restoreLayout();
      else {
        // Require at least 1.5s total signal before allowing optimize
        const total = Object.values(sectionTotals).reduce((a, b) => a + b, 0);
        if (total < 1500) {
          showToast('Hover through the page first to build signal');
          return;
        }
        optimizeLayout();
      }
    });

    // Restore prior optimized order if the user had one this session
    if (layoutState.optimized && Array.isArray(layoutState.order)) {
      applyOrder(layoutState.order);
      optimizeBtn.textContent = 'Restore original';
      optimizeBtn.classList.add('secondary');
    }

    // Commit any in-flight section dwell on unload
    window.addEventListener('beforeunload', () => {
      if (activeSection && activeStart !== null) {
        sectionTotals[activeSection] = (sectionTotals[activeSection] || 0) + (performance.now() - activeStart);
        saveObj(SECTION_STORE, sectionTotals);
      }
    });

    renderHUD();
  }

  // ---------- GSAP niceties (parallax / fades) ----------
  if (window.gsap && window.ScrollTrigger && !prefersReduced) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    window.gsap.utils.toArray('.section-title').forEach(el => {
      window.gsap.from(el, {
        y: 40, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });

    window.gsap.utils.toArray('.cc-card').forEach((card, i) => {
      window.gsap.from(card, {
        y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', delay: (i % 2) * 0.08,
        scrollTrigger: { trigger: card, start: 'top 88%', once: true }
      });
    });

    window.gsap.utils.toArray('.pub').forEach(pub => {
      window.gsap.from(pub, {
        x: 30, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: pub, start: 'top 90%', once: true }
      });
    });

    window.gsap.utils.toArray('.skill-group').forEach(g => {
      window.gsap.from(g, {
        y: 20, opacity: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: g, start: 'top 92%', once: true }
      });
    });
  }

})();
