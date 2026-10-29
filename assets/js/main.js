/**
 * STACKLY — Component Loader
 * Dynamically loads and injects modular HTML components (navbar.html, footer.html)
 */
window.StacklyComponents = {
  async loadAll() {
    const includes = document.querySelectorAll('[data-include]');
    for (const el of includes) {
      const file = el.getAttribute('data-include');
      if (file) {
        await this.load(el, file);
      }
    }
  },

  async load(targetElement, filePath) {
    try {
      const res = await fetch(filePath);
      if (res.ok) {
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const component = doc.querySelector('header, footer') || doc.body.firstElementChild;

        if (component) {
          targetElement.innerHTML = component.outerHTML;

          if (filePath.toLowerCase().includes("navbar")) {
            this.highlightCurrentPageNav();
            this.initMobileMenuAutoClose();
          }
        }

      }
    } catch (e) {
      console.warn(`[StacklyComponents] Note: ${filePath} loaded from inline template (${e.message}).`);
    }
  },




  initMobileMenuAutoClose() {
    // Handled globally with event capturing for all offcanvas menus
  },


  highlightCurrentPageNav() {
    let currentPage = window.location.pathname.split('/').pop().toLowerCase();
    if (!currentPage || currentPage === '' || currentPage === '/') {
      currentPage = 'index.html';
    }
    // Also decode in case of URI encoding (e.g. service%20page.html)
    const decodedCurrent = decodeURIComponent(currentPage);

    // Process all nav links in site header and mobile menu
    const navLinks = document.querySelectorAll('.site-header .nav-text-link, .site-header .header-signup-btn, #mobileMenuDrawer .nav-link');
    navLinks.forEach(link => {
      const rawHref = link.getAttribute('href');
      if (!rawHref) return;

      const cleanHref = decodeURIComponent(rawHref.split('#')[0].split('?')[0]);
      if (!cleanHref) return;

      const isMatch = (
        cleanHref === currentPage ||
        cleanHref === decodedCurrent ||
        (cleanHref === 'index.html' && (currentPage === '' || currentPage === 'index.html'))
      );

      if (isMatch) {
        link.classList.add('active');
        if (link.classList.contains('header-signup-btn')) {
          link.classList.add('active');
        }
      } else {
        link.classList.remove('active');
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize animations (including 2.0s logo preloader) immediately on DOM ready
  if (window.StacklyAnimations) {
    window.StacklyAnimations.init();
  }

  // 0. Load external navbar.html and footer.html components dynamically
  if (window.StacklyComponents) {
    await window.StacklyComponents.loadAll();
    // Ensure exact scroll position restoration after dynamic components render
    if (window.StacklyAnimations && typeof window.StacklyAnimations.restoreSavedScrollPosition === 'function') {
      window.StacklyAnimations.restoreSavedScrollPosition();
    }
    // Refresh ScrollTrigger & AOS positions after footer/navbar DOM insertion
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
    if (window.StacklyAnimations && typeof window.StacklyAnimations.initCounterAnimations === 'function') {
      window.StacklyAnimations.initCounterAnimations();
    }
  }

  // Highlight active page link immediately (for pages with static or dynamic navbars)
  if (window.StacklyComponents && typeof window.StacklyComponents.highlightCurrentPageNav === 'function') {
    window.StacklyComponents.highlightCurrentPageNav();
  }

  // 2. Initialize interactive features (cart, storage, timer, search)
  if (window.StacklyInteractions) {
    window.StacklyInteractions.init();
  }

  // 3. Header sticky scroll shadow effect
  const siteHeader = document.getElementById('siteHeader');
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // 3b. Automatically track current valid page location so 404 Go Back knows the exact previous place
  try {
    const currentHref = window.location.href;
    if (!currentHref.includes('404.html')) {
      sessionStorage.setItem('stackly_last_valid_page', currentHref);
    }
  } catch (err) {}

  // Global click tracker: whenever any button, link or card pointing to 404.html is clicked, capture exact scroll, section & element location
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button, [onclick]');
    if (!target) return;
    const href = (target.getAttribute('href') || '') + ' ' + (target.getAttribute('onclick') || '');
    if (href.includes('404.html')) {
      try {
        const currentY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
        sessionStorage.setItem('stackly_saved_scroll_y', Math.round(currentY).toString());
        sessionStorage.setItem('stackly_saved_scroll_url', window.location.href);
        sessionStorage.setItem('stackly_should_restore_scroll', 'true');
        sessionStorage.setItem('stackly_last_valid_page', window.location.href);

        // Find nearest unique ID or section
        const section = target.closest('section[id], div[id], [data-tab-pane], .dash-tab-pane, footer');
        if (section && section.id) {
          sessionStorage.setItem('stackly_saved_anchor', '#' + section.id);
        } else if (target.closest('footer, #siteFooter')) {
          sessionStorage.setItem('stackly_saved_anchor', '#siteFooter');
        } else {
          sessionStorage.removeItem('stackly_saved_anchor');
        }
      } catch (err) {}
    }
  }, true);

  // 3c. Navbar & Header click handler: Clicking navbar links always opens the page at the very top (scroll to 0)
  document.addEventListener('click', (e) => {
    const navLink = e.target.closest('.site-header a, .header-actions a, .dash-topbar a, .sidebar-brand, .brand-logo-link, #mobileMenuDrawer a, .navbar a, nav a, .nav-item a, .dropdown-item');
    if (!navLink) return;
    const rawHref = navLink.getAttribute('href') || '';
    if (rawHref && !rawHref.startsWith('#') && !rawHref.startsWith('javascript:')) {
      try {
        sessionStorage.removeItem('stackly_should_restore_scroll');
        sessionStorage.removeItem('stackly_saved_scroll_y');
        sessionStorage.removeItem('stackly_saved_anchor');
        sessionStorage.setItem('stackly_scroll_to_top', 'true');
      } catch (err) {}
    }
  }, true);

  // 4. Product Carousel arrow controls
  const prodPrev = document.getElementById('prodPrevBtn');
  const prodNext = document.getElementById('prodNextBtn');
  if (prodPrev && prodNext) {
    prodPrev.addEventListener('click', () => {
      if (window.StacklyInteractions) window.StacklyInteractions.prevProducts();
    });
    prodNext.addEventListener('click', () => {
      if (window.StacklyInteractions) window.StacklyInteractions.nextProducts();
    });
  }

  // 5. Testimonial Carousel arrow controls
  const testPrev = document.getElementById('testPrevBtn');
  const testNext = document.getElementById('testNextBtn');
  if (testPrev && testNext) {
    testPrev.addEventListener('click', () => {
      if (window.StacklyInteractions) window.StacklyInteractions.prevTestimonial();
    });
    testNext.addEventListener('click', () => {
      if (window.StacklyInteractions) window.StacklyInteractions.nextTestimonial();
    });
  }

  // 6. Search clear button & Enter navigation
  const searchInput = document.getElementById('headerSearchInput');
  const searchClear = document.getElementById('searchClearBtn');
  if (searchInput) {
    if (searchClear) {
      searchInput.addEventListener('input', () => {
        searchClear.style.display = searchInput.value ? 'block' : 'none';
      });
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        if (window.StacklyInteractions) window.StacklyInteractions.resetFilter();
      });
    }

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('.html');
        if (!isIndex) {
          window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        } else {
          const featuredSec = document.getElementById('featured-products');
          if (featuredSec) {
            featuredSec.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  }

  // 7. Handle URL parameters from external or 404 navigation (?search=... or ?category=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const catParam = urlParams.get('category');

    if (searchParam && window.StacklyInteractions) {
      if (searchInput) {
        searchInput.value = searchParam;
        if (searchClear) searchClear.style.display = 'block';
      }
      setTimeout(() => {
        window.StacklyInteractions.handleSearch(searchParam);
        const featuredSec = document.getElementById('featured-products');
        if (featuredSec) featuredSec.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    } else if (catParam && window.StacklyInteractions) {
      setTimeout(() => {
        window.StacklyInteractions.filterByCategory(catParam);
        const featuredSec = document.getElementById('featured-products');
        if (featuredSec) featuredSec.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    }
  } catch (e) {
    console.warn('URL params parsing failed:', e);
  }

  // 8. Refresh ScrollTrigger once fonts and images are ready
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  });
});

// 9. Mobile menu drawer handling: open via hamburger, close via (X), links, or clicking outside
document.addEventListener("DOMContentLoaded", function () {
  const drawer = document.getElementById("mobileMenuDrawer");
  if (!drawer) return;

  // Track drawer open/close lifecycle on body to prevent background scrolling (for both mobile menu and cart)
  const drawers = [drawer, document.getElementById("cartDrawer")].filter(Boolean);
  drawers.forEach(d => {
    d.addEventListener("show.bs.offcanvas", function () {
      document.body.classList.add("mobile-menu-open");
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    });

    d.addEventListener("hidden.bs.offcanvas", function () {
      document.body.classList.remove("mobile-menu-open");
      cleanupDrawerArtifacts();
    });
  });

  // Listen to close button clicks across all drawers (mobile menu, cart drawer, modals)
  document.querySelectorAll(".btn-close, [data-bs-dismiss='offcanvas']").forEach(btn => {
    const handleClose = function (e) {
      e.preventDefault();
      e.stopPropagation();
      const parentDrawer = btn.closest(".offcanvas") || document.getElementById("mobileMenuDrawer") || document.getElementById("cartDrawer");
      closeAnyDrawer(parentDrawer);
    };
    btn.addEventListener("click", handleClose, true);
    btn.addEventListener("touchend", handleClose, { passive: false });
  });

  // Listen to clicks on navigation links inside drawer
  drawer.querySelectorAll("a[href]").forEach(link => {
    link.addEventListener("click", function (e) {
      const rawHref = (this.getAttribute("href") || "").trim();
      if (!rawHref || rawHref === "#" || rawHref.toLowerCase().startsWith("javascript:")) return;

      // Close the drawer immediately
      closeAnyDrawer(drawer);

      const currentPath = window.location.pathname.replace(/\/$/, "") || "/index.html";
      const currentFile = (currentPath.split("/").pop() || "index.html").toLowerCase();
      const targetClean = decodeURIComponent(rawHref.split("#")[0].split("?")[0]).toLowerCase();

      // In-page hash jump on same page
      if (rawHref.startsWith("#")) {
        const targetEl = document.querySelector(rawHref);
        if (targetEl) {
          e.preventDefault();
          setTimeout(() => targetEl.scrollIntoView({ behavior: "smooth" }), 50);
        }
      } else if (targetClean === currentFile || (targetClean === "index.html" && currentFile === "")) {
        // Same page link -> scroll to top
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Different page link -> navigate immediately
        // Note: do not preventDefault here so the browser or animations module navigates seamlessly
      }
    });
  });
});

// Helper to remove any leftover backdrops or body locks
function cleanupDrawerArtifacts() {
  document.querySelectorAll(".offcanvas-backdrop").forEach(b => b.remove());
  document.body.classList.remove("modal-open", "mobile-menu-open", "menu-open", "nav-open");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
  document.body.style.removeProperty("touch-action");
  document.documentElement.style.removeProperty("overflow");
}

// Global outside click / touch handler to close drawer
function handleGlobalDrawerClose(event) {
  const openDrawers = document.querySelectorAll(".offcanvas.show");
  if (!openDrawers.length) return;

  const clickedTrigger = event.target.closest(".hamburger-btn, .nav-cart-btn");
  const insideAnyDrawer = event.target.closest(".offcanvas");
  const closeBtn = event.target.closest(".btn-close, [data-bs-dismiss='offcanvas']");

  if (closeBtn) {
    const parentDrawer = closeBtn.closest(".offcanvas");
    closeAnyDrawer(parentDrawer);
    return;
  }

  // Clicked on backdrop or outside drawer content
  if (!insideAnyDrawer && !clickedTrigger) {
    openDrawers.forEach(d => closeAnyDrawer(d));
  }
}

document.addEventListener("click", handleGlobalDrawerClose, true);
document.addEventListener("touchend", handleGlobalDrawerClose, { passive: true });

// Universal helper to cleanly close any drawer (mobileMenuDrawer, cartDrawer)
function closeAnyDrawer(drawer) {
  const targetDrawers = drawer ? [drawer] : Array.from(document.querySelectorAll(".offcanvas.show"));

  targetDrawers.forEach(d => {
    if (!d) return;
    try {
      if (window.bootstrap?.Offcanvas) {
        const inst = window.bootstrap.Offcanvas.getInstance(d) || window.bootstrap.Offcanvas.getOrCreateInstance(d);
        if (inst) inst.hide();
      }
    } catch (err) {
      console.warn("Offcanvas close error:", err);
    }

    d.classList.remove("show", "open", "active");
    d.setAttribute("aria-hidden", "true");
    d.style.visibility = "hidden";
    setTimeout(() => {
      d.style.removeProperty("visibility");
    }, 350);
  });

  cleanupDrawerArtifacts();
}

// Legacy alias for compatibility
function closeMobileDrawer(drawer) {
  closeAnyDrawer(drawer);
}

