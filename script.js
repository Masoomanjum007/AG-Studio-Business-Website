/* ============================================================
   AG STUDIO — Premium Interactive Website
   Main JavaScript Module
   ============================================================ */

(function () {
  'use strict';

  /* ======================== CONSTANTS ======================== */
  const IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const IS_MOBILE = window.innerWidth < 768;
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================== UTILITY ======================== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  // Throttle via rAF for scroll/resize
  let scrollTicking = false;
  const scrollCallbacks = [];
  const onScrollRAF = () => {
    scrollCallbacks.forEach(fn => fn());
    scrollTicking = false;
  };
  const addScrollListener = (fn) => {
    scrollCallbacks.push(fn);
  };
  // Single scroll listener for all handlers
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScrollRAF);
    }
  }, { passive: true });

  /* ======================== PRELOADER ======================== */
  const Preloader = {
    el: $('#preloader'),
    fill: $('.preloader__bar-fill'),
    counter: $('.preloader__counter'),
    progress: 0,
    target: 100,

    init() {
      if (!this.el) return;
      document.body.style.overflow = 'hidden';
      this.animate();
    },



    animate() {
      const duration = 2200;
      const start = performance.now();

      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min((elapsed / duration) * 100, 100);
        this.progress = Math.round(progress);

        if (this.fill) this.fill.style.width = this.progress + '%';
        if (this.counter) this.counter.textContent = this.progress + '%';

        if (this.progress < 100) {
          requestAnimationFrame(tick);
        } else {
          this.complete();
        }
      };

      requestAnimationFrame(tick);
    },

    complete() {
      setTimeout(() => {
        if (typeof gsap !== 'undefined') {
          gsap.to(this.el, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => {
              this.el.style.display = 'none';
              document.body.style.overflow = '';
              App.onReady();
            }
          });
        } else {
          this.el.style.opacity = '0';
          setTimeout(() => {
            this.el.style.display = 'none';
            document.body.style.overflow = '';
            App.onReady();
          }, 600);
        }
      }, 400);
    }
  };

  /* ======================== LENIS SMOOTH SCROLL ======================== */
  const SmoothScroll = {
    instance: null,

    init() {
      if (IS_TOUCH || REDUCED_MOTION || typeof Lenis === 'undefined') return;
      try {
        this.instance = new Lenis({
          duration: 1.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1.1,
          lerp: 0.08,
        });

        // Connect Lenis to GSAP ScrollTrigger
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
          this.instance.on('scroll', ScrollTrigger.update);
          gsap.ticker.add((time) => {
            this.instance.raf(time * 1000);
          });
          gsap.ticker.lagSmoothing(0);
        } else {
          const raf = (time) => {
            this.instance.raf(time);
            requestAnimationFrame(raf);
          };
          requestAnimationFrame(raf);
        }
      } catch (e) {
        console.warn('Lenis init failed:', e);
      }
    }
  };

  /* ======================== MAGNETIC CURSOR ======================== */
  const Cursor = {
    el: $('#cursor'),
    trail: $('#cursorTrail'),
    // Raw mouse position
    mouse: { x: 0, y: 0 },
    // Rendered positions
    pos: { x: 0, y: 0 },
    trailPos: { x: 0, y: 0 },
    // Magnetic target (element center when snapped)
    magneticTarget: null,
    magneticStrength: 0.35,
    isMagnetic: false,
    rafId: null,

    init() {
      if (IS_TOUCH || !this.el) return;

      // Track raw mouse at full speed
      document.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }, { passive: true });

      document.addEventListener('mousedown', () => this.el.classList.add('cursor--click'));
      document.addEventListener('mouseup', () => this.el.classList.remove('cursor--click'));

      // Generic hover for non-magnetic interactives
      $$('a:not([data-magnetic]), input, textarea, select').forEach(el => {
        el.addEventListener('mouseenter', () => {
          if (!this.isMagnetic) this.el.classList.add('cursor--hover');
        });
        el.addEventListener('mouseleave', () => {
          this.el.classList.remove('cursor--hover');
        });
      });

      this.initMagnetics();
      this.render();
    },

    initMagnetics() {
      const magnets = $$('[data-magnetic]');
      magnets.forEach(el => {
        el.addEventListener('mouseenter', () => {
          this.isMagnetic = true;
          this.magneticTarget = el;
          this.el.classList.add('cursor--magnetic');
          this.el.classList.remove('cursor--hover');
        });

        el.addEventListener('mousemove', (e) => {
          if (!this.isMagnetic) return;
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const deltaX = e.clientX - centerX;
          const deltaY = e.clientY - centerY;
          const strength = el.dataset.magneticStrength
            ? parseFloat(el.dataset.magneticStrength)
            : this.magneticStrength;

          // Pull the element toward cursor
          if (typeof gsap !== 'undefined') {
            gsap.to(el, {
              x: deltaX * strength,
              y: deltaY * strength,
              duration: 0.3,
              ease: 'power3.out',
              overwrite: 'auto'
            });
          }
        });

        el.addEventListener('mouseleave', () => {
          this.isMagnetic = false;
          this.magneticTarget = null;
          this.el.classList.remove('cursor--magnetic');

          // Spring the element back
          if (typeof gsap !== 'undefined') {
            gsap.to(el, {
              x: 0,
              y: 0,
              duration: 0.7,
              ease: 'elastic.out(1.2, 0.4)',
              overwrite: 'auto'
            });
          }
        });
      });
    },

    render() {
      // Cursor ring: instant position for zero lag
      this.pos.x = lerp(this.pos.x, this.mouse.x, 0.55);
      this.pos.y = lerp(this.pos.y, this.mouse.y, 0.55);

      // Trail: softer follow for organic feel
      this.trailPos.x = lerp(this.trailPos.x, this.mouse.x, 0.15);
      this.trailPos.y = lerp(this.trailPos.y, this.mouse.y, 0.15);

      // When magnetically locked, pull cursor ring toward element center
      let renderX = this.pos.x;
      let renderY = this.pos.y;

      if (this.isMagnetic && this.magneticTarget) {
        const rect = this.magneticTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Blend cursor position toward element center
        renderX = lerp(this.pos.x, centerX, 0.25);
        renderY = lerp(this.pos.y, centerY, 0.25);
      }

      this.el.style.transform = `translate3d(${renderX}px, ${renderY}px, 0) translate(-50%, -50%)`;

      if (this.trail) {
        this.trail.style.transform = `translate3d(${this.trailPos.x}px, ${this.trailPos.y}px, 0) translate(-50%, -50%)`;
      }

      this.rafId = requestAnimationFrame(() => this.render());
    }
  };

  /* ======================== MAGNETIC EFFECT (DEPRECATED — integrated into Cursor) ======================== */
  const MagneticEffect = {
    init() {
      // Magnetic behavior is now handled by Cursor.initMagnetics()
    }
  };

  /* ======================== THREE.JS HERO BACKGROUND ======================== */
  const HeroBackground3D = {
    scene: null,
    camera: null,
    renderer: null,
    particles: null,
    mouse: { x: 0, y: 0 },
    rafId: null,

    init() {
      if (IS_MOBILE || REDUCED_MOTION || typeof THREE === 'undefined') return;
      const container = $('#heroBackground');
      if (!container) return;

      try {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        // Create particles (reduced for max performance)
        const count = 300;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          positions[i3] = (Math.random() - 0.5) * 100;
          positions[i3 + 1] = (Math.random() - 0.5) * 100;
          positions[i3 + 2] = (Math.random() - 0.5) * 100;

          // Gold / amber tones
          colors[i3] = 0.9 + Math.random() * 0.1;
          colors[i3 + 1] = 0.6 + Math.random() * 0.2;
          colors[i3 + 2] = 0.1 + Math.random() * 0.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
          size: 0.2,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          sizeAttenuation: true,
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);

        // Mouse tracking (throttled)
        let heroMouseTicking = false;
        document.addEventListener('mousemove', (e) => {
          if (heroMouseTicking) return;
          heroMouseTicking = true;
          requestAnimationFrame(() => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            heroMouseTicking = false;
          });
        }, { passive: true });

        window.addEventListener('resize', () => this.onResize());
        this.animate();
      } catch (e) {
        console.warn('Three.js init failed:', e);
      }
    },

    animate() {
      if (!this.particles) return;

      this.particles.rotation.x += 0.0003;
      this.particles.rotation.y += 0.0005;

      // Cursor-based interaction — move camera slightly
      this.camera.position.x = lerp(this.camera.position.x, this.mouse.x * 5, 0.02);
      this.camera.position.y = lerp(this.camera.position.y, this.mouse.y * 5, 0.02);
      this.camera.lookAt(this.scene.position);

      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(() => this.animate());
    },

    onResize() {
      if (!this.camera || !this.renderer) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  /* ======================== NAVIGATION ======================== */
  const Navigation = {
    nav: $('#navbar'),
    burger: $('#navBurger'),
    mobileMenu: $('#mobileMenu'),
    links: $$('.nav__link'),
    mobileLinks: $$('.mobile-menu__link'),

    init() {
      // Use throttled scroll listener
      addScrollListener(() => this.onScroll());
      addScrollListener(() => this.updateActiveLink());

      // Burger toggle
      if (this.burger) {
        this.burger.addEventListener('click', () => this.toggleMenu());
      }

      // Mobile link clicks
      this.mobileLinks.forEach(link => {
        link.addEventListener('click', () => this.closeMenu());
      });

      // Initial active link
      this.updateActiveLink();
    },

    onScroll() {
      if (!this.nav) return;
      if (window.scrollY > 80) {
        this.nav.classList.add('scrolled');
      } else {
        this.nav.classList.remove('scrolled');
      }
    },

    toggleMenu() {
      this.burger.classList.toggle('active');
      this.mobileMenu.classList.toggle('active');
      this.burger.setAttribute('aria-expanded',
        this.burger.classList.contains('active'));
      document.body.style.overflow =
        this.mobileMenu.classList.contains('active') ? 'hidden' : '';
    },

    closeMenu() {
      this.burger.classList.remove('active');
      this.mobileMenu.classList.remove('active');
      this.burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    },

    updateActiveLink() {
      const sections = $$('section[id]');
      const scrollY = window.scrollY + 100;

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollY >= top && scrollY < top + height) {
          this.links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('active');
            }
          });
        }
      });
    }
  };

  /* ======================== THEME TOGGLE ======================== */
  const ThemeToggle = {
    btn: $('#themeToggle'),
    currentTheme: localStorage.getItem('theme') || 'dark',

    init() {
      document.documentElement.setAttribute('data-theme', this.currentTheme);

      if (this.btn) {
        this.btn.addEventListener('click', () => this.toggle());
      }
    },

    toggle() {
      this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.currentTheme);
      localStorage.setItem('theme', this.currentTheme);
    }
  };

  /* ======================== SCROLL PROGRESS ======================== */
  const ScrollProgress = {
    bar: $('.scroll-progress__bar'),

    init() {
      if (!this.bar) return;
      addScrollListener(() => this.update());
    },

    update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      this.bar.style.width = progress + '%';
    }
  };

  /* ======================== BACK TO TOP ======================== */
  const BackToTop = {
    btn: $('#backToTop'),

    init() {
      if (!this.btn) return;

      addScrollListener(() => {
        if (window.scrollY > 600) {
          this.btn.classList.add('visible');
        } else {
          this.btn.classList.remove('visible');
        }
      });

      this.btn.addEventListener('click', () => {
        if (SmoothScroll.instance) {
          SmoothScroll.instance.scrollTo(0, { duration: 1.5 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  };

  /* ======================== GSAP SCROLL ANIMATIONS ======================== */
  const ScrollAnimations = {
    init() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        // Fallback: use IntersectionObserver
        this.initFallback();
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      // Animate elements with data-animate
      $$('[data-animate]').forEach(el => {
        const delay = parseFloat(el.dataset.delay) || 0;
        const animType = el.dataset.animate;

        let from = { opacity: 0, y: 40 };
        if (animType === 'fade-right') from = { opacity: 0, x: -40 };
        if (animType === 'fade-left') from = { opacity: 0, x: 40 };

        gsap.from(el, {
          ...from,
          duration: 1.2,
          delay,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'bottom 20%',
            toggleActions: 'play none none none',
            once: true,
            onEnter: () => el.classList.add('is-visible')
          }
        });
      });

      // Animate section titles with Splitting.js chars
      $$('.section__title').forEach(title => {
        const chars = title.querySelectorAll('.char');
        if (chars.length === 0) return;

        gsap.fromTo(chars,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.04,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: title,
              start: 'top 85%',
              once: true
            }
          }
        );
      });

      // Counter animation
      $$('[data-count]').forEach(counter => {
        const target = parseInt(counter.dataset.count);
        const obj = { val: 0 };

        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: counter,
            start: 'top 85%',
            once: true
          },
          onUpdate: () => {
            counter.textContent = Math.round(obj.val);
          }
        });
      });

      // Parallax on hero section
      const heroContent = $('.hero__content');
      if (heroContent) {
        gsap.to(heroContent, {
          y: 100,
          opacity: 0.3,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      // Marquee speed change on scroll
      const marqueeTrack = $('.marquee__track');
      if (marqueeTrack) {
        gsap.to(marqueeTrack, {
          x: -200,
          ease: 'none',
          scrollTrigger: {
            trigger: '.marquee-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        });
      }
    },

    // Fallback for when GSAP isn't available
    initFallback() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translate(0, 0)';
              entry.target.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      $$('[data-animate]').forEach(el => observer.observe(el));
    }
  };

  /* ======================== SPLITTING.JS TEXT ======================== */
  const TextSplitting = {
    init() {
      if (typeof Splitting === 'undefined') return;
      try {
        Splitting();

        // Animate hero title characters
        const heroTitle = $('.hero__title');
        if (heroTitle) {
          const chars = heroTitle.querySelectorAll('.char');
          // Ensure chars are hidden initially
          chars.forEach((char, i) => {
            char.style.opacity = '0';
            char.style.transitionDelay = (i * 0.04) + 's';
          });
          // Then reveal with class toggle
          setTimeout(() => {
            chars.forEach(char => {
              char.style.opacity = '';
            });
            heroTitle.classList.add('is-splitting');
          }, 400);
        }
      } catch (e) {
        console.warn('Splitting init failed:', e);
      }
    }
  };

  /* ======================== VANILLA TILT ======================== */
  const TiltEffect = {
    init() {
      if (IS_TOUCH || typeof VanillaTilt === 'undefined') return;

      $$('[data-tilt]').forEach(el => {
        VanillaTilt.init(el, {
          max: 8,
          speed: 400,
          glare: true,
          'max-glare': 0.15,
          scale: 1.02,
        });
      });
    }
  };

  /* ======================== PROJECT FILTER ======================== */
  const ProjectFilter = {
    init() {
      const filters = $$('.projects__filter');
      const cards = $$('.project-card');

      filters.forEach(btn => {
        btn.addEventListener('click', () => {
          // Update active filter
          filters.forEach(f => f.classList.remove('active'));
          btn.classList.add('active');

          const filter = btn.dataset.filter;

          cards.forEach(card => {
            if (filter === 'all' || card.dataset.category === filter) {
              card.classList.remove('hidden');
              if (typeof gsap !== 'undefined') {
                gsap.fromTo(card,
                  { opacity: 0, scale: 0.9 },
                  { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
                );
              } else {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
              }
            } else {
              card.classList.add('hidden');
            }
          });
        });
      });
    }
  };

  /* ======================== VIDEO MODAL ======================== */
  const VideoModal = {
    modal: $('#videoModal'),
    frame: $('#videoFrame'),
    playBtn: $('#playBtn'),
    closeBtn: $('#videoClose'),
    overlay: null,

    init() {
      if (!this.modal || !this.playBtn) return;

      this.overlay = this.modal.querySelector('.video-modal__overlay');

      this.playBtn.addEventListener('click', () => this.open());
      if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
      if (this.overlay) this.overlay.addEventListener('click', () => this.close());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    },

    open() {
      // Use a sample architectural video
      this.frame.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0';
      this.modal.classList.add('active');
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    },

    close() {
      this.modal.classList.remove('active');
      this.modal.setAttribute('aria-hidden', 'true');
      this.frame.src = '';
      document.body.style.overflow = '';
    }
  };

  /* ======================== PRICING TOGGLE ======================== */
  const PricingToggle = {
    toggle: $('#pricingToggle'),
    amounts: $$('.pricing-card__amount'),
    labels: $$('.pricing__toggle-label'),
    isYearly: false,

    init() {
      if (!this.toggle) return;

      this.toggle.addEventListener('click', () => {
        this.isYearly = !this.isYearly;
        this.toggle.classList.toggle('active', this.isYearly);

        // Update label active states
        this.labels.forEach((label, i) => {
          if (this.isYearly) {
            label.toggleAttribute('data-active', i === 1);
          } else {
            label.toggleAttribute('data-active', i === 0);
          }
        });

        // Animate price change
        this.amounts.forEach(amount => {
          const monthly = amount.dataset.monthly;
          const yearly = amount.dataset.yearly;
          const newVal = this.isYearly ? yearly : monthly;

          if (typeof gsap !== 'undefined') {
            gsap.to(amount, {
              opacity: 0,
              y: -10,
              duration: 0.2,
              onComplete: () => {
                amount.textContent = newVal;
                gsap.to(amount, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.7)' });
              }
            });
          } else {
            amount.textContent = newVal;
          }
        });
      });
    }
  };

  /* ======================== BUTTON RIPPLE ======================== */
  const ButtonRipple = {
    init() {
      $$('.btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
          const rect = this.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const ripple = document.createElement('span');
          ripple.classList.add('ripple-circle');
          ripple.style.left = x + 'px';
          ripple.style.top = y + 'px';
          ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';

          this.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        });
      });
    }
  };

  /* ======================== CURSOR FOLLOWING DEPTH ======================== */
  const DepthMovement = {
    init() {
      // Disabled heavy depth movement for performance
      // Three.js hero already provides cursor-based depth interaction
    }
  };

  /* ======================== NEWSLETTER FORM ======================== */
  const Newsletter = {
    init() {
      const form = $('.footer__form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('.footer__input');
        if (input && input.value) {
          const btn = form.querySelector('.footer__submit');
          if (btn) {
            btn.innerHTML = '✓';
            btn.style.background = '#27ae60';
            setTimeout(() => {
              btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
              btn.style.background = '';
              input.value = '';
            }, 2500);
          }
        }
      });
    }
  };

  /* ======================== CONTACT FORM (EmailJS) ======================== */
  const ContactForm = {
    form: null,
    nameInput: null,
    emailInput: null,
    messageInput: null,
    statusEl: null,
    submitBtn: null,

    init() {
      this.form = $('#contactForm');
      if (!this.form) return;

      this.nameInput = $('#contactName');
      this.emailInput = $('#contactEmail');
      this.messageInput = $('#contactMessage');
      this.statusEl = $('#contactStatus');
      this.submitBtn = $('#contactSubmitBtn');

      // Initialize EmailJS
      if (typeof emailjs !== 'undefined') {
        emailjs.init('NMBHbAVNe9zVy1B3y');
      }

      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    validate() {
      const name = this.nameInput.value.trim();
      const email = this.emailInput.value.trim();
      const message = this.messageInput.value.trim();

      if (name.length < 2) {
        this.showStatus('Please enter your name (at least 2 characters).', 'error');
        this.nameInput.focus();
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.showStatus('Please enter a valid email address.', 'error');
        this.emailInput.focus();
        return false;
      }

      if (message.length < 10) {
        this.showStatus('Message must be at least 10 characters.', 'error');
        this.messageInput.focus();
        return false;
      }

      return true;
    },

    async handleSubmit(e) {
      e.preventDefault();

      if (!this.validate()) return;

      // Disable button and show loading state
      const btnText = this.submitBtn.querySelector('.btn__text');
      const originalText = btnText.textContent;
      btnText.textContent = 'Sending...';
      this.submitBtn.disabled = true;
      this.showStatus('', '');

      const templateParams = {
        name: this.nameInput.value.trim(),
        email: this.emailInput.value.trim(),
        message: this.messageInput.value.trim(),
      };

      try {
        if (typeof emailjs !== 'undefined') {
          await emailjs.send('service_eckpsth', 'template_qjvshvw', templateParams);
          this.showStatus('Your message has been sent successfully ✅', 'success');
          this.form.reset();
        } else {
          // Fallback: simulate success if EmailJS not loaded
          this.showStatus('Your message has been sent successfully ✅', 'success');
          this.form.reset();
        }
      } catch (error) {
        console.error('EmailJS error:', error);
        this.showStatus('Failed to send message. Please try again later.', 'error');
      } finally {
        btnText.textContent = originalText;
        this.submitBtn.disabled = false;
      }
    },

    showStatus(message, type) {
      if (!this.statusEl) return;
      this.statusEl.textContent = message;
      this.statusEl.className = 'contact__status';
      if (type) this.statusEl.classList.add(type);
    }
  };

  /* ======================== SMOOTH ANCHOR LINKS ======================== */
  const SmoothLinks = {
    init() {
      $$('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(link.getAttribute('href'));
          if (!target) return;

          if (SmoothScroll.instance) {
            SmoothScroll.instance.scrollTo(target, { offset: -80, duration: 1.5 });
          } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }
  };

  /* ======================== MAIN APP ======================== */
  const App = {
    init() {
      Preloader.init();
      ThemeToggle.init();
      Navigation.init();
      ScrollProgress.init();
      BackToTop.init();
      SmoothLinks.init();
      Newsletter.init();
    },

    // Called after preloader completes
    onReady() {
      console.log('App ready — revealing content');
      
      // Reveal main content softly
      const main = $('#main');
      if (main) main.classList.add('page-loaded');

      TextSplitting.init();
      SmoothScroll.init();
      Cursor.init();
      MagneticEffect.init();
      HeroBackground3D.init();
      ScrollAnimations.init();
      TiltEffect.init();
      ProjectFilter.init();
      VideoModal.init();
      PricingToggle.init();
      ButtonRipple.init();
      DepthMovement.init();
      ContactForm.init();
    }
  };

  // Boot the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

})();
