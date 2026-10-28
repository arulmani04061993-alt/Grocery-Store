/**
 * STACKLY — User Interactions & State Management
 * Cart, Favorites, Countdown, Filters, Search, Modals, Toasts
 */

window.StacklyInteractions = {
  cart: [],
  favorites: [],
  currentCategory: 'all',
  currentSearchTerm: '',
  dealTimerInterval: null,
  activeTestimonialIdx: 0,
  carouselOffset: 0,

  init() {
    this.clearNewsletterFeedback();
    this.loadStateFromStorage();
    this.initDealCountdown();
    this.bindEvents();
    this.updateCartBadge();
    this.renderProducts();
    this.updateUserSessionUI();

    // Listen to pageshow/popstate when navigating back so feedback is never shown
    window.addEventListener('pageshow', () => this.clearNewsletterFeedback());
    window.addEventListener('popstate', () => this.clearNewsletterFeedback());
  },

  clearNewsletterFeedback() {
    const msgBox = document.getElementById('newsletterFeedback');
    if (msgBox) {
      msgBox.innerHTML = '';
    }
  },

  updateUserSessionUI() {
    try {
      const stored = localStorage.getItem('stackly_current_user');
      if (stored) {
        const user = JSON.parse(stored);
        const accountLinks = document.querySelectorAll('.header-account-link');
        const target = user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
        const label = user.role === 'admin' ? 'Admin' : (user.email ? user.email.split('@')[0] : 'Dashboard');
        accountLinks.forEach(link => {
          link.href = target;
          const span = link.querySelector('span');
          if (span) span.textContent = label;
          link.title = `Signed in as ${user.email} (${user.role})`;
        });
      }
    } catch (e) {}
  },

  /* ==========================================================================
     LOCAL STORAGE STATE
     ========================================================================== */
  loadStateFromStorage() {
    try {
      const savedCart = localStorage.getItem('stackly_cart');
      if (savedCart) this.cart = JSON.parse(savedCart);

      const savedFavs = localStorage.getItem('stackly_favorites');
      if (savedFavs) this.favorites = JSON.parse(savedFavs);
    } catch (e) {
      console.warn('Storage unavailable:', e);
      this.cart = [];
      this.favorites = [];
    }
  },

  saveCart() {
    try {
      localStorage.setItem('stackly_cart', JSON.stringify(this.cart));
    } catch (e) {}
    this.updateCartBadge();
    this.renderCartDrawer();
  },

  saveFavorites() {
    try {
      localStorage.setItem('stackly_favorites', JSON.stringify(this.favorites));
    } catch (e) {}
  },

  /* ==========================================================================
     SHOPPING CART MANAGEMENT
     ========================================================================== */
  addToCart(productId, qty = 1) {
    const product = window.ProductService.getById(productId);
    if (!product) return;

    const existingIndex = this.cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      this.cart[existingIndex].qty += qty;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: qty,
        unit: product.unit
      });
    }

    this.saveCart();
    this.showToast(`Added <strong>${product.name}</strong> to your basket!`, product.image);
    this.playChime();
    
    // Animate badge
    const badge = document.querySelector('.cart-badge-count');
    if (badge) {
      badge.style.transform = 'scale(1.4)';
      setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
    }
  },

  addCustomItemToCart(item) {
    if (!item || !item.id) return;
    const existingIndex = this.cart.findIndex(i => i.id === item.id);
    if (existingIndex > -1) {
      this.cart[existingIndex].qty += (item.qty || 1);
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price) || 0,
        image: item.image || 'assets/images/logo.webp',
        qty: item.qty || 1,
        unit: item.unit || 'pack'
      });
    }

    this.saveCart();
    this.showToast(`Added <strong>${item.name}</strong> to your basket!`, item.image);
    this.playChime();

    const badge = document.querySelector('.cart-badge-count');
    if (badge) {
      badge.style.transform = 'scale(1.4)';
      setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
    }
  },

  updateCartQuantity(productId, delta) {
    const index = this.cart.findIndex(item => item.id === productId);
    if (index > -1) {
      this.cart[index].qty += delta;
      if (this.cart[index].qty <= 0) {
        this.cart.splice(index, 1);
      }
      this.saveCart();
    }
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
  },

  clearCart() {
    this.cart = [];
    this.saveCart();
  },

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  },

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.qty, 0);
  },

  updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge-count');
    const count = this.getCartCount();
    badges.forEach(b => {
      b.textContent = count;
      b.setAttribute('aria-label', `${count} items in cart`);
    });
  },

  renderCartDrawer() {
    const listEl = document.getElementById('cartDrawerItemsList');
    const subtotalEl = document.getElementById('cartDrawerSubtotal');
    const freeShippingText = document.getElementById('freeShippingText');
    const freeShippingFill = document.getElementById('freeShippingProgressFill');
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    
    if (!listEl) return;

    const total = this.getCartTotal();
    if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;

    // Free shipping threshold: $35
    const threshold = 35.00;
    if (freeShippingText && freeShippingFill) {
      if (total >= threshold) {
        freeShippingText.innerHTML = `<i class="bi bi-check-circle-fill text-success"></i> <strong>Congratulations!</strong> You get FREE 30-min delivery!`;
        freeShippingFill.style.width = '100%';
        freeShippingFill.style.backgroundColor = 'var(--primary-teal)';
      } else {
        const remaining = threshold - total;
        const percent = Math.min((total / threshold) * 100, 100);
        freeShippingText.innerHTML = `Add <strong>$${remaining.toFixed(2)}</strong> more for <strong>FREE 30-min delivery!</strong>`;
        freeShippingFill.style.width = `${percent}%`;
        freeShippingFill.style.backgroundColor = 'var(--primary-teal)';
      }
    }

    if (this.cart.length === 0) {
      listEl.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-basket2 text-muted" style="font-size: 3.5rem;"></i>
          <h5 class="mt-3 font-heading fw-bold">Your basket is empty</h5>
          <p class="text-secondary small">Explore fresh organic fruits, crisp veggies, and snacks!</p>
          <button class="btn btn-primary-teal btn-sm mt-2 px-4" onclick="window.location.href='404.html'">Start Shopping</button>
        </div>
      `;
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    listEl.innerHTML = this.cart.map(item => `
      <div class="cart-drawer-item">
        <img src="${item.image}" alt="${item.name}" class="cart-drawer-item-img">
        <div class="cart-drawer-item-info">
          <div class="cart-drawer-item-title">${item.name}</div>
          <div class="cart-drawer-item-price">$${item.price.toFixed(2)} <span class="text-muted small">/ ${item.unit || 'ea'}</span></div>
          <div class="d-flex align-items-center justify-content-between mt-2">
            <div class="qty-control-box">
              <button class="qty-btn" onclick="window.StacklyInteractions.updateCartQuantity('${item.id}', -1)" aria-label="Decrease quantity">
                <i class="bi bi-dash"></i>
              </button>
              <span class="qty-number">${item.qty}</span>
              <button class="qty-btn" onclick="window.StacklyInteractions.updateCartQuantity('${item.id}', 1)" aria-label="Increase quantity">
                <i class="bi bi-plus"></i>
              </button>
            </div>
            <button class="btn text-danger btn-sm p-0" onclick="window.StacklyInteractions.removeFromCart('${item.id}')" title="Remove item">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  /* ==========================================================================
     FAVORITES / WISHLIST
     ========================================================================== */
  isFavorite(productId) {
    return this.favorites.includes(productId);
  },

  toggleFavorite(productId, btnElement = null) {
    const index = this.favorites.indexOf(productId);
    const product = window.ProductService.getById(productId);

    if (index > -1) {
      this.favorites.splice(index, 1);
      if (btnElement) {
        btnElement.classList.remove('active');
        btnElement.querySelector('i').className = 'bi bi-heart';
      }
      this.showToast(`Removed from favorites`, product?.image);
    } else {
      this.favorites.push(productId);
      if (btnElement) {
        btnElement.classList.add('active');
        btnElement.querySelector('i').className = 'bi bi-heart-fill';
      }
      this.showToast(`Saved <strong>${product?.name || 'item'}</strong> to wishlist!`, product?.image);
      this.playChime(660);
    }

    this.saveFavorites();
  },

  /* ==========================================================================
     DEAL OF THE DAY COUNTDOWN — Section 8
     ========================================================================== */
  initDealCountdown() {
    // End date: set to 14 hours and 45 minutes from now for a realistic live timer
    let endTime = localStorage.getItem('stackly_deal_expiry');
    if (!endTime || parseInt(endTime) <= Date.now()) {
      endTime = Date.now() + (14 * 3600 + 45 * 60 + 30) * 1000;
      localStorage.setItem('stackly_deal_expiry', endTime);
    } else {
      endTime = parseInt(endTime);
    }

    const updateClock = () => {
      const now = Date.now();
      const diff = endTime - now;

      const hrsEl = document.getElementById('dealHours');
      const minsEl = document.getElementById('dealMins');
      const secsEl = document.getElementById('dealSecs');

      if (diff <= 0) {
        if (hrsEl) hrsEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
        const dealText = document.querySelector('.deal-text');
        if (dealText) dealText.innerHTML = '<span class="text-warning fw-bold">This limited deal has expired! Check back tomorrow for the next organic harvest box.</span>';
        clearInterval(this.dealTimerInterval);
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      if (hrsEl) hrsEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
    };

    updateClock();
    this.dealTimerInterval = setInterval(updateClock, 1000);
  },

  claimDealOfTheDay() {
    this.addToCart('deal-harvest-box', 1);
    // Open offcanvas cart
    const cartDrawerEl = document.getElementById('cartDrawer');
    if (cartDrawerEl && typeof bootstrap !== 'undefined') {
      const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(cartDrawerEl);
      bsOffcanvas.show();
    }
  },

  /* ==========================================================================
     PRODUCT FILTERING, CAROUSEL & SEARCH
     ========================================================================== */
  filterByCategory(categorySlug, cardElement = null) {
    this.currentCategory = categorySlug;

    // Update active UI card
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    if (cardElement) {
      cardElement.classList.add('active');
    }

    this.renderProducts();

    // Smooth scroll to featured products section
    const featuredSec = document.getElementById('featured-products');
    if (featuredSec) {
      featuredSec.scrollIntoView({ behavior: 'smooth' });
    }
  },

  handleSearch(searchTerm) {
    this.currentSearchTerm = searchTerm.trim();
    this.renderProducts();
  },

  renderProducts() {
    const container = document.getElementById('featuredProductsGrid');
    if (!container) return;

    let products = [];
    if (this.currentCategory === 'all' && !this.currentSearchTerm) {
      // Default: the 4 featured products from Reference Image 2
      products = window.ProductService.getFeatured();
    } else {
      products = window.ProductService.filter(this.currentCategory, this.currentSearchTerm);
    }

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-search text-muted fs-1"></i>
          <h4 class="mt-3 font-heading fw-bold">No groceries matched "${this.currentSearchTerm}"</h4>
          <p class="text-secondary">Try searching for strawberries, milk, avocados, or honey.</p>
          <button class="btn btn-outline-teal btn-sm mt-2 px-4" onclick="window.StacklyInteractions.resetFilter()">Show All Products</button>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map((p, idx) => window.ProductService.renderCard(p, idx)).join('');

    // Re-trigger scroll / animation refresh
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  },

  resetFilter() {
    this.currentCategory = 'all';
    this.currentSearchTerm = '';
    const searchInput = document.getElementById('headerSearchInput');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    this.renderProducts();
  },

  prevProducts() {
    // Carousel navigation cycle
    const all = window.ProductService.getAll();
    this.carouselOffset = (this.carouselOffset - 1 + all.length) % all.length;
    const items = [
      all[this.carouselOffset % all.length],
      all[(this.carouselOffset + 1) % all.length],
      all[(this.carouselOffset + 2) % all.length],
      all[(this.carouselOffset + 3) % all.length]
    ];
    const container = document.getElementById('featuredProductsGrid');
    if (container) {
      container.innerHTML = items.map((p, idx) => window.ProductService.renderCard(p, idx)).join('');
      if (typeof AOS !== 'undefined') AOS.refresh();
    }
  },

  nextProducts() {
    const all = window.ProductService.getAll();
    this.carouselOffset = (this.carouselOffset + 1) % all.length;
    const items = [
      all[this.carouselOffset % all.length],
      all[(this.carouselOffset + 1) % all.length],
      all[(this.carouselOffset + 2) % all.length],
      all[(this.carouselOffset + 3) % all.length]
    ];
    const container = document.getElementById('featuredProductsGrid');
    if (container) {
      container.innerHTML = items.map((p, idx) => window.ProductService.renderCard(p, idx)).join('');
      if (typeof AOS !== 'undefined') AOS.refresh();
    }
  },

  /* ==========================================================================
     TESTIMONIALS CAROUSEL
     ========================================================================== */
  prevTestimonial() {
    const cards = document.querySelectorAll('.testimonial-card');
    if (!cards.length) return;
    this.activeTestimonialIdx = (this.activeTestimonialIdx - 1 + cards.length) % cards.length;
    cards.forEach((c, idx) => {
      c.style.display = (window.innerWidth < 992 && idx !== this.activeTestimonialIdx) ? 'none' : 'flex';
    });
  },

  nextTestimonial() {
    const cards = document.querySelectorAll('.testimonial-card');
    if (!cards.length) return;
    this.activeTestimonialIdx = (this.activeTestimonialIdx + 1) % cards.length;
    cards.forEach((c, idx) => {
      c.style.display = (window.innerWidth < 992 && idx !== this.activeTestimonialIdx) ? 'none' : 'flex';
    });
  },

  /* ==========================================================================
     TOAST NOTIFICATION & AUDIO FEEDBACK
     ========================================================================== */
  showToast(message, imageUrl = null) {
    let toast = document.getElementById('stacklyToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'stacklyToast';
      toast.className = 'stackly-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      ${imageUrl ? `<img src="${imageUrl}" alt="Product" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover;">` : `
        <div class="toast-icon-check"><i class="bi bi-check-lg"></i></div>
      `}
      <div class="toast-body-text" style="font-size: 0.95rem;">${message}</div>
      <button class="btn btn-sm btn-primary-teal ms-3 py-1 px-3" onclick="window.StacklyInteractions.openCartDrawer()">View Cart</button>
    `;

    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  },

  playChime(freq = 520) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  },

  openCartDrawer() {
    const cartDrawerEl = document.getElementById('cartDrawer');
    if (cartDrawerEl && typeof bootstrap !== 'undefined') {
      const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(cartDrawerEl);
      bsOffcanvas.show();
    }
  },

  /* ==========================================================================
     MODALS: QUICK VIEW, RECIPES, STORE MAP, APP PROMO
     ========================================================================== */
  openQuickView(productId) {
    const product = window.ProductService.getById(productId);
    if (!product) return;

    const modalBody = document.getElementById('quickViewModalBody');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="row g-4 align-items-center">
          <div class="col-md-6">
            <div class="rounded-4 overflow-hidden border">
              <img src="${product.image}" alt="${product.name}" class="w-100 object-fit-cover">
            </div>
          </div>
          <div class="col-md-6">
            <span class="product-category-label">${product.category}</span>
            <h3 class="font-heading fw-bold mb-2">${product.name}</h3>
            <div class="d-flex align-items-center gap-2 mb-3">
              <div class="stars-rating">${window.ProductService.generateStars(product.rating)}</div>
              <span class="reviews-count">(${product.reviewCount} customer reviews)</span>
            </div>
            <div class="price-box mb-3">
              <span class="current-price fs-2">$${product.price.toFixed(2)}</span>
              ${product.previousPrice ? `<span class="previous-price fs-5">$${product.previousPrice.toFixed(2)}</span>` : ''}
              <span class="badge bg-light text-dark border ms-2">${product.unit}</span>
            </div>
            <p class="text-secondary mb-4">${product.description}</p>
            <div class="d-flex align-items-center gap-3">
              <button class="btn btn-primary-teal flex-grow-1" onclick="window.StacklyInteractions.addToCart('${product.id}'); bootstrap.Modal.getInstance(document.getElementById('quickViewModal')).hide();">
                <i class="bi bi-cart-plus me-2"></i> Add to Basket
              </button>
              <button class="btn btn-outline-secondary p-2" onclick="window.StacklyInteractions.toggleFavorite('${product.id}', this)" title="Add to Wishlist">
                <i class="bi ${this.isFavorite(product.id) ? 'bi-heart-fill text-danger' : 'bi-heart'} fs-5"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      const modalEl = document.getElementById('quickViewModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
      }
    }
  },

  openRecipesModal() {
    const modalEl = document.getElementById('recipesModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
    }
  },

  openStoreMapModal() {
    const modalEl = document.getElementById('storeMapModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
    }
  },

  openAppStoreModal(platform = 'iOS / Android') {
    const titleEl = document.getElementById('appModalPlatform');
    if (titleEl) titleEl.textContent = platform;
    const modalEl = document.getElementById('appPromoModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
    }
  },

  openAccountModal() {
    const modalEl = document.getElementById('accountModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
    }
  },

  /* ==========================================================================
     NEWSLETTER FORM VALIDATION — Section 12
     ========================================================================== */
  handleNewsletterSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletterEmailInput');
    const msgBox = document.getElementById('newsletterFeedback');
    if (!emailInput || !msgBox) return;

    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      msgBox.innerHTML = `<span class="badge bg-danger text-white py-2 px-3 mt-2"><i class="bi bi-exclamation-triangle-fill me-1"></i> Please enter a valid email address.</span>`;
      return;
    }

    // Directly navigate to 404 with exact scroll position preservation
    msgBox.innerHTML = '';
    emailInput.value = '';

    const currentY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
    try {
      sessionStorage.setItem('stackly_saved_scroll_y', currentY.toString());
      sessionStorage.setItem('stackly_saved_scroll_url', window.location.href);
      sessionStorage.setItem('stackly_should_restore_scroll', 'true');
      sessionStorage.setItem('stackly_saved_anchor', '#newsletter');
    } catch (err) {}

    const submitBtn = e.target.querySelector('button[type="submit"]') || e.target;
    if (window.StacklyAnimations && typeof window.StacklyAnimations.triggerPageTransition === 'function') {
      window.StacklyAnimations.triggerPageTransition('404.html', submitBtn);
    } else {
      window.location.href = '404.html';
    }
  },

  /* ==========================================================================
     EVENT BINDINGS
     ========================================================================== */
  bindEvents() {
    // Search inputs (header & mobile)
    const searchInput = document.getElementById('headerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    const mobileSearchInput = document.getElementById('mobileSearchInput');
    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Newsletter form
    const newsForm = document.getElementById('homeNewsletterForm');
    if (newsForm) {
      newsForm.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));
    }

    // Back to top
    const backToTop = document.getElementById('backToTopBtn');
    if (backToTop) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      });
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Offcanvas Cart Drawer Show listener to refresh list
    const cartDrawerEl = document.getElementById('cartDrawer');
    if (cartDrawerEl) {
      cartDrawerEl.addEventListener('show.bs.offcanvas', () => {
        this.renderCartDrawer();
      });
    }

    // Proceed to Checkout -> redirect to 404.html
    document.addEventListener('click', (e) => {
      const checkoutBtn = e.target.closest('#cartCheckoutBtn, .btn-service-primary');
      if (checkoutBtn && checkoutBtn.textContent && checkoutBtn.textContent.includes('Proceed to Checkout')) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '404.html';
      }
    });
  }
};
