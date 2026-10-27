/**
 * STACKLY — Products Catalog & Management
 * Source of truth for product data matching Reference Images
 */

const STACKLY_PRODUCTS = [
  {
    id: 'prod-strawberries',
    name: 'Fresh Organic Strawberries',
    category: 'Fruits',
    categorySlug: 'fruits',
    price: 4.99,
    previousPrice: 5.99,
    rating: 5,
    reviewCount: 128,
    discountBadge: '20% OFF',
    isNew: false,
    image: 'assets/images/product-strawberries.webp',
    description: 'Sweet, sun-ripened organic strawberries freshly picked from certified local berry farms. Packed in an eco-friendly breathable punnet.',
    unit: '1 lb punnet',
    inStock: true
  },
  {
    id: 'prod-almond-milk',
    name: 'Unsweetened Almond Milk',
    category: 'Dairy Alternatives',
    categorySlug: 'dairy',
    price: 3.50,
    previousPrice: null,
    rating: 5,
    reviewCount: 84,
    discountBadge: null,
    isNew: false,
    image: 'assets/images/product-almond-milk.webp',
    description: 'Pure, silky organic almond milk crafted from California whole almonds. Zero added sugars, carrageenan-free, and calcium fortified.',
    unit: '750 ml carton',
    inStock: true
  },
  {
    id: 'prod-avocados',
    name: 'Hass Avocados (2 Pack)',
    category: 'Vegetables',
    categorySlug: 'vegetables',
    price: 2.99,
    previousPrice: null,
    rating: 5,
    reviewCount: 215,
    discountBadge: null,
    isNew: false,
    image: 'assets/images/product-avocados.webp',
    description: 'Creamy Hass avocados with rich nutty flavor and heart-healthy fats. Perfectly ripe and ready for gourmet salads and guacamole.',
    unit: '2 pack ripe',
    inStock: true
  },
  {
    id: 'prod-honey',
    name: 'Pure Manuka Honey',
    category: 'Pantry',
    categorySlug: 'snacks',
    price: 12.50,
    previousPrice: null,
    rating: 5,
    reviewCount: 42,
    discountBadge: null,
    isNew: true,
    image: 'assets/images/product-honey.webp',
    description: 'Authentic MGO 550+ certified raw Manuka honey straight from pristine New Zealand native forests. Packed with natural bioactive enzymes.',
    unit: '340g glass jar',
    inStock: true
  },
  {
    id: 'deal-harvest-box',
    name: 'Fresh Organic Harvest Box',
    category: 'Curated Boxes',
    categorySlug: 'vegetables',
    price: 24.99,
    previousPrice: 45.00,
    rating: 5,
    reviewCount: 310,
    discountBadge: 'SAVE 45%',
    isNew: false,
    image: 'assets/images/deal-harvest-box.webp',
    description: 'Curated family produce crate featuring 12 hand-selected seasonal organic fruits and crisp farm vegetables. Enough for a healthy week of meals.',
    unit: '12 seasonal varieties',
    inStock: true
  },
  {
    id: 'prod-sourdough',
    name: 'Artisan Sourdough Loaf',
    category: 'Bakery',
    categorySlug: 'bakery',
    price: 4.25,
    previousPrice: 4.99,
    rating: 5,
    reviewCount: 65,
    discountBadge: '15% OFF',
    isNew: false,
    image: 'assets/images/category-bakery.webp',
    description: 'Naturally fermented for 36 hours using stoneground heirloom wheat flour and wild starter. Crisp crust and airy, chewy crumb.',
    unit: '650g loaf',
    inStock: true
  },
  {
    id: 'prod-salmon',
    name: 'Wild Alaskan Salmon Fillet',
    category: 'Meat & Fish',
    categorySlug: 'meat',
    price: 14.99,
    previousPrice: 16.99,
    rating: 5,
    reviewCount: 94,
    discountBadge: null,
    isNew: false,
    image: 'assets/images/category-meat.webp',
    description: 'Sustainably wild-caught in cold Alaskan waters. Rich in natural omega-3 fatty acids with a delicate texture and vibrant color.',
    unit: '1 lb fresh fillet',
    inStock: true
  },
  {
    id: 'prod-trail-mix',
    name: 'Organic Superfood Trail Mix',
    category: 'Snacks',
    categorySlug: 'snacks',
    price: 5.49,
    previousPrice: null,
    rating: 5,
    reviewCount: 110,
    discountBadge: null,
    isNew: true,
    image: 'assets/images/category-snacks.webp',
    description: 'Wholesome mix of roasted almonds, golden walnuts, dried cranberries, banana chips, pumpkin seeds, and toasted oat granola clusters.',
    unit: '350g pouch',
    inStock: true
  }
];

