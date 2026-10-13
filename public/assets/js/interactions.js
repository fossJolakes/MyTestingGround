(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Header scroll state ---------------------------------------------
  const header = document.getElementById('header');
  const scrolledClasses = ['bg-ink/90', 'backdrop-blur-md', 'border-b', 'border-white/5', 'shadow-lg'];
  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add(...scrolledClasses);
    } else {
      header.classList.remove(...scrolledClasses);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Mobile menu toggle -------------------------------------------------
  const menuBtn = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('icon-open');
  const iconClose = document.getElementById('icon-close');

  const closeMenu = () => {
    mobileMenu.classList.add('hidden');
    iconOpen.classList.remove('hidden');
    iconClose.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
  };

  menuBtn.addEventListener('click', () => {
    const isOpen = !mobileMenu.classList.contains('hidden');
    if (isOpen) {
      closeMenu();
    } else {
      mobileMenu.classList.remove('hidden');
      iconOpen.classList.add('hidden');
      iconClose.classList.remove('hidden');
      menuBtn.setAttribute('aria-expanded', 'true');
    }
  });

  document.querySelectorAll('#mobile-menu a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // --- Contact form feedback (no backend wired up yet) ---------------------
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  const submitSpinner = document.getElementById('submit-spinner');
  const formFeedback = document.getElementById('form-feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitText.textContent = 'Sending...';
    submitSpinner.classList.remove('hidden');
    formFeedback.classList.add('hidden');

    setTimeout(() => {
      submitSpinner.classList.add('hidden');
      submitText.textContent = 'Send Message';
      submitBtn.disabled = false;
      formFeedback.textContent = "Thanks — we've received your message and will reply within one business day.";
      formFeedback.classList.remove('hidden');
      formFeedback.classList.add('text-accent-cyan');
      form.reset();
      setTimeout(() => formFeedback.classList.add('hidden'), 6000);
    }, 1200);
  });

  // --- Footer year ---------------------------------------------------------
  document.getElementById('year').textContent = new Date().getFullYear();

  // --- 3D cursor tilt on cards ----------------------------------------------
  function initTiltCards() {
    if (reduceMotion) return;
    const cards = document.querySelectorAll('.tilt-card');
    const maxTilt = 8; // degrees

    cards.forEach((card) => {
      let rect = null;

      card.addEventListener('mouseenter', () => {
        rect = card.getBoundingClientRect();
        card.style.transition = 'transform 0.1s ease-out';
      });

      card.addEventListener('mousemove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * maxTilt * 2;
        const rotateX = (0.5 - py) * maxTilt * 2;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(12px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.4s ease';
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        rect = null;
      });
    });
  }

  // --- Scroll-triggered 3D reveal animations --------------------------------
  // Only hides elements once GSAP/ScrollTrigger are confirmed loaded, so a
  // blocked or failed CDN script never leaves content permanently invisible.
  function initScrollReveals() {
    const items = document.querySelectorAll('.reveal-3d');
    if (!items.length) return;

    if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
      return; // elements are visible by default CSS state — nothing to do
    }

    gsap.registerPlugin(ScrollTrigger);
    items.forEach((el) => {
      gsap.set(el, { opacity: 0, y: 36, rotateX: -10, transformPerspective: 800 });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      });
    });
  }

  initTiltCards();
  initScrollReveals();
})();
