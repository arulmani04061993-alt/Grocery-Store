/**
 * STACKLY — Animations Module
 * GSAP 3, ScrollTrigger, Logo Preloader & Page Transitions
 */

window.StacklyAnimations = {
  _isNavigating: false,
  _isRestoringScroll: false,
  _preloaderTimer: null,
  _safetyTimer: null,

  /**
   * Helper: Check if screen is Desktop (width >= 992px)
   */
  isDesktop() {
    return window.innerWidth >= 992;
  },

  init() {
    if (this.isDesktop()) {
      this.initLogoIntro();
      this.initPageTransitions();
    } else {
      // Mobile / Tablet: Preloader disabled, load directly without delay
      this.disablePreloader();
    }
    this.initScrollTracking();
    this.restoreSavedScrollPosition();
    this.initAOS();
    this.initScrollAnimations();
    this.initSectionHeadingAnimations();
    this.initLoginAnimations();
    this.initCounterAnimations();
    this.initIframeAnimation();
  },

  /**
   * Helper: Ensure preloader element is present in DOM
   */
  ensurePreloaderElement() {
    let preloader = document.getElementById('logoIntroPreloader');
    if (!preloader && this.isDesktop()) {
      preloader = document.createElement('div');
      preloader.id = 'logoIntroPreloader';
      preloader.setAttribute('aria-hidden', 'true');
      preloader.className = 'preloader-hidden';
      preloader.innerHTML = `
        <div class="preloader-brand-wrap">
          <div class="preloader-logo-wrapper">
            <img src="assets/images/logo.webp" alt="STACKLY Organic Grocery" class="preloader-logo-img" width="280" height="82">
          </div>
          <div class="preloader-wave-container" aria-label="Loading...">
            <div class="wave-bars">
              <span class="wave-bar bar-1"></span>
              <span class="wave-bar bar-2"></span>
              <span class="wave-bar bar-3"></span>
              <span class="wave-bar bar-4"></span>
              <span class="wave-bar bar-5"></span>
              <span class="wave-bar bar-6"></span>
              <span class="wave-bar bar-7"></span>
            </div>
          </div>
        </div>
      `;
      document.body.prepend(preloader);
    }
    return preloader;
  },

  /**
   * Disabled Preloader (Used on mobile/tablet or reduced motion)
   */
  disablePreloader() {
    const preloader = document.getElementById('logoIntroPreloader');
    if (preloader) {
      preloader.style.display = 'none';
      preloader.classList.add('preloader-hidden');
      preloader.remove();
    }
    document.body.classList.remove('preloader-active');
    
    // Animate hero and elements immediately without delay
    this.animateHeroEntrance();
    this.initLoginAnimations();
    this.initCounterAnimations();
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    if (typeof AOS !== 'undefined') AOS.refresh();
  },

  /**
   * Logo Intro & Wave Page Load Animation (Desktop only)
   */
  initLogoIntro() {
    if (!this.isDesktop()) {
      this.disablePreloader();
      return;
    }

    const preloader = this.ensurePreloaderElement();
    if (!preloader) {
      this.disablePreloader();
      return;
    }

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.disablePreloader();
      return;
    }

    // Clean initial visible state
    preloader.classList.remove('preloader-hidden');
    preloader.classList.add('preloader-visible');
    preloader.style.display = 'flex';
    preloader.style.opacity = '1';
    document.body.classList.add('preloader-active');

    if (this._preloaderTimer) clearTimeout(this._preloaderTimer);
    if (this._safetyTimer) clearTimeout(this._safetyTimer);

    // Duration for desktop page load
    const duration = 1200;

    this._safetyTimer = setTimeout(() => {
      this.finishPreloader(preloader);
    }, duration + 600);

    this._preloaderTimer = setTimeout(() => {
      if (this._safetyTimer) clearTimeout(this._safetyTimer);
      this.finishPreloader(preloader);
    }, duration);
  },

  finishPreloader(preloader) {
    if (!preloader) return;

    // Ensure final scroll restoration just before preloader fades out
    this.restoreSavedScrollPosition();

    // Ensure mobile drawers are fully closed
    document.querySelectorAll('#mobileMenuDrawer, .offcanvas').forEach(drawer => {
      try {
        if (window.bootstrap?.Offcanvas) {
          const inst = window.bootstrap.Offcanvas.getInstance(drawer);
          if (inst) inst.hide();
        }
      } catch (err) {}
      drawer.classList.remove('show', 'open', 'active');
      drawer.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.offcanvas-backdrop').forEach(el => el.remove());

    preloader.style.opacity = '0';
    preloader.style.transition = 'opacity 0.35s ease-out';
    setTimeout(() => {
      preloader.style.display = 'none';
      preloader.classList.add('preloader-hidden');
      preloader.classList.remove('preloader-visible');
      document.body.classList.remove('preloader-active');
      // Trigger Hero entrance immediately after preloader reveals
      this.animateHeroEntrance();
      this.initLoginAnimations();
      this.initCounterAnimations();

      // Recalculate ScrollTrigger & AOS metrics now that body scroll is unlocked
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
        setTimeout(() => ScrollTrigger.refresh(), 200);
      }
      if (typeof AOS !== 'undefined') {
        AOS.refresh();
        setTimeout(() => AOS.refresh(), 200);
      }
    }, 350);
  },

  /**
   * Helper: Check if an anchor navigates to another page
   */
  isNavigationalLink(link) {
    if (!link) return false;
    const rawHref = link.getAttribute('href');
    if (!rawHref) return false;
    const href = rawHref.trim();

    // Ignore anchors, non-http, target blanks, and bootstrap toggles
    if (!href || href === '#' || href.startsWith('#')) return false;
    if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    if (link.target === '_blank' || link.hasAttribute('download')) return false;
    if (link.hasAttribute('data-bs-toggle') || link.classList.contains('dropdown-toggle')) return false;

    try {
      const targetUrl = new URL(link.href, window.location.href);
      if (targetUrl.origin !== window.location.origin) return false;

      const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
      const targetPath = targetUrl.pathname.replace(/\/$/, '') || '/index.html';

      const getFilename = (p) => {
        const seg = p.split('/').pop() || 'index.html';
        return seg === '' ? 'index.html' : seg;
      };

      const currentFile = getFilename(currentPath);
      const targetFile = getFilename(targetPath);

      // Navigating to a different file
      if (currentFile !== targetFile) {
        return true;
      }

      // Navigating to same file with different search query (and not an in-page hash)
      if (targetUrl.search !== window.location.search && (!targetUrl.hash || targetUrl.hash === '')) {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Continuous Scroll Tracking to preserve exact user location (across all pages)
   */
  initScrollTracking() {
    window.addEventListener('scroll', () => {
      if (!this._isRestoringScroll) {
        const y = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
        if (y > 0) {
          try {
            sessionStorage.setItem('stackly_saved_scroll_y', y.toString());
            sessionStorage.setItem('stackly_saved_scroll_url', window.location.href);
          } catch (e) { }
        }
      }
    }, { passive: true });

    window.addEventListener('beforeunload', () => {
      if (!this._isRestoringScroll) {
        const y = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
        if (y > 0) {
          try {
            sessionStorage.setItem('stackly_saved_scroll_y', y.toString());
            sessionStorage.setItem('stackly_saved_scroll_url', window.location.href);
          } catch (e) { }
        }
      }
    });
  },

  /**
   * Restore exact scroll position and section when returning from 404 or other pages (across all pages)
   */
  restoreSavedScrollPosition() {
    try {
      // If user navigated to Home (e.g. via GO TO HOME), explicitly scroll to top and clear scroll cache
      if (sessionStorage.getItem('stackly_scroll_to_top') === 'true') {
        sessionStorage.removeItem('stackly_scroll_to_top');
        sessionStorage.removeItem('stackly_should_restore_scroll');
        sessionStorage.removeItem('stackly_saved_scroll_y');
        sessionStorage.removeItem('stackly_saved_anchor');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        return;
      }

      const shouldRestore = sessionStorage.getItem('stackly_should_restore_scroll') === 'true';
      const savedYStr = sessionStorage.getItem('stackly_saved_scroll_y');
      const savedAnchor = sessionStorage.getItem('stackly_saved_anchor');

      if (!shouldRestore) return;

      const savedY = savedYStr !== null ? parseInt(savedYStr, 10) : null;
      if (savedY === null && !savedAnchor) return;

      this._isRestoringScroll = true;

      const performScroll = () => {
        // Priority 1: target anchor/section element (e.g. #newsletter, #featured-products, #curated-bundles, #siteFooter, etc.)
        if (savedAnchor) {
          const targetEl = document.querySelector(savedAnchor);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'instant', block: 'center' });
            // Ensure target section and all internal animated children are 100% visible
            targetEl.style.opacity = '1';
            targetEl.style.transform = 'none';
            targetEl.style.visibility = 'visible';

            targetEl.querySelectorAll('.newsletter-panel, .newsletter-heading, .newsletter-desc, .newsletter-form-wrap, .gsap-text-word, form, input, button, .product-card, .bundle-card, .story-team-card, .story-team-social, .story-value-card, .footer-col-brand, .footer-col-links, .footer-col-contact').forEach(el => {
              el.style.opacity = '1';
              el.style.transform = 'none';
              el.style.visibility = 'visible';
            });
            return;
          }
        }
        // Priority 2: exact pixel scroll position
        if (savedY !== null && !isNaN(savedY) && savedY > 0) {
          window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
          if (document.documentElement) document.documentElement.scrollTop = savedY;
          if (document.body) document.body.scrollTop = savedY;
        }
      };

      // Perform immediately and repeatedly across progressive layout phases and after preloader finishes
      performScroll();
      requestAnimationFrame(performScroll);
      setTimeout(performScroll, 50);
      setTimeout(performScroll, 200);
      setTimeout(performScroll, 500);
      setTimeout(performScroll, 1000);
      setTimeout(performScroll, 2050);
      setTimeout(() => {
        performScroll();
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      }, 2100);
      setTimeout(performScroll, 2300);
      setTimeout(() => {
        performScroll();
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        this._isRestoringScroll = false;
        sessionStorage.removeItem('stackly_should_restore_scroll');
      }, 2600);
    } catch (e) {
      console.warn('Scroll restore error:', e);
    }
  },  /**
   * Trigger Wave Loading Screen before Navigating to Target URL
   */
  triggerPageTransition(targetUrl, sourceElement) {
    if (this._isNavigating) return;
    this._isNavigating = true;

    // Check if target is explicitly Home page (e.g. from 404 or login)
    const isExplicitHome = sourceElement && (
      sourceElement.classList.contains('ref-btn-home') ||
      sourceElement.classList.contains('brand-logo-link') ||
      sourceElement.id === 'refBtnHome' ||
      sourceElement.classList.contains('login-back-store-btn')
    );

    if (isExplicitHome) {
      try {
        sessionStorage.removeItem('stackly_should_restore_scroll');
        sessionStorage.removeItem('stackly_saved_scroll_y');
        sessionStorage.removeItem('stackly_saved_anchor');
        sessionStorage.setItem('stackly_scroll_to_top', 'true');
      } catch (e) { }
    } else {
      // Snapshot exact scroll position and section before leaving
      const currentY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
      try {
        sessionStorage.setItem('stackly_saved_scroll_y', currentY.toString());
        sessionStorage.setItem('stackly_saved_scroll_url', window.location.href);
        sessionStorage.setItem('stackly_should_restore_scroll', 'true');

        if (sourceElement && typeof sourceElement.closest === 'function') {
          const footer = sourceElement.closest('#siteFooter, footer');
          if (footer) {
            sessionStorage.setItem('stackly_saved_anchor', '#siteFooter');
          } else {
            const section = sourceElement.closest('section[id], div[id]');
            if (section && section.id) {
              sessionStorage.setItem('stackly_saved_anchor', '#' + section.id);
            } else {
              sessionStorage.removeItem('stackly_saved_anchor');
            }
          }
        } else if (currentY > 3500) {
          sessionStorage.setItem('stackly_saved_anchor', '#siteFooter');
        }
      } catch (e) { }
    }

    const preloader = this.ensurePreloaderElement();
    preloader.classList.remove('preloader-hidden');
    preloader.classList.add('preloader-visible');
    preloader.style.display = 'flex';
    preloader.style.opacity = '1';
    document.body.classList.add('preloader-active');

    // Force reflow
    void preloader.offsetWidth;

    preloader.style.transition = 'opacity 0.2s ease-in';
    preloader.style.opacity = '1';

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 320);

    // Failsafe
    setTimeout(() => {
      this._isNavigating = false;
    }, 4000);
  },

  /**
   * Trigger Wave Loading Screen and Navigate directly to Home Page (top of index.html)
   */
  /**
   * Navigate directly to Home Page (top of index.html)
   */
  triggerGoHome() {
    try {
      sessionStorage.removeItem('stackly_should_restore_scroll');
      sessionStorage.removeItem('stackly_saved_scroll_y');
      sessionStorage.removeItem('stackly_saved_anchor');
      sessionStorage.setItem('stackly_scroll_to_top', 'true');
    } catch (e) { }

    window.location.href = 'index.html';
  },

  /**
   * Navigate Back to Previous Page / Dashboard Location accurately
   */
  triggerGoBack() {
    try {
      sessionStorage.setItem('stackly_should_restore_scroll', 'true');
    } catch (e) { }

    // Priority 1: Check explicitly stored previous valid page or dashboard URL
    let targetDest = '';
    try {
      targetDest = sessionStorage.getItem('stackly_last_valid_page') ||
                   sessionStorage.getItem('stackly_dashboard_url') ||
                   sessionStorage.getItem('stackly_saved_scroll_url') || '';
    } catch (e) { }

    // Priority 2: Check document.referrer if valid and not 404
    if (!targetDest && document.referrer && document.referrer.includes(window.location.host) && !document.referrer.includes('404.html')) {
      targetDest = document.referrer;
    }

    if (targetDest && !targetDest.includes('404.html')) {
      window.location.href = targetDest;
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  },

  /**
   * Trigger Preloader Transition to another page (Desktop only)
   */
  triggerPageTransition(targetUrl, sourceElement) {
    if (!this.isDesktop()) {
      window.location.href = targetUrl;
      return;
    }

    if (this._isNavigating) return;
    this._isNavigating = true;

    // Check if target is explicitly Home page
    const isExplicitHome = sourceElement && (
      sourceElement.classList.contains('ref-btn-home') ||
      sourceElement.classList.contains('brand-logo-link') ||
      sourceElement.id === 'refBtnHome' ||
      sourceElement.classList.contains('login-back-store-btn')
    );

    if (isExplicitHome) {
      try {
        sessionStorage.removeItem('stackly_should_restore_scroll');
        sessionStorage.removeItem('stackly_saved_scroll_y');
        sessionStorage.removeItem('stackly_saved_anchor');
        sessionStorage.setItem('stackly_scroll_to_top', 'true');
      } catch (e) { }
    } else {
      const currentY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
      try {
        sessionStorage.setItem('stackly_saved_scroll_y', currentY.toString());
        sessionStorage.setItem('stackly_saved_scroll_url', window.location.href);
        sessionStorage.setItem('stackly_should_restore_scroll', 'true');
      } catch (e) { }
    }

    const preloader = this.ensurePreloaderElement();
    if (preloader) {
      preloader.classList.remove('preloader-hidden');
      preloader.classList.add('preloader-visible');
      preloader.style.display = 'flex';
      preloader.style.opacity = '1';
      document.body.classList.add('preloader-active');
      void preloader.offsetWidth;
      preloader.style.transition = 'opacity 0.2s ease-in';
      preloader.style.opacity = '1';
    }

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 350);

    setTimeout(() => {
      this._isNavigating = false;
    }, 3000);
  },

  /**
   * Page Transitions Event Listeners
   */
  initPageTransitions() {
    // Intercept clicks on navigational links (Desktop view only)
    document.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const link = e.target.closest('a');
      if (!link) return;

      // Close mobile drawer if clicking links
      const drawer = link.closest('#mobileMenuDrawer, .offcanvas') || document.getElementById('mobileMenuDrawer');
      if (drawer && (link.closest('#mobileMenuDrawer, .offcanvas') || drawer.classList.contains('show'))) {
        try {
          if (window.bootstrap?.Offcanvas) {
            const inst = window.bootstrap.Offcanvas.getInstance(drawer) || window.bootstrap.Offcanvas.getOrCreateInstance(drawer);
            if (inst) inst.hide();
          }
        } catch (err) {}
        drawer.classList.remove('show', 'open', 'active');
        drawer.setAttribute('aria-hidden', 'true');
        drawer.style.visibility = 'hidden';
        setTimeout(() => { drawer.style.removeProperty('visibility'); }, 350);
        document.querySelectorAll('.offcanvas-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open', 'mobile-menu-open', 'menu-open', 'nav-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
      }

      // If desktop, trigger preloader on link click
      if (this.isDesktop() && this.isNavigationalLink(link)) {
        e.preventDefault();
        this.triggerPageTransition(link.href, link);
      }
    });

    // Handle bfcache (browser back/forward button)
    window.addEventListener('pageshow', (event) => {
      this._isNavigating = false;
      // Ensure all mobile drawers and backdrops are closed on pageshow
      document.querySelectorAll('#mobileMenuDrawer, .offcanvas').forEach(drawer => {
        try {
          if (window.bootstrap?.Offcanvas) {
            const inst = window.bootstrap.Offcanvas.getInstance(drawer);
            if (inst) inst.hide();
          }
        } catch (err) {}
        drawer.classList.remove('show', 'open', 'active');
        drawer.setAttribute('aria-hidden', 'true');
      });
      document.querySelectorAll('.offcanvas-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open', 'menu-open', 'nav-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');

      if (event && event.persisted) {
        // If restored from browser bfcache, trigger the wave preloader!
        this.initLogoIntro();
      }
      this.restoreSavedScrollPosition();
    });
  },

  /**
   * Hero Entrance Animation triggered right after preloader finishes (All Pages)
   */
  animateHeroEntrance() {
    if (typeof gsap === 'undefined') return;

    // 1. Home Page Hero
    if (document.querySelector('.hero-pill-label')) {
      const heroTl = gsap.timeline();
      heroTl.fromTo('.hero-pill-label',
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      )
        .fromTo('.hero-line',
          { y: 35, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo('.hero-description',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.3'
        )
        .fromTo('.hero-cta-group .btn',
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, stagger: 0.12, ease: 'back.out(1.5)' },
          '-=0.3'
        )
        .fromTo('.hero-trust-badge',
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: 'power2.out' },
          '-=0.2'
        )
        .fromTo('.hero-image-frame',
          { scale: 0.92, opacity: 0, y: 30 },
          { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
          0.3
        )
        .fromTo('.hero-floating-badge',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' },
          0.8
        );
    }

    // 2. About / Story Page Hero
    if (document.querySelector('.story-hero-content')) {
      const storyTl = gsap.timeline();
      storyTl.fromTo('.story-hero-pill',
        { y: -20, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
      )
        .fromTo('.story-hero-title',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo('.story-hero-subtitle',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.3'
        );
    }

    // 3. Service Page Hero
    if (document.querySelector('.service-hero-content')) {
      const servTl = gsap.timeline();
      servTl.fromTo('.service-hero-pill',
        { y: -20, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
      )
        .fromTo('.service-hero-title',
          { y: 35, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo('.service-hero-sub',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.3'
        );
    }

    // 4. Blog Page Featured Banner
    if (document.querySelector('.blog-featured-card')) {
      const blogTl = gsap.timeline();
      blogTl.fromTo('.blog-featured-card',
        { scale: 0.95, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
      );
    }

    // 5. Contact Page Showcase Hero
    if (document.querySelector('.contact-showcase-panel')) {
      const contactTl = gsap.timeline();
      contactTl.fromTo('.contact-showcase-panel',
        { scale: 0.96, opacity: 0, y: 25 },
        { scale: 1, opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }
      )
        .fromTo('.contact-form-panel',
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' },
          '-=0.4'
        );
    }

    // 6. User & Admin Dashboards
    if (document.querySelector('.dash-welcome-banner, .admin-welcome-banner')) {
      const dashTl = gsap.timeline();
      dashTl.fromTo('.dash-welcome-banner, .admin-welcome-banner',
        { opacity: 0, y: -15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power2.out' }
      )
        .fromTo('.dash-stat-card, .metric-card',
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)' },
          '-=0.25'
        );
    }
  },

  /**
   * Section 15: GSAP ScrollTrigger Animations
   */
  initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // NOTE: All cards (.category-card, .product-card, .bundle-card, .benefit-card,
    // .grower-story-card, .recipe-card, .testimonial-card) are animated exclusively
    // via the AOS library (alternating fade-right and fade-left directions)
    // to prevent GSAP inline transform collisions.

    // Deal of the Day Banner reveal
    if (document.querySelector('.deal-banner-wrapper')) {
      gsap.fromTo('.deal-banner-wrapper',
        { scale: 0.96, opacity: 0, y: 30 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.deal-banner-wrapper',
            start: 'top 80%',
            once: true
          }
        }
      );
    }

    // Deal Image Floating movement
    if (document.querySelector('.deal-product-img')) {
      gsap.to('.deal-product-img', {
        y: -12,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    // Newsletter Panel entrance
    if (document.querySelector('.newsletter-panel')) {
      gsap.fromTo('.newsletter-panel',
        { scale: 0.95, opacity: 0, y: 25 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.newsletter-panel',
            start: 'top 85%',
            once: true
          }
        }
      );
    }
  },

  /**
   * Helper: Split heading text into animated word spans while preserving accessibility
   */
  splitTextIntoWords(headingEl) {
    if (!headingEl || headingEl.dataset.gsapSplit === 'true') {
      return headingEl ? Array.from(headingEl.querySelectorAll('.gsap-text-word')) : [];
    }

    const rawText = headingEl.textContent.trim();
    if (!rawText) return [];

    // Full plain text remains completely accessible to screen readers
    headingEl.setAttribute('aria-label', rawText);
    headingEl.dataset.gsapSplit = 'true';

    const words = rawText.split(/\s+/);
    headingEl.innerHTML = '';

    const wordSpans = [];
    words.forEach((w, i) => {
      const wrap = document.createElement('span');
      wrap.className = 'gsap-text-word-wrap';
      wrap.setAttribute('aria-hidden', 'true');

      const inner = document.createElement('span');
      inner.className = 'gsap-text-word';
      inner.textContent = w;
      wrap.appendChild(inner);

      headingEl.appendChild(wrap);
      wordSpans.push(inner);

      if (i < words.length - 1) {
        headingEl.appendChild(document.createTextNode(' '));
      }
    });

    return wordSpans;
  },

  /**
   * Section 15B: GSAP Text Animations for Section Headings
   * Editorial word-by-word staggered reveal with coordinated subtitles and controls
   */
  initSectionHeadingAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Standard Section Header Rows (.section-header-row)
    // Used by: Shop by Categories, Featured Products, Customer Testimonials
    document.querySelectorAll('.section-header-row').forEach((row) => {
      const heading = row.querySelector('.section-title');
      if (!heading) return;

      const words = this.splitTextIntoWords(heading);
      const subtitle = row.querySelector('.section-subtitle');
      const action = row.querySelector('.view-all-link, .carousel-nav-arrows, .filter-pill-nav');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: row,
          start: 'top 88%',
          once: true
        }
      });

      if (words.length) {
        tl.fromTo(words,
          { y: '115%', opacity: 0, rotateZ: 2 },
          { y: '0%', opacity: 1, rotateZ: 0, duration: 0.65, stagger: 0.045, ease: 'power3.out' }
        );
      }

      if (subtitle) {
        tl.fromTo(subtitle,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' },
          words.length ? '-=0.35' : 0
        );
      }

      if (action) {
        tl.fromTo(action,
          { x: 25, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.35'
        );
      }
    });

    // 2. Centered Section Header (.why-us-section .max-w-700)
    // Used by: Why Shop With Us?
    const whyHeader = document.querySelector('.why-us-section .max-w-700');
    if (whyHeader) {
      const heading = whyHeader.querySelector('.section-title');
      const subtitle = whyHeader.querySelector('.section-subtitle');

      if (heading) {
        const words = this.splitTextIntoWords(heading);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: whyHeader,
            start: 'top 88%',
            once: true
          }
        });

        if (words.length) {
          tl.fromTo(words,
            { y: '115%', opacity: 0, rotateZ: 2 },
            { y: '0%', opacity: 1, rotateZ: 0, duration: 0.65, stagger: 0.05, ease: 'power3.out' }
          );
        }

        if (subtitle) {
          tl.fromTo(subtitle,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' },
            words.length ? '-=0.35' : 0
          );
        }
      }
    }

    // 3. Deal of the Day Banner Heading (.deal-heading)
    const dealWrap = document.querySelector('.deal-banner-wrapper');
    if (dealWrap) {
      const pill = dealWrap.querySelector('.deal-limit-pill');
      const heading = dealWrap.querySelector('.deal-heading');
      const desc = dealWrap.querySelector('.deal-text');
      const timer = dealWrap.querySelector('.deal-countdown-row');

      if (heading) {
        const words = this.splitTextIntoWords(heading);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: dealWrap,
            start: 'top 82%',
            once: true
          }
        });

        if (pill) {
          tl.fromTo(pill,
            { y: -15, opacity: 0, scale: 0.88 },
            { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' }
          );
        }

        if (words.length) {
          tl.fromTo(words,
            { y: '115%', opacity: 0, rotateZ: 2 },
            { y: '0%', opacity: 1, rotateZ: 0, duration: 0.7, stagger: 0.04, ease: 'power3.out' },
            pill ? '-=0.2' : 0
          );
        }

        if (desc) {
          tl.fromTo(desc,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' },
            '-=0.4'
          );
        }

        if (timer) {
          tl.fromTo(timer,
            { y: 20, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
            '-=0.35'
          );
        }
      }
    }

    // 4. Mobile App Banner Heading (.app-banner-heading)
    const appCard = document.querySelector('.app-banner-card');
    if (appCard) {
      const pill = appCard.querySelector('.app-pill-label');
      const heading = appCard.querySelector('.app-banner-heading');
      const desc = appCard.querySelector('.app-banner-desc');
      const buttons = appCard.querySelector('.app-buttons-row');

      if (heading) {
        const words = this.splitTextIntoWords(heading);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: appCard,
            start: 'top 82%',
            once: true
          }
        });

        if (pill) {
          tl.fromTo(pill,
            { y: -15, opacity: 0, scale: 0.88 },
            { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' }
          );
        }

        if (words.length) {
          tl.fromTo(words,
            { y: '115%', opacity: 0, rotateZ: 2 },
            { y: '0%', opacity: 1, rotateZ: 0, duration: 0.7, stagger: 0.045, ease: 'power3.out' },
            pill ? '-=0.2' : 0
          );
        }

        if (desc) {
          tl.fromTo(desc,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' },
            '-=0.4'
          );
        }

        if (buttons) {
          tl.fromTo(buttons,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
            '-=0.35'
          );
        }
      }
    }

    // 5. Newsletter Heading (.newsletter-heading)
    const newsPanel = document.querySelector('.newsletter-panel');
    if (newsPanel) {
      const heading = newsPanel.querySelector('.newsletter-heading');
      const desc = newsPanel.querySelector('.newsletter-desc');
      const form = newsPanel.querySelector('.newsletter-form-wrap');

      if (heading) {
        const words = this.splitTextIntoWords(heading);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: newsPanel,
            start: 'top 85%',
            once: true
          }
        });

        if (words.length) {
          tl.fromTo(words,
            { y: '115%', opacity: 0, rotateZ: 2 },
            { y: '0%', opacity: 1, rotateZ: 0, duration: 0.65, stagger: 0.05, ease: 'power3.out' }
          );
        }

        if (desc) {
          tl.fromTo(desc,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' },
            '-=0.35'
          );
        }

        if (form) {
          tl.fromTo(form,
            { y: 20, opacity: 0, scale: 0.98 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
            '-=0.3'
          );
        }
      }
    }

    // 6. Generic catch-all for any standalone section headings
    document.querySelectorAll('.section-title, .dash-hero-title').forEach((titleEl) => {
      if (titleEl.dataset.gsapSplit === 'true') return;
      const words = this.splitTextIntoWords(titleEl);
      if (words.length) {
        gsap.fromTo(words,
          { y: '115%', opacity: 0, rotateZ: 2 },
          {
            y: '0%',
            opacity: 1,
            rotateZ: 0,
            duration: 0.65,
            stagger: 0.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: titleEl,
              start: 'top 88%',
              once: true
            }
          }
        );
      }
    });
  },

  /**
   * Section 15C: Login Page Heading Animations
   */
  initLoginAnimations() {
    if (typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const loginLeftHeading = document.querySelector('.login-showcase-hero h2, .login-left-content h2');
    const loginRightHeading = document.querySelector('.login-title');

    if (loginLeftHeading || loginRightHeading) {
      const tl = gsap.timeline({ delay: 0.15 });

      if (loginLeftHeading) {
        const words = this.splitTextIntoWords(loginLeftHeading);
        const sub = document.querySelector('.login-showcase-hero p, .login-left-content .login-subtext');
        if (words.length) {
          tl.fromTo(words,
            { y: '115%', opacity: 0, rotateZ: 2 },
            { y: '0%', opacity: 1, rotateZ: 0, duration: 0.7, stagger: 0.045, ease: 'power3.out' }
          );
        }
        if (sub) {
          tl.fromTo(sub,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
            '-=0.35'
          );
        }
      }

      if (loginRightHeading) {
        const words = this.splitTextIntoWords(loginRightHeading);
        const sub = document.querySelector('.login-subtitle, .login-right-card .login-subtitle');
        if (words.length) {
          tl.fromTo(words,
            { y: '115%', opacity: 0 },
            { y: '0%', opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out' },
            '-=0.3'
          );
        }
        if (sub) {
          tl.fromTo(sub,
            { y: 15, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
            '-=0.3'
          );
        }
      }
    }
  },

  /**
   * Section 16: AOS Requirements
   */
  initAOS() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 80,
        easing: 'ease-out-cubic'
      });
    }
  },

  /**
   * Section 17: Number Counter Animations (ScrollTrigger / IntersectionObserver Count-Up)
   */
  initCounterAnimations() {
    const selector = [
      '.counter-number',
      '[data-counter]',
      '.eco-metric-val',
      '.kpi-value',
      '.stat-num',
      '.about-pstat-num',
      '.cat-count-badge',
      '.process-step-number',
      '.about-process-step-num',
      '.story-badge-number'
    ].join(', ');

    const counterElements = document.querySelectorAll(selector);
    if (!counterElements.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    counterElements.forEach(el => {
      if (el.dataset.counterInit === 'true') return;

      // Extract raw text content without child badges if any
      let rawText = '';
      // If element contains child spans/elements, check for a leading text node or full text
      const childNodes = Array.from(el.childNodes);
      const textNodes = childNodes.filter(n => n.nodeType === Node.TEXT_NODE);
      if (textNodes.length > 0 && textNodes[0].textContent.trim().length > 0) {
        rawText = textNodes[0].textContent.trim();
      } else {
        rawText = el.textContent.trim();
      }

      let explicitTarget = el.getAttribute('data-counter');
      let target = explicitTarget !== null ? parseFloat(explicitTarget) : NaN;
      let suffix = el.getAttribute('data-suffix');
      let prefix = el.getAttribute('data-prefix') || '';
      let useComma = el.getAttribute('data-comma') === 'true';
      let decimalPlaces = 0;

      // Auto-parse from existing text if data attributes are absent
      if (isNaN(target)) {
        const cleanStr = rawText.replace(/,/g, '');
        // Match: prefix (optional non-digits), number (with optional decimals), suffix (trailing non-digits/symbols)
        const match = cleanStr.match(/^([^0-9.]*?)(\d+(?:\.\d+)?)(.*)$/);
        if (match) {
          prefix = prefix || match[1] || '';
          target = parseFloat(match[2]);
          suffix = (suffix !== null && suffix !== undefined) ? suffix : (match[3] || '');
          if (rawText.includes(',')) useComma = true;
          if (match[2].includes('.')) {
            decimalPlaces = match[2].split('.')[1].length;
          }
        } else {
          return;
        }
      }

      if (isNaN(target)) return;
      el.dataset.counterInit = 'true';

      if (suffix === null || suffix === undefined) {
        suffix = '';
      }

      const formatVal = (num) => {
        let str = '';
        if (decimalPlaces > 0) {
          const fixedNum = Number(num).toFixed(decimalPlaces);
          if (useComma) {
            const parts = fixedNum.split('.');
            parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
            str = parts.join('.');
          } else {
            str = fixedNum;
          }
        } else {
          const rounded = Math.floor(num);
          str = useComma ? rounded.toLocaleString('en-US') : rounded.toString();
        }
        return `${prefix}${str}${suffix}`;
      };

      // Preserve any existing non-text elements (like badges/subtext inside kpi-value)
      const nonTextChildren = Array.from(el.children).map(child => child.cloneNode(true));

      const applyToElement = (formattedValue) => {
        el.textContent = formattedValue;
        if (nonTextChildren.length > 0) {
          el.appendChild(document.createTextNode(' '));
          nonTextChildren.forEach(child => el.appendChild(child.cloneNode(true)));
        }
      };

      if (prefersReducedMotion) {
        applyToElement(formatVal(target));
        return;
      }

      // Initialize counter at 0
      applyToElement(formatVal(0));

      // Trigger animation using GSAP ScrollTrigger if available
      if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
        const state = { count: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: 'top 95%',
          once: true,
          onEnter: () => {
            gsap.to(state, {
              count: target,
              duration: target >= 1000 ? 1.8 : 1.2,
              ease: 'power2.out',
              onUpdate: () => {
                applyToElement(formatVal(state.count));
              },
              onComplete: () => {
                applyToElement(formatVal(target));
              }
            });
          }
        });
      } else {
        // High-performance requestAnimationFrame fallback with IntersectionObserver
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              obs.unobserve(entry.target);
              const duration = target >= 1000 ? 1800 : 1200;
              const startTime = performance.now();
              const step = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 3);
                const current = target * ease;
                applyToElement(formatVal(current));
                if (progress < 1) {
                  requestAnimationFrame(step);
                } else {
                  applyToElement(formatVal(target));
                }
              };
              requestAnimationFrame(step);
            }
          });
        }, { threshold: 0.1 });
        observer.observe(el);
      }
    });
  },

  /**
   * Section 18: Iframe Modal & Scroll Animations (Google Maps & Media iframes)
   */
  initIframeAnimation() {
    const mapModal = document.getElementById('storeMapModal');
    if (mapModal) {
      mapModal.addEventListener('shown.bs.modal', () => {
        const iframeWrapper = mapModal.querySelector('.ratio');
        const iframe = mapModal.querySelector('iframe');
        if (typeof gsap !== 'undefined') {
          if (iframeWrapper) {
            gsap.fromTo(iframeWrapper,
              { opacity: 0, scale: 0.94, y: 15 },
              { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );
          }
          if (iframe) {
            gsap.fromTo(iframe,
              { opacity: 0, filter: 'blur(4px)' },
              { opacity: 1, filter: 'blur(0px)', duration: 0.6, delay: 0.1, ease: 'power2.out' }
            );
          }
        }
      });
    }

    // Generic iframe animations when scrolled into viewport or present on pages
    const genericIframes = document.querySelectorAll('iframe:not([data-animated="true"])');
    genericIframes.forEach(iframe => {
      iframe.setAttribute('data-animated', 'true');
      iframe.classList.add('iframe-smooth-load');
      iframe.addEventListener('load', () => {
        iframe.classList.add('iframe-loaded');
      });
    });
  }
};

// Auto-initialize when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.StacklyAnimations && typeof window.StacklyAnimations.init === 'function') {
      window.StacklyAnimations.init();
    }
  });
} else {
  if (window.StacklyAnimations && typeof window.StacklyAnimations.init === 'function') {
    window.StacklyAnimations.init();
  }
}
