# STACKLY — Premium Organic Grocery E-Commerce Website

A production-grade, highly optimized organic grocery e-commerce web application engineered with HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5.3, GSAP 3 with ScrollTrigger, and AOS.

Recreated with pixel accuracy according to the reference designs.

---

## 🌟 Key Features & Implementation Highlights

1. **Pixel-Accurate Reference Matching**:
   - Recreated top navigation, hero section, 6-card category row, 4-card featured products, dark teal Deal of the Day banner, 3-column benefits, 3-card customer testimonials, mobile app promotion with HTML/CSS dual smartphone mockups, centered teal newsletter, and 4-column footer.

2. **2-Second Strict Logo Intro Preloader**:
   - Master GSAP timeline with exact 2.0-second total duration.
   - Smooth entrance, glow pulse, progress fill, and seamless fade-out into the hero reveal.
   - Respects `prefers-reduced-motion` and includes zero-delay safety fallback.

3. **High-Performance Image Optimization**:
   - Every single local image is in **WebP format** and **strictly below 90 KB** (targeting 20–87 KB).
   - Responsive `width` and `height` attributes to prevent Cumulative Layout Shift (CLS).
   - Eager-loaded hero crate photograph; lazy-loaded below-the-fold media.

4. **Interactive E-Commerce State Management**:
   - Working Add to Cart with live count badge and sliding Offcanvas Cart Drawer.
   - Real-time cart subtotal and free shipping progress meter ($35.00 threshold).
   - Interactive quantity controls (`+` and `-`) and item removal.
   - LocalStorage persistence for demo cart and wishlist favorites.
   - Real-time JavaScript countdown for Deal of the Day (Hours, Minutes, Seconds).
   - Live search input auto-filtering products instantly.
   - Category filtering with smooth transition between item sets.
   - Interactive modals for Quick View, Seasonal Farm Recipes, Mobile App Preview, and Flagship Store Google Maps embed.
   - Interactive Toast notifications with audio feedback (Web Audio API synthetic chime).

---

## 📊 Image Optimization Report

All images were generated, converted to WebP, and verified programmatically with Pillow:

| Image Filename | Dimensions | Format | File Size | Compliance (<90 KB) |
|---|---|---|---|---|
| `logo.webp` | 1267x373 | WEBP | 32.17 KB | **PASSED (<90 KB)** |
| `hero-organic-vegetables.webp` | 1000x747 | WEBP | 87.40 KB | **PASSED (<90 KB)** |
| `deal-harvest-box.webp` | 700x700 | WEBP | 73.07 KB | **PASSED (<90 KB)** |
| `product-strawberries.webp` | 600x600 | WEBP | 43.99 KB | **PASSED (<90 KB)** |
| `product-almond-milk.webp` | 600x600 | WEBP | 29.64 KB | **PASSED (<90 KB)** |
| `product-avocados.webp` | 600x600 | WEBP | 21.96 KB | **PASSED (<90 KB)** |
| `product-honey.webp` | 600x600 | WEBP | 28.11 KB | **PASSED (<90 KB)** |
| `customer-sarah.webp` | 450x450 | WEBP | 32.75 KB | **PASSED (<90 KB)** |
| `customer-michael.webp` | 450x450 | WEBP | 24.51 KB | **PASSED (<90 KB)** |
| `customer-emily.webp` | 450x450 | WEBP | 34.69 KB | **PASSED (<90 KB)** |
| `category-snacks.webp` | 450x450 | WEBP | 26.71 KB | **PASSED (<90 KB)** |
| `category-fruits.webp` | 400x400 | WEBP | 29.34 KB | **PASSED (<90 KB)** |
| `category-vegetables.webp` | 400x400 | WEBP | 30.82 KB | **PASSED (<90 KB)** |
| `category-dairy.webp` | 400x400 | WEBP | 12.31 KB | **PASSED (<90 KB)** |
| `category-bakery.webp` | 400x400 | WEBP | 51.16 KB | **PASSED (<90 KB)** |
| `category-meat.webp` | 400x400 | WEBP | 39.89 KB | **PASSED (<90 KB)** |
| `app-preview.webp` | 635x850 | WEBP | 34.46 KB | **PASSED (<90 KB)** |
| `login-banner.webp` | 747x1000 | WEBP | 84.94 KB | **PASSED (<90 KB)** |
| `bundle-breakfast-crate.webp` | 750x560 | WEBP | 55.01 KB | **PASSED (<90 KB)** |
| `bundle-family-harvest.webp` | 750x560 | WEBP | 53.24 KB | **PASSED (<90 KB)** |
| `farm-partner-orchard.webp` | 750x560 | WEBP | 83.34 KB | **PASSED (<90 KB)** |
| `farm-partner-grower.webp` | 750x560 | WEBP | 76.00 KB | **PASSED (<90 KB)** |
| `recipe-avocado-bowl.webp` | 750x560 | WEBP | 71.88 KB | **PASSED (<90 KB)** |
| `recipe-berry-smoothie.webp` | 750x560 | WEBP | 58.60 KB | **PASSED (<90 KB)** |

---

## 📁 Project Structure

```
STACKLY-Organic-Grocery/
├── index.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── responsive.css
│   │   └── animations.css
│   ├── js/
│   │   ├── main.js
│   │   ├── animations.js
│   │   ├── products.js
│   │   └── interactions.js
│   ├── images/
│   │   ├── logo.webp
│   │   ├── hero-organic-vegetables.webp
│   │   ├── category-fruits.webp
│   │   ├── category-vegetables.webp
│   │   ├── category-dairy.webp
│   │   ├── category-bakery.webp
│   │   ├── category-meat.webp
│   │   ├── category-snacks.webp
│   │   ├── product-strawberries.webp
│   │   ├── product-almond-milk.webp
│   │   ├── product-avocados.webp
│   │   ├── product-honey.webp
│   │   ├── deal-harvest-box.webp
│   │   ├── customer-sarah.webp
│   │   ├── customer-michael.webp
│   │   ├── customer-emily.webp
│   │   ├── app-preview.webp
│   │   └── login-banner.webp
│   └── media/
└── README.md
```

---

## 🚀 Running the Project Locally

To run the project with any local HTTP static server:

### Option 1: Python Built-in HTTP Server (Recommended)
```bash
# Navigate to the project root directory
cd "c:\Users\Admin\OneDrive\Desktop\Grocery"

# Start the web server on port 8000
python -m http.server 8000
```
Then open your browser and navigate to:
[http://localhost:8000](http://localhost:8000)

### Option 2: Node.js `npx serve` or `http-server`
```bash
npx -y serve . -l 8000
```

---

## 📱 Responsive Testing Coverage

The application has been tested and verified across:
- **1440px+**: Desktop Ultra-wide layout with full 6-category horizontal row, 4-product grid, and expansive 2-column hero.
- **1024px**: Laptop & standard screens with balanced spacing.
- **768px**: Tablet view with responsive wrapping, touch-friendly buttons, and vertical card alignment.
- **390px**: Modern mobile view (iPhone 14/15/16) with offcanvas navigation and stacked hero.
- **320px**: Compact mobile view with no horizontal overflow.

---

## 📄 License
Created for STACKLY Organic Grocery. All rights reserved.
# Grocery-Store
