# KokoMart Web Implementation Guide

## 📋 Table of Contents
1. [Technology Stack Recommendations](#technology-stack-recommendations)
2. [Project Setup](#project-setup)
3. [Design System Implementation](#design-system-implementation)
4. [Component Architecture](#component-architecture)
5. [Page Layouts & Responsive Design](#page-layouts--responsive-design)
6. [Firebase Integration](#firebase-integration)
7. [State Management](#state-management)
8. [Authentication System](#authentication-system)
9. [Feature Implementation](#feature-implementation)
10. [API Structure](#api-structure)
11. [Deployment Guide](#deployment-guide)

---

## 🚀 Technology Stack Recommendations

### Option 1: Next.js (Recommended)
```json
{
  "framework": "Next.js 14+ (App Router)",
  "styling": "Vanilla CSS / CSS Modules",
  "icons": "Lucide React",
  "backend": "Firebase (Firestore + Auth)",
  "state": "React Context API + React Query",
  "deployment": "Vercel"
}
```

### Option 2: Vite + React
```json
{
  "framework": "Vite + React 18+",
  "styling": "Vanilla CSS",
  "icons": "Lucide React",
  "backend": "Firebase",
  "state": "Context API",
  "deployment": "Netlify / Vercel"
}
```

### Core Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.7.0",
    "lucide-react": "^0.294.0",
    "@tanstack/react-query": "^5.0.0",
    "react-router-dom": "^6.20.0"
  }
}
```

---

## 🎨 Design System Implementation

### CSS Variables (Global Stylesheet)

```css
/* styles/globals.css */

:root {
  /* Primary Colors */
  --deep-teal: #0E4F63;
  --deep-teal-dark: #0B3F52;
  --orange: #ff7b00ff;
  
  /* Background Colors */
  --cream: #F6E9C8;
  --cream-light: #FFF1D6;
  --white: #FFFFFF;
  
  /* Text Colors */
  --charcoal: #0F1720;
  --price-neutral: #acbbc2ff;
  
  /* Accent Colors */
  --teal-blue: #08424dff;
  --price-up: #1DB954;
  --price-down: #E63946;
  
  /* Spacing Scale */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  --spacing-3xl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 23, 32, 0.05);
  --shadow-md: 0 2px 8px rgba(15, 23, 32, 0.1);
  --shadow-lg: 0 4px 12px rgba(15, 23, 32, 0.15);
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 28px;
  --font-size-4xl: 36px;
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background-color: var(--cream);
  color: var(--charcoal);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility Classes */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
}

.card {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-2xl);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary {
  background: var(--orange);
  color: var(--white);
}

.btn-primary:hover {
  background: #e66f00;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: var(--teal-blue);
  color: var(--white);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.badge-up {
  background: var(--price-up);
  color: var(--white);
}

.badge-down {
  background: var(--price-down);
  color: var(--white);
}
```

### Typography System

```css
/* styles/typography.css */

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.2;
  color: var(--charcoal);
}

h1 {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--spacing-xl);
}

h2 {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-lg);
}

h3 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-md);
}

.text-sm {
  font-size: var(--font-size-sm);
}

.text-base {
  font-size: var(--font-size-base);
}

.text-lg {
  font-size: var(--font-size-lg);
}

.text-muted {
  color: var(--price-neutral);
}

.text-bold {
  font-weight: 700;
}

.text-semibold {
  font-weight: 600;
}
```

---

## 📁 Project Structure

```
kokomart-web/
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Loading.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navigation.jsx
│   │   │   └── MobileMenu.jsx
│   │   ├── product/
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductGrid.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── PriceTicker.jsx
│   │   │   └── WeightSelector.jsx
│   │   ├── cart/
│   │   │   ├── CartItem.jsx
│   │   │   ├── CartSummary.jsx
│   │   │   └── EmptyCart.jsx
│   │   ├── order/
│   │   │   ├── OrderCard.jsx
│   │   │   ├── OrderTimeline.jsx
│   │   │   └── OrderStatus.jsx
│   │   ├── profile/
│   │   │   ├── ProfileCard.jsx
│   │   │   ├── WalletCard.jsx
│   │   │   └── TransactionHistory.jsx
│   │   └── auth/
│   │       ├── LoginForm.jsx
│   │       └── SignupForm.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── Orders.jsx
│   │   ├── Profile.jsx
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── contexts/
│   │   ├── AppContext.jsx
│   │   └── AuthContext.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   ├── productService.js
│   │   ├── orderService.js
│   │   └── userService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   └── useProducts.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── typography.css
│   │   └── responsive.css
│   ├── App.jsx
│   └── main.jsx
├── .env.local
├── package.json
└── vite.config.js / next.config.js
```

---

## 🧩 Component Architecture

### 1. ProductCard Component

```jsx
// components/product/ProductCard.jsx

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart }) {
  const [selectedWeight, setSelectedWeight] = useState(1);
  
  const priceColor = product.price_direction === 'up' 
    ? 'var(--price-up)' 
    : product.price_direction === 'down' 
    ? 'var(--price-down)' 
    : 'var(--price-neutral)';
  
  const Icon = product.price_direction === 'up' ? TrendingUp : TrendingDown;
  
  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img 
          src={product.image} 
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        {product.price_direction !== 'neutral' && (
          <div className={`price-badge badge-${product.price_direction}`}>
            <Icon size={12} />
            <span>{Math.abs(product.price_change_percentage)}%</span>
          </div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-category">{product.category}</p>
        
        <div className="price-row">
          <span className="current-price">₹{product.current_price}/kg</span>
          {product.previous_price !== product.current_price && (
            <span className="previous-price">₹{product.previous_price}</span>
          )}
        </div>
        
        <div className="weight-selector">
          {[1, 1.5, 2].map(weight => (
            <button
              key={weight}
              className={`weight-btn ${selectedWeight === weight ? 'active' : ''}`}
              onClick={() => setSelectedWeight(weight)}
            >
              {weight}kg
            </button>
          ))}
        </div>
        
        <button 
          className="btn btn-primary add-to-cart-btn"
          onClick={() => onAddToCart(product.id, selectedWeight)}
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

```css
/* components/product/ProductCard.css */

.product-card {
  background: var(--white);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  background: var(--cream-light);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.price-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--white);
}

.badge-up {
  background: var(--price-up);
}

.badge-down {
  background: var(--price-down);
}

.product-info {
  padding: var(--spacing-lg);
}

.product-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--charcoal);
  margin-bottom: var(--spacing-xs);
}

.product-category {
  font-size: var(--font-size-sm);
  color: var(--price-neutral);
  margin-bottom: var(--spacing-md);
}

.price-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.current-price {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--charcoal);
}

.previous-price {
  font-size: var(--font-size-sm);
  color: var(--price-neutral);
  text-decoration: line-through;
}

.weight-selector {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.weight-btn {
  flex: 1;
  padding: var(--spacing-sm) 0;
  border: 2px solid var(--cream-light);
  border-radius: var(--radius-md);
  background: var(--cream-light);
  color: var(--charcoal);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.weight-btn:hover {
  border-color: var(--teal-blue);
}

.weight-btn.active {
  background: var(--teal-blue);
  border-color: var(--teal-blue);
  color: var(--white);
}

.add-to-cart-btn {
  width: 100%;
  margin-top: var(--spacing-sm);
}
```

### 2. Header Component

```jsx
// components/layout/Header.jsx

import React, { useState } from 'react';
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { cartItemCount } = useCart();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${searchQuery}`);
  };
  
  return (
    <header className="header">
      <div className="header-container container">
        <div className="header-left">
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className="logo">
            KoKoMart
          </Link>
        </div>
        
        <form className="search-bar" onSubmit={handleSearch}>
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search for chicken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </form>
        
        <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/cart" className="nav-link cart-link">
            <ShoppingCart size={20} />
            Cart
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </Link>
          <Link to="/orders" className="nav-link">Orders</Link>
          
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="nav-link">
                <User size={20} />
                Profile
              </Link>
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
```

```css
/* components/layout/Header.css */

.header {
  background: var(--deep-teal);
  color: var(--cream);
  padding: var(--spacing-lg) 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: var(--shadow-md);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xl);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--cream);
  cursor: pointer;
  padding: var(--spacing-sm);
}

.logo {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--orange);
  text-decoration: none;
  letter-spacing: 0.5px;
}

.search-bar {
  flex: 1;
  max-width: 500px;
  position: relative;
  display: flex;
  align-items: center;
  background: var(--deep-teal-dark);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
}

.search-icon {
  color: var(--price-neutral);
  margin-right: var(--spacing-sm);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--cream);
  font-size: var(--font-size-base);
}

