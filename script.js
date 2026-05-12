/* ── Scroll Progress Bar ── */
const scrollBar = document.createElement('div');
scrollBar.className = 'scroll-progress';
document.body.prepend(scrollBar);

/* ── Lenis Smooth Scroll ── */
let lenis;
function initLenis() {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 2,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ({ progress }) => {
    scrollBar.style.width = progress * 100 + '%';
  });
}

/* ── GSAP Plugin Registration ── */
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ============================================================
   PRELOADER
   ============================================================ */
function initPreloader() {
  const fill = document.querySelector('.preloader-fill');
  const percent = document.querySelector('.preloader-percent');
  const loader = document.getElementById('preloader');

  /* Ensure preloader starts fully visible — no flash */
  gsap.set(loader, { opacity: 1 });

  let prog = 0;
  const interval = setInterval(() => {
    prog += Math.random() * 18 + 4;
    if (prog >= 100) { prog = 100; clearInterval(interval); }
    fill.style.width = prog + '%';
    percent.textContent = Math.floor(prog) + '%';

    if (prog === 100) {
      /* Small pause at 100% so user sees it complete */
      setTimeout(() => {
        gsap.to(loader, {
          opacity: 0,
          duration: 0.7,
          ease: 'power2.inOut',
          onComplete: () => {
            /* Hard-hide so it can never interfere with layout */
            loader.style.display = 'none';
            /* Now reveal content and start all animations */
            initAfterLoad();
          }
        });
      }, 350);
    }
  }, 75);
}

/* ── Run after preloader hides ── */
function initAfterLoad() {
  /* 1. Remove loading lock — make all sections visible instantly (no flash,
        because hero children are still opacity:0 via their own CSS rule) */
  document.body.classList.remove('is-loading');

  /* 2. Force a single reflow so the browser paints the revealed layout
        before GSAP sets any fromTo start states */
  document.body.getBoundingClientRect();

  /* 3. Fade in the navbar subtly */
  gsap.fromTo('#navbar', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });

  /* 4. Fade in the scroll progress bar */
  gsap.fromTo('.scroll-progress', { opacity: 0 }, { opacity: 1, duration: 0.4 });

  /* 5. Boot Lenis FIRST so ScrollTrigger can attach to it correctly */
  initLenis();

  /* 6. Now safe to register all ScrollTrigger-based scroll animations */
  initScrollAnimations();
  initStatCounters();
  initTimeline();

  /* 7. Hero entrance animations (elements are opacity:0 in CSS, GSAP reveals them) */
  initHeroAnimations();

  /* 8. Everything else */
  heroParticles();
  initSkillBars();
  initTestimonials();
  initContactForm();
  initNavHighlight();
  animateCodeBlock();
  initGlowPulse();
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
(function initCursor() {
  const outer = document.getElementById('cursorOuter');
  const inner = document.getElementById('cursorInner');
  let mx = 0, my = 0, ox = 0, oy = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    gsap.to(inner, { x: mx, y: my, duration: 0.1, ease: 'power1.out' });
  });

  function animateOuter() {
    ox += (mx - ox) * 0.12;
    oy += (my - oy) * 0.12;
    gsap.set(outer, { x: ox, y: oy });
    requestAnimationFrame(animateOuter);
  }
  animateOuter();

  const hoverTargets = document.querySelectorAll(
    'a, button, .skill-card, .service-card, .project-card, .social-card, .filter-btn, .testi-nav-btn, .testi-dot, .back-to-top'
  );
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => outer.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => outer.classList.remove('cursor-hover'));
  });

  document.addEventListener('mouseleave', () => {
    gsap.to([outer, inner], { opacity: 0, duration: 0.3 });
  });
  document.addEventListener('mouseenter', () => {
    gsap.to([outer, inner], { opacity: 1, duration: 0.3 });
  });
})();

/* ============================================================
   NAVBAR
   ============================================================ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileMenuClose');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  function openMenu() {
    mobileMenu.classList.add('open');
    hamburger.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
  }
  hamburger.addEventListener('click', openMenu);
  mobileClose.addEventListener('click', closeMenu);
  mobileLinks.forEach(l => l.addEventListener('click', closeMenu));

  document.getElementById('backToTop').addEventListener('click', () => {
    lenis ? lenis.scrollTo(0, { duration: 1.5 }) : window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ── Active Nav Link on Scroll ── */
function initNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + entry.target.id) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { threshold: 0.35 }
  );
  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   PARTICLE CANVAS
   ============================================================ */