// Product Service helper
const ProductService = {
  getAll() {
    return STACKLY_PRODUCTS;
  },

  getFeatured() {
    // Returns the 4 primary featured products from Reference Image 2
    return STACKLY_PRODUCTS.slice(0, 4);
  },

  getDealOfTheDay() {
    return STACKLY_PRODUCTS.find(p => p.id === 'deal-harvest-box');
  },

  getById(id) {
    return STACKLY_PRODUCTS.find(p => p.id === id);
  },

  filter(categorySlug = null, searchTerm = '') {
    return STACKLY_PRODUCTS.filter(p => {
      const matchCat = !categorySlug || categorySlug === 'all' || p.categorySlug === categorySlug;
      const matchSearch = !searchTerm || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  },

  generateStars(rating = 5) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      stars += `<i class="bi bi-star-fill"></i>`;
    }
    return stars;
  },

  renderCard(product, index = 0) {
    const isFav = window.StacklyInteractions ? window.StacklyInteractions.isFavorite(product.id) : false;
    const animDirection = (index % 2 === 0) ? 'fade-right' : 'fade-left';
    const animDelay = (index % 4) * 80;
    
    return `
      <div class="product-card" data-aos="${animDirection}" data-aos-duration="700" data-aos-delay="${animDelay}" data-product-id="${product.id}" data-category="${product.categorySlug}">
        <div class="product-img-wrapper">
          ${product.discountBadge ? `<span class="product-badge-discount">${product.discountBadge}</span>` : ''}
          ${product.isNew ? `<span class="product-badge-new">NEW</span>` : ''}
          <button class="product-fav-btn ${isFav ? 'active' : ''}" 
                  onclick="window.StacklyInteractions.toggleFavorite('${product.id}', this)"
                  aria-label="Save ${product.name} to wishlist">
            <i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i>
          </button>
          <img src="${product.image}" 
               alt="${product.name}" 
               width="400" 
               height="400" 
               loading="lazy" 
               class="product-thumb-img"
               onclick="window.StacklyInteractions.openQuickView('${product.id}')"
               style="cursor: pointer;">
        </div>

        <span class="product-category-label">${product.category}</span>
        <h3 class="product-title" 
            onclick="window.StacklyInteractions.openQuickView('${product.id}')" 
            style="cursor: pointer;">
          ${product.name}
        </h3>

        <div class="product-rating-row">
          <div class="stars-rating">
            ${this.generateStars(product.rating)}
          </div>
          <span class="reviews-count">(${product.reviewCount})</span>
        </div>

        <div class="product-bottom-row">
          <div class="price-box">
            <span class="current-price">$${product.price.toFixed(2)}</span>
            ${product.previousPrice ? `<span class="previous-price">$${product.previousPrice.toFixed(2)}</span>` : ''}
          </div>
          <button class="btn-add-cart" 
                  onclick="window.StacklyInteractions.addToCart('${product.id}')"
                  aria-label="Add ${product.name} to shopping cart">
            <i class="bi bi-plus-lg"></i>
          </button>
        </div>
      </div>
    `;
  }
};

window.ProductService = ProductService;