.search-input::placeholder {
  color: var(--price-neutral);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--spacing-2xl);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--cream);
  text-decoration: none;
  font-weight: 600;
  font-size: var(--font-size-base);
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--orange);
}

.cart-link {
  position: relative;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--orange);
  color: var(--white);
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

/* Responsive Design */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }
  
  .search-bar {
    order: 3;
    width: 100%;
    max-width: none;
  }
  
  .header-container {
    flex-wrap: wrap;
  }
  
  .nav-links {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background: var(--deep-teal);
    flex-direction: column;
    align-items: stretch;
    padding: var(--spacing-xl);
    gap: var(--spacing-lg);
    transform: translateX(-100%);
    transition: transform var(--transition-base);
    box-shadow: var(--shadow-lg);
  }
  
  .nav-links.open {
    transform: translateX(0);
  }
  
  .nav-link {
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
  }
  
  .nav-link:hover {
    background: var(--deep-teal-dark);
  }
}
```

### 3. PriceTicker Component

```jsx
// components/product/PriceTicker.jsx

import React, { useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './PriceTicker.css';

export default function PriceTicker({ products }) {
  const tickerRef = useRef(null);
  const topProducts = products.slice(0, 3);
  
  return (
    <div className="price-ticker-section">
      <div className="container">
        <h2 className="ticker-title">Live Prices</h2>
        <div className="ticker-wrapper">
          <div className="ticker-track" ref={tickerRef}>
            {topProducts.map(product => (
              <TickerItem key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TickerItem({ product }) {
  const priceColor = product.price_direction === 'up' 
    ? 'var(--price-up)' 
    : product.price_direction === 'down' 
    ? 'var(--price-down)' 
    : 'var(--price-neutral)';
  
  const Icon = product.price_direction === 'up' ? TrendingUp : TrendingDown;
  
  return (
    <div className="ticker-item">
      <p className="ticker-product-name">{product.name}</p>
      <div className="ticker-price-row">
        <span className="ticker-price">₹{product.current_price}/kg</span>
        {product.price_direction !== 'neutral' && (
          <div className="ticker-change" style={{ background: priceColor }}>
            <Icon size={12} />
            <span>{Math.abs(product.price_change_percentage)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

```css
/* components/product/PriceTicker.css */

.price-ticker-section {
  background: var(--deep-teal-dark);
  padding: var(--spacing-2xl) 0;
  margin-bottom: var(--spacing-3xl);
}

.ticker-title {
  color: var(--cream);
  margin-bottom: var(--spacing-lg);
}

.ticker-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.ticker-wrapper::-webkit-scrollbar {
  display: none;
}

.ticker-track {
  display: flex;
  gap: var(--spacing-xl);
  padding-bottom: var(--spacing-md);
}

.ticker-item {
  flex-shrink: 0;
  background: var(--deep-teal);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  min-width: 180px;
}

.ticker-product-name {
  color: var(--cream-light);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-sm);
}

.ticker-price-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.ticker-price {
  color: var(--cream);
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.ticker-change {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  color: var(--white);
  font-size: var(--font-size-xs);
  font-weight: 700;
}
```

### 4. OrderTimeline Component

```jsx
// components/order/OrderTimeline.jsx

import React from 'react';
import { Package, Scissors, Box, Truck, CheckCircle, Clock } from 'lucide-react';
import './OrderTimeline.css';

const STATUS_CONFIG = {
  pending: { label: 'Order Pending', icon: Clock, color: 'var(--orange)' },
  confirmed: { label: 'Order Confirmed', icon: Package, color: 'var(--teal-blue)' },
  received: { label: 'Order Received', icon: Package, color: 'var(--teal-blue)' },
  cutting: { label: 'Cutting', icon: Scissors, color: 'var(--orange)' },
  packing: { label: 'Packing', icon: Box, color: 'var(--orange)' },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: 'var(--price-up)' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'var(--price-up)' },
  cancelled: { label: 'Cancelled', icon: Box, color: 'var(--price-down)' }
};

export default function OrderTimeline({ currentStatus }) {
  const statuses = ['pending', 'received', 'cutting', 'packing', 'out_for_delivery', 'delivered'];
  const currentIndex = statuses.indexOf(currentStatus);
  
  return (
    <div className="order-timeline">
      {statuses.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={status} className="timeline-step">
            <div className={`timeline-icon ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
              <Icon size={20} />
            </div>
            <div className="timeline-content">
              <p className={`timeline-label ${isCompleted ? 'completed' : ''}`}>
                {config.label}
              </p>
            </div>
            {index < statuses.length - 1 && (
              <div className={`timeline-line ${isCompleted ? 'completed' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

```css
/* components/order/OrderTimeline.css */

.order-timeline {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--cream-light);
}

.timeline-step {
  position: relative;
  padding-left: 50px;
  padding-bottom: var(--spacing-xl);
}

.timeline-step:last-child {
  padding-bottom: 0;
}

.timeline-icon {
  position: absolute;
  left: 0;
  top: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--cream-light);
  color: var(--price-neutral);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.timeline-icon.completed {
  background: var(--teal-blue);
  color: var(--white);
}

.timeline-icon.current {
  background: var(--orange);
  color: var(--white);
  box-shadow: 0 0 0 4px rgba(255, 123, 0, 0.2);
}

.timeline-label {
  font-size: var(--font-size-sm);
  color: var(--price-neutral);
  font-weight: 500;
}

.timeline-label.completed {
  color: var(--charcoal);
  font-weight: 600;
}

.timeline-line {
  position: absolute;
  left: 17px;
  top: 36px;
  width: 2px;
  height: calc(100% - 36px);
  background: var(--cream-light);
}

.timeline-line.completed {
  background: var(--teal-blue);
}
```

---

## 📱 Responsive Design Patterns

### Breakpoints

```css
/* styles/responsive.css */

/* Mobile First Approach */

/* Small devices (phones, 0-640px) */
@media (max-width: 640px) {
  .container {
    padding: 0 var(--spacing-md);
  }
  
  h1 {
    font-size: var(--font-size-3xl);
  }
  
  h2 {
    font-size: var(--font-size-2xl);
  }
}

/* Medium devices (tablets, 641px-1024px) */
@media (min-width: 641px) and (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Large devices (desktops, 1025px and up) */
@media (min-width: 1025px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .container {
    max-width: 1200px;
  }
}

/* Extra large devices (large desktops, 1440px and up) */
@media (min-width: 1440px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .container {
    max-width: 1400px;
  }
}
```

### Grid Layouts

```css
/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
}

/* Cart Layout */
.cart-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xl);
}

@media (min-width: 1024px) {
  .cart-layout {
    grid-template-columns: 2fr 1fr;
  }
}

/* Checkout Layout */
.checkout-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2xl);
}

@media (min-width: 768px) {
  .checkout-layout {
    grid-template-columns: 1.5fr 1fr;
  }
}
```

---

## 🔥 Firebase Integration

### Firebase Configuration

```javascript
// services/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
```

### Environment Variables

```bash
# .env.local

REACT_APP_FIREBASE_API_KEY=AIzaSyChD7SyoC3ESkNfiPK3yXYOAekCVnZHkCs
REACT_APP_FIREBASE_AUTH_DOMAIN=kokomart-e1f08.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=kokomart-e1f08
REACT_APP_FIREBASE_STORAGE_BUCKET=kokomart-e1f08.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=692286395880
REACT_APP_FIREBASE_APP_ID=1:692286395880:web:0e9d51c09b63ed2864005d
REACT_APP_FIREBASE_MEASUREMENT_ID=G-BDQMLF350X
```

### Product Service

```javascript
// services/productService.js

import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  onSnapshot,
  query,
  where 
} from 'firebase/firestore';

export const productService = {
  // Get all products
  getAllProducts: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  // Subscribe to real-time product updates
  subscribeToProducts: (callback) => {
    const q = collection(db, 'products');
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(products);
    }, (error) => {
      console.error('Error subscribing to products:', error);
    });
  },
  
  // Get product by ID
  getProductById: async (id) => {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },
  
  // Search products
  searchProducts: async (searchTerm) => {
    try {
      const products = await productService.getAllProducts();
      return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },
  
  // Seed products (for initial setup)
  seedProduct: async (product) => {
    try {
      await addDoc(collection(db, 'products'), product);
    } catch (error) {
      console.error('Error seeding product:', error);
      throw error;
    }
  }
};
```

### Order Service

```javascript
// services/orderService.js

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs 
} from 'firebase/firestore';

export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        created_at: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },
  
  // Update order status
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updated_at: Date.now()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },
  
  // Subscribe to user orders
  subscribeToUserOrders: (userId, callback) => {
    const q = query(
      collection(db, 'orders'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(orders);
    }, (error) => {
      console.error('Error subscribing to orders:', error);
    });
  },
  
  // Get user orders
  getUserOrders: async (userId) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }
};
```

### User Service

```javascript
// services/userService.js

import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export const userService = {
  // Create user profile
  createUser: async (uid, userData) => {
    try {
      const userRef = doc(db, 'users', uid);
      const newUser = {
        id: uid,
        ...userData,
        created_at: Date.now()
      };
      await setDoc(userRef, newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  // Get user profile
  getUser: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateUser: async (uid, updates) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...updates,
        updated_at: Date.now()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  
  // Update wallet balance
  updateWallet: async (uid, newBalance) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        wallet_points: newBalance,
        updated_at: Date.now()
      });
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }
};
```

---

## 🔐 Authentication Context

```javascript
// contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { userService } from '../services/userService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await userService.getUser(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  const signIn = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };
  
  const signUp = async (email, password, name, phone, address) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      const newProfile = await userService.createUser(userCredential.user.uid, {
        name,
        email,
        phone,
        address,
        is_first_order_completed: false,
        wallet_points: 0
      });
      
      setUserProfile(newProfile);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };
  
  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

---

## 🛒 App Context (Cart & Orders)

```javascript
// contexts/AppContext.jsx

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Subscribe to products
  useEffect(() => {
    const unsubscribe = productService.subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts);
    });
    return unsubscribe;
  }, []);
  
  // Subscribe to user orders
  useEffect(() => {
    if (user) {
      const unsubscribe = orderService.subscribeToUserOrders(user.uid, (userOrders) => {
        setOrders(userOrders);
      });
      return unsubscribe;
    }
  }, [user]);
  
  // Cart operations
  const addToCart = (productId, weight) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === productId && item.weight === weight
      );
      
      if (existing) {
        return prev.map(item =>
          item.product.id === productId && item.weight === weight
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prev, { product, quantity: 1, weight }];
    });
  };
  
  const removeFromCart = (productId, weight) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === productId && item.weight === weight
      );
      
      if (!existing) return prev;
      
      if (existing.quantity === 1) {
        return prev.filter(item => 
          !(item.product.id === productId && item.weight === weight)
        );
      }
      
      return prev.map(item =>
        item.product.id === productId && item.weight === weight
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };
  
  const clearCart = () => setCart([]);
  
  // Cart calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => 
      sum + (item.product.current_price * item.weight * item.quantity), 0
    );
  }, [cart]);
  
  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);
  
  // Place order
  const placeOrder = async (address, deliverySlot, walletUsed) => {
    if (!user || !userProfile) throw new Error('User not authenticated');
    
    const subtotal = cartTotal;
    const discount = userProfile.is_first_order_completed ? 0 : subtotal * 0.1;
    const finalAmount = subtotal - discount - walletUsed;
    const earnedPoints = Math.floor(
      cart.reduce((sum, item) => sum + (item.weight * item.quantity), 0)
    );
    
    const orderId = await orderService.createOrder({
      user_id: user.uid,
      items: cart.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        weight: item.weight,
        price: item.product.current_price
      })),
      total_amount: subtotal,
      discount,
      wallet_used: walletUsed,
      final_amount: finalAmount,
      earned_points: earnedPoints,
      address,
      delivery_slot: deliverySlot
    });
    
    // Update user profile
    if (!userProfile.is_first_order_completed) {
      await userService.updateUser(user.uid, {
        is_first_order_completed: true
      });
    }
    
    if (walletUsed > 0) {
      await userService.updateWallet(
        user.uid, 
        userProfile.wallet_points - walletUsed
      );
    }
    
    if (address && address !== userProfile.address) {
      await userService.updateUser(user.uid, { address });
    }
    
    clearCart();
    return orderId;
  };
  
  // Cancel order
  const cancelOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') return;
    
    await orderService.updateOrderStatus(orderId, 'cancelled');
    
    if (order.wallet_used > 0) {
      await userService.updateWallet(
        user.uid,
        userProfile.wallet_points + order.wallet_used
      );
    }
  };
  
  const value = {
    products,
    cart,
    orders,
    cartTotal,
    cartItemCount,
    addToCart,
    removeFromCart,
    clearCart,
    placeOrder,
    cancelOrder
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
```

---

## 📄 Page Implementations

### Home Page

```jsx
// pages/Home.jsx

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/product/ProductCard';
import PriceTicker from '../components/product/PriceTicker';
import { Search } from 'lucide-react';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { products, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;
  
  const handleAddToCart = (productId, weight) => {
    addToCart(productId, weight);
    // Optional: Show toast notification
  };
  
  return (
    <div className="home-page">
      <PriceTicker products={products} />
      
      <div className="container">
        <div className="home-header">
          <h1>Fresh Products</h1>
          <p className="subtitle">Premium quality chicken delivered fresh to your door</p>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="no-results">
            <Search size={64} />
            <h2>No products found</h2>
            <p>Try adjusting your search</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Cart Page

```jsx
// pages/Cart.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import EmptyCart from '../components/cart/EmptyCart';
import './Cart.css';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, cartTotal, removeFromCart, addToCart } = useApp();
  const { userProfile } = useAuth();
  
  if (cart.length === 0) {
    return <EmptyCart />;
  }
  
  const firstOrderDiscount = userProfile && !userProfile.is_first_order_completed 
    ? cartTotal * 0.1 
    : 0;
  const finalTotal = cartTotal - firstOrderDiscount;
  
  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart ({cart.length} items)</h1>
        
        {firstOrderDiscount > 0 && (
          <div className="discount-banner">
            🎉 First Order 10% OFF Applied!
          </div>
        )}
        
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item, index) => (
              <CartItem
                key={`${item.product.id}-${item.weight}-${index}`}
                item={item}
                onIncrease={() => addToCart(item.product.id, item.weight)}
                onDecrease={() => removeFromCart(item.product.id, item.weight)}
              />
            ))}
          </div>
          
          <CartSummary
            subtotal={cartTotal}
            discount={firstOrderDiscount}
            total={finalTotal}
            onCheckout={() => navigate('/checkout')}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Deployment