function heroParticles() {
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: null, y: null };

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.5 + 0.15;
      this.color = Math.random() > 0.5 ? '#6366f1' : '#8b5cf6';
    }
    update() {
      if (mouse.x !== null) {
        const dx = mouse.x - this.x, dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          this.vx -= dx / dist * 0.5;
          this.vy -= dy / dist * 0.5;
        }
      }
      this.vx *= 0.98; this.vy *= 0.98;
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  const COUNT = Math.min(120, Math.floor(W * H / 8000));
  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#6366f1';
          ctx.globalAlpha = (1 - d / 100) * 0.12;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(loop);
  }
  loop();
}

/* ============================================================
   HERO ANIMATIONS
   ============================================================ */
function initHeroAnimations() {
  /* Elements already start at opacity:0 via CSS, so we use gsap.set() for
     positional start states then animate TO the final position.
     This eliminates any fromTo flash where the element briefly shows
     at full opacity before GSAP resets it. */

  gsap.set('.hero-badge', { y: 30 });
  gsap.set('.hero-greeting', { y: 20 });
  gsap.set('.name-char', { y: 80, rotateX: -40 });
  gsap.set('.hero-title-wrap', { y: 20 });
  gsap.set('.hero-desc', { y: 20 });
  gsap.set('.hero-cta-group', { y: 20 });
  gsap.set('.hero-socials', { y: 20 });
  gsap.set('.hero-scroll-indicator', { opacity: 0 });
  gsap.set('.hero-code-block', { x: 40 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to('.hero-badge', { y: 0, opacity: 1, duration: 0.7 }, 0.2)
    .to('.hero-greeting', { y: 0, opacity: 1, duration: 0.5 }, 0.4)
    .to('.name-char', { y: 0, opacity: 1, rotateX: 0, duration: 0.7, stagger: 0.06 }, 0.6)
    .to('.hero-title-wrap', { y: 0, opacity: 1, duration: 0.6 }, 1.2)
    .to('.hero-desc', { y: 0, opacity: 1, duration: 0.6 }, 1.4)
    .to('.hero-cta-group', { y: 0, opacity: 1, duration: 0.6 }, 1.6)
    .to('.hero-socials', { y: 0, opacity: 1, duration: 0.5 }, 1.75)
    .to('.hero-scroll-indicator', { opacity: 1, duration: 0.6 }, 2.0)
    .to('.hero-code-block', { x: 0, opacity: 1, duration: 0.8 }, 1.2);

  /* Typed effect */
  const words = ['Frontend Developer', 'Creative Designer', 'UI/UX Enthusiast', 'Animation Expert', 'Web Architect'];
  let wi = 0, ci = 0, deleting = false;
  const el = document.getElementById('typedText');

  function type() {
    const word = words[wi];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(type, 2200); return; }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; setTimeout(type, 400); return; }
    }
    setTimeout(type, deleting ? 60 : 90);
  }
  setTimeout(type, 2400);
}

/* ============================================================
   SCROLL ANIMATIONS (ScrollTrigger)
   ============================================================ */
