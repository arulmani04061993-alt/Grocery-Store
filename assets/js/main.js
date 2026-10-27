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
          if (filePath.includes('navbar')) {
            this.highlightCurrentPageNav();
          }
        }
      }
    } catch (e) {
      console.warn(`[StacklyComponents] Note: ${filePath} loaded from inline template (${e.message}).`);
    }
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