### Vercel Deployment (Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

### Netlify Deployment (Vite)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Production deployment
netlify deploy --prod
```

### Build Configuration

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx"
  }
}
```

---

## 📊 Performance Optimization

### Code Splitting

```javascript
// Lazy load pages
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </Suspense>
  );
}
```

### Image Optimization

```jsx
// Use lazy loading for images
<img 
  src={product.image} 
  alt={product.name}
  loading="lazy"
  decoding="async"
/>
```

---

## 🎯 Key Differences from Mobile App

1. **Navigation**: Bottom tabs → Top navigation bar
2. **Gestures**: Touch gestures → Mouse hover effects
3. **Layout**: Single column → Multi-column grid
4. **Typography**: Smaller font sizes → Larger, more readable
5. **Spacing**: Compact → More generous whitespace
6. **Interactions**: Tap → Click + hover states
7. **Forms**: Native inputs → Styled web inputs
8. **Modals**: Full-screen → Centered overlays

---

## ✅ Implementation Checklist

- [ ] Set up project with Vite/Next.js
- [ ] Configure Firebase
- [ ] Implement design system (CSS variables)
- [ ] Create reusable components
- [ ] Build authentication system
- [ ] Implement product catalog
- [ ] Build shopping cart
- [ ] Create checkout flow
- [ ] Implement order tracking
- [ ] Build user profile
- [ ] Add responsive design
- [ ] Optimize performance
- [ ] Test on multiple browsers
- [ ] Deploy to production

---

**This guide provides everything needed to build a pixel-perfect web version of KokoMart!**
