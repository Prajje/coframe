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