function initScrollAnimations() {
  /* Helper: set initial hidden state then animate on scroll.
     Using gsap.set() before creating the ScrollTrigger means the browser
     renders the element hidden from the very first paint — no flash. */
  function revealOnScroll(targets, fromVars, toVars, triggerEl, startPos) {
    gsap.set(targets, fromVars);
    gsap.to(targets, {
      ...toVars,
      scrollTrigger: {
        trigger: triggerEl || targets,
        start: startPos || 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  }

  /* ── Section Headers ── */
  gsap.utils.toArray('.section-header').forEach(header => {
    gsap.set(header, { y: 40, opacity: 0 });
    gsap.to(header, {
      y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: header, start: 'top 88%', toggleActions: 'play none none none' }
    });
  });

  /* ── About Grid ── */
  gsap.set('.about-image-col', { x: -60, opacity: 0 });
  gsap.to('.about-image-col', {
    x: 0, opacity: 1, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.about-grid', start: 'top 80%' }
  });
  gsap.set('.about-content-col', { x: 60, opacity: 0 });
  gsap.to('.about-content-col', {
    x: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.15,
    scrollTrigger: { trigger: '.about-grid', start: 'top 80%' }
  });

  /* ── Stat Cards ── */
  gsap.set('.stat-card', { y: 40, opacity: 0 });
  gsap.to('.stat-card', {
    y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.stats-row', start: 'top 85%' }
  });

  /* ── Skill Cards ── */
  gsap.set('.skill-card', { y: 50, opacity: 0, scale: 0.94 });
  gsap.to('.skill-card', {
    y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.skills-grid', start: 'top 82%' }
  });

  /* ── Skill Bar Fills ── */
  ScrollTrigger.create({
    trigger: '.skills-grid', start: 'top 80%',
    onEnter: () => initSkillBars()
  });

  /* ── Project Cards ── */
  gsap.set('.project-card', { y: 60, opacity: 0 });
  gsap.to('.project-card', {
    y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.projects-grid', start: 'top 82%' }
  });

  /* ── Service Cards ── */
  gsap.set('.service-card', { y: 50, opacity: 0 });
  gsap.to('.service-card', {
    y: 0, opacity: 1, duration: 0.75, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.services-grid', start: 'top 82%' }
  });

  /* ── Social Cards ── */
  gsap.set('.social-card', { x: -30, opacity: 0 });
  gsap.to('.social-card', {
    x: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.social-grid', start: 'top 82%' }
  });

  /* ── Timeline Items ── */
  gsap.utils.toArray('.timeline-item').forEach(item => {
    const isLeft = item.classList.contains('timeline-left');
    gsap.set(item, { x: isLeft ? -50 : 50, opacity: 0 });
    gsap.to(item, {
      x: 0, opacity: 1, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 85%' }
    });
  });

  /* ── Testimonials ── */
  gsap.set('.testimonials-wrapper', { y: 40, opacity: 0 });
  gsap.to('.testimonials-wrapper', {
    y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.testimonials-wrapper', start: 'top 82%' }
  });

  /* ── Contact Section ── */
  gsap.set('.contact-info-col', { x: -50, opacity: 0 });
  gsap.to('.contact-info-col', {
    x: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.contact-grid', start: 'top 82%' }
  });
  gsap.set('.contact-form-col', { x: 50, opacity: 0 });
  gsap.to('.contact-form-col', {
    x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.15,
    scrollTrigger: { trigger: '.contact-grid', start: 'top 82%' }
  });

  /* ── Parallax on floating shapes ── */
  gsap.to('.shape-1', {
    y: -80, ease: 'none',
    scrollTrigger: { trigger: '.hero-section', scrub: 1.5 }
  });
  gsap.to('.shape-2', {
    y: -50, ease: 'none',
    scrollTrigger: { trigger: '.hero-section', scrub: 2 }
  });

  /* ── Footer ── */
  gsap.set('.footer-top', { y: 40, opacity: 0 });
  gsap.to('.footer-top', {
    y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.footer', start: 'top 88%' }
  });
}

/* ============================================================
   SKILL BARS
   ============================================================ */
function initSkillBars() {
  document.querySelectorAll('.skill-bar').forEach(bar => {
    const fill = bar.querySelector('.skill-bar-fill');
    const width = bar.getAttribute('data-width');
    if (!fill.style.width || fill.style.width === '0%') {
      gsap.to(fill, { width: width + '%', duration: 1.4, ease: 'power3.out', delay: 0.2 });
    }
  });
}

/* ============================================================
   STAT COUNTERS
   ============================================================ */
function initStatCounters() {
  ScrollTrigger.create({
    trigger: '.stats-row', start: 'top 85%',
    onEnter: () => {
      document.querySelectorAll('.stat-number').forEach(el => {
        const target = parseInt(el.getAttribute('data-target'));
        gsap.fromTo(el, { innerText: 0 }, {
          innerText: target, duration: 2, ease: 'power2.out',
          snap: { innerText: 1 },
          onUpdate() { el.textContent = Math.floor(parseFloat(el.innerText)); }
        });
      });
    }
  });
}

/* ============================================================
   TIMELINE LINE FILL
   ============================================================ */
function initTimeline() {
  ScrollTrigger.create({
    trigger: '.timeline', start: 'top 85%', end: 'bottom 20%',
    scrub: 0.5,
    onUpdate(self) {
      const fill = document.getElementById('timelineFill');
      if (fill) fill.style.height = self.progress * 100 + '%';
    }
  });
}

/* ============================================================
   CARD TILT EFFECT
   ============================================================ */
function initTiltEffect() {
  const cards = document.querySelectorAll('[data-tilt]');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotY = dx * 8;
      const rotX = -dy * 8;

      gsap.to(card, {
        rotateX: rotX, rotateY: rotY, scale: 1.02,
        transformPerspective: 700,
        duration: 0.4, ease: 'power2.out'
      });

      /* Glow follow */
      const glow = card.querySelector('.skill-glow, .service-glow');
      if (glow) {
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        glow.style.setProperty('--mx', px + '%');
        glow.style.setProperty('--my', py + '%');
      }
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.5, ease: 'power2.out' });
    });
  });
}

/* ============================================================
   PROJECT FILTER
   ============================================================ */
function initProjectFilter() {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const show = filter === 'all' || cat === filter;

        if (show) {
          card.classList.remove('hidden');
          gsap.fromTo(card, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' });
        } else {
          gsap.to(card, {
            scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.in',
            onComplete: () => card.classList.add('hidden')
          });
        }
      });
    });
  });
}

/* ============================================================
   TESTIMONIALS SLIDER
   ============================================================ */
function initTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  const cards = document.querySelectorAll('.testimonial-card');
  const dotsEl = document.getElementById('testiDots');
  const prev = document.getElementById('testiPrev');
  const next = document.getElementById('testiNext');
  let current = 0;
  let autoTimer;

  /* Build dots */
  cards.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'testi-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(d);
  });

  function goTo(idx) {
    current = (idx + cards.length) % cards.length;
    gsap.to(track, { x: -current * 100 + '%', duration: 0.65, ease: 'power3.inOut' });
    dotsEl.querySelectorAll('.testi-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function startAuto() { autoTimer = setInterval(() => goTo(current + 1), 5000); }
  function stopAuto() { clearInterval(autoTimer); }

  prev.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
  next.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
  startAuto();

  /* Touch/swipe */
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stopAuto(); });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
    startAuto();
  });
}

/* ============================================================
   MAGNETIC BUTTONS
   ============================================================ */
function initMagneticButtons() {
  document.querySelectorAll('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.28;
      const dy = (e.clientY - cy) * 0.28;
      gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const originalContent = btn.innerHTML;

    gsap.to(btn, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Sending...</span>';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check"></i><span>Message Sent!</span>';
      btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      showToast('Message sent successfully! I\'ll respond within 24 hours. ✨');
      form.reset();

      setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }, 2000);
  });

  /* Input focus animations */
  document.querySelectorAll('.input-wrap input, .input-wrap textarea').forEach(input => {
    const label = input.closest('.form-group').querySelector('label');
    input.addEventListener('focus', () => {
      gsap.to(label, { color: '#6366f1', duration: 0.3 });
    });
    input.addEventListener('blur', () => {
      gsap.to(label, { color: '', duration: 0.3 });
    });
  });
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fas fa-check-circle"></i><span>${msg}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ============================================================
   MOUSE-REACTIVE HERO GLOW
   ============================================================ */
(function initHeroMouseGlow() {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;
  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    hero.style.setProperty('--mx', x + '%');
    hero.style.setProperty('--my', y + '%');
  });
})();

/* ============================================================
   SCROLL-TRIGGERED TEXT SPLIT REVEAL (Section Titles)
   NOTE: section-title is already covered by the .section-header
   animation above (parent covers child). This function is kept
   as a no-op to avoid double-animation conflicts.
   ============================================================ */
function initTextReveal() { /* handled inside initScrollAnimations via .section-header */ }

/* ============================================================
   FLOATING CODE BLOCK ANIMATION
   Called from initAfterLoad so it only runs post-preloader.
   ============================================================ */
function animateCodeBlock() {
  const block = document.querySelector('.hero-code-block');
  if (!block) return;
  gsap.to(block, {
    y: -12, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut'
  });
}

/* ============================================================
   SECTION SEPARATOR GLOW PULSE
   Called from initAfterLoad so it only runs post-preloader.
   ============================================================ */
function initGlowPulse() {
  gsap.to('.footer-glow', {
    opacity: 0.6, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut'
  });
}

/* ============================================================
   SMOOTH ANCHOR LINKS
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    lenis
      ? lenis.scrollTo(target, { offset: -70, duration: 1.4 })
      : target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ============================================================
   SERVICE CARD 3D HOVER
   ============================================================ */
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const glow = card.querySelector('.service-glow');
    if (glow) { glow.style.setProperty('--mx', px + '%'); glow.style.setProperty('--my', py + '%'); }
  });
});

/* ============================================================
   LAZY LOAD (Intersection Observer for images/heavy items)
   ============================================================ */
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      lazyObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.project-card, .service-card, .social-card').forEach(el => {
  lazyObserver.observe(el);
});

/* ============================================================
   INIT ON DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  /* Lock body with is-loading so all content stays invisible */
  document.body.classList.add('is-loading');

  /* Initial cursor position off-screen */
  gsap.set(['#cursorOuter', '#cursorInner'], { x: -100, y: -100 });

  initPreloader();
});

/* ── Handle resize ── */
window.addEventListener('resize', () => {
  ScrollTrigger.refresh();
});
