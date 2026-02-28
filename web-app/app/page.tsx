'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, TrendingDown, ShoppingCart, ArrowRight, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Product } from '@/types';
import CuttingModal from '@/components/CuttingModal';

export default function HomePage() {
  const router = useRouter();
  const { products, addToCart, cartItemCount, cart, removeFromCart, cartTotal } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState<{ id: string; weight: number; cuttingTypes?: string[]; variants?: any[] } | null>(null);

  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const topProducts = products.slice(0, 8);

  const handleAddToCartRequest = (product: Product, weight: number) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProductData({ id: product.id, weight, variants: product.variants });
      setModalVisible(true);
    } else if (product.cutting_types && product.cutting_types.length > 0) {
      setSelectedProductData({ id: product.id, weight, cuttingTypes: product.cutting_types });
      setModalVisible(true);
    } else {
      addToCart(product.id, 1, weight);
    }
  };

  const handleRemoveFromCart = (productId: string, weight: number) => {
    const itemToRemove = cart.find(item => item.product.id === productId && item.weight === weight);
    if (itemToRemove) removeFromCart(productId, weight, itemToRemove.cuttingType);
  };

  const handleCuttingTypeSelect = (cuttingType: string) => {
    if (selectedProductData) {
      addToCart(selectedProductData.id, 1, selectedProductData.weight, cuttingType);
      setModalVisible(false);
      setSelectedProductData(null);
    }
  };

  const getProductQuantityInCart = (productId: string, weight: number) => {
    return cart.filter(item => item.product.id === productId && item.weight === weight)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div>
      {/* Mobile Header — hidden on desktop via CSS */}
      <div className="page-header">
        <div className="page-header-row">
          <span className="brand">Meat Up</span>
          <Link href="/cart" className="cart-icon-btn" style={{ position: 'relative', color: 'var(--cream)', display: 'flex', alignItems: 'center' }}>
            <ShoppingCart size={24} />
            {cartItemCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--orange)', borderRadius: 10, minWidth: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: 'var(--white)',
                border: '1.5px solid var(--deep-teal)'
              }}>{cartItemCount}</span>
            )}
          </Link>
        </div>
        <div className="search-bar" style={{ margin: '16px 0 0' }}>
          <Search size={18} color="rgba(99,2,12,0.5)" />
          <input
            placeholder="Search for fresh cuts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="scroll-content" style={{ paddingTop: 32 }}>
        {/* Desktop search bar — shown only on desktop via CSS */}
        <div className="desktop-search-bar">
          <Search size={20} color="rgba(99,2,12,0.5)" />
          <input
            placeholder="Search for fresh cuts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Live Ticker */}
        {topProducts.length > 0 && (
          <div className="ticker-section">
            <div className="ticker-header">
              <div className="live-dot" />
              <span className="ticker-title">LIVE MARKET</span>
            </div>
            <div className="ticker-scroll" style={{ paddingBottom: 8 }}>
              {topProducts.map(product => (
                <TickerItem key={product.id} product={product} onClick={() => router.push(`/product/${product.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div>
          <h2 className="section-title">Fresh Products</h2>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
              {products.length === 0 ? 'Loading products...' : 'No products found'}
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => router.push(`/product/${product.id}`)}
                  onAddToCart={w => handleAddToCartRequest(product, w)}
                  onRemoveFromCart={w => handleRemoveFromCart(product.id, w)}
                  quantityInCart={w => getProductQuantityInCart(product.id, w)}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 80 }} />
      </div>

      {/* Floating Cart */}
      {cartItemCount > 0 && (
        <div className="float-cart">
          <Link href="/cart" className="float-cart-btn" style={{ display: 'flex' }}>
            <div className="float-cart-left">
              <div className="float-icon-bg">
                <ShoppingBag size={20} color="var(--deep-teal)" />
                <div className="float-badge">{cartItemCount}</div>
              </div>
              <div>
                <div className="float-cart-label">Total</div>
                <div className="float-cart-value">₹{cartTotal.toFixed(2)}</div>
              </div>
            </div>
            <div className="float-cart-right">
              <span>View Cart</span>
              <ArrowRight size={18} color="var(--white)" />
            </div>
          </Link>
        </div>
      )}

      <CuttingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleCuttingTypeSelect}
        options={selectedProductData?.cuttingTypes}
        variants={selectedProductData?.variants}
        title={selectedProductData?.variants ? "Select Type" : "Select Cutting Type"}
      />
    </div>
  );
}

function TickerItem({ product, onClick }: { product: Product; onClick?: () => void }) {
  const isUp = product.price_direction === 'up';
  const isDown = product.price_direction === 'down';
  const color = isUp ? '#1DB954' : isDown ? '#E63946' : '#ffc2c2';

  return (
    <div className="ticker-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="ticker-item-name">{product.name}</div>
      <div className="ticker-item-row">
        <span className="ticker-price">₹{product.current_price}</span>
        {product.price_direction !== 'neutral' && (
          <span className="ticker-change" style={{ color }}>
            {isUp ? <TrendingUp size={12} color={color} /> : <TrendingDown size={12} color={color} />}
            {Math.abs(product.price_change_percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, onPress, onAddToCart, onRemoveFromCart, quantityInCart }: {
  product: Product;
  onPress: () => void;
  onAddToCart: (w: number) => void;
  onRemoveFromCart: (w: number) => void;
  quantityInCart: (w: number) => number;
}) {
  const getDefaultWeight = () => {
    if (product.unit === 'kg') return 1;
    if (product.unit === 'g') return 250;
    return 1;
  };

  const [selectedWeight, setSelectedWeight] = useState(getDefaultWeight());
  const quantity = quantityInCart(selectedWeight);
  const priceQty = product.price_quantity || 1;

  const getOptions = () => {
    if (product.unit === 'kg') return [0.5, 1, 2];
    if (product.unit === 'g') return [250, 500, 1000];
    if (product.unit === 'pc' || product.unit === 'pack') return [1, 2, 4];
    return [1, 2, 5];
  };

  const options = getOptions();

  return (
    <div className="product-card">
      <img
        src={product.image}
        alt={product.name}
        className="product-card-img"
        onClick={onPress}
        style={{ cursor: 'pointer' }}
      />
      <div className="product-card-content">
        <div className="card-header-row">
          <h3 className="card-title" onClick={onPress} style={{ cursor: 'pointer' }}>{product.name}</h3>
          <div className="price-tag">
            <span className="price-tag-text">₹{product.current_price}</span>
            <span className="price-unit">/{product.unit}</span>
          </div>
        </div>
        <p className="card-desc">{product.description}</p>

        <div className="variant-container">
          {options.map(opt => {
            const label = (product.unit === 'kg' || product.unit === 'g')
              ? `${opt}${product.unit}`
              : `${opt * priceQty} ${product.unit}`;
            const isSelected = selectedWeight === opt;
            return (
              <button
                key={opt}
                className={`variant-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedWeight(opt)}
              >
                {label}
              </button>
            );
          })}
        </div>

        {quantity === 0 ? (
          <button className="add-btn" onClick={() => onAddToCart(selectedWeight)}>ADD</button>
        ) : (
          <div className="qty-container">
            <button className="qty-btn" onClick={() => onRemoveFromCart(selectedWeight)}>
              <Minus size={16} />
            </button>
            <span className="qty-text">{quantity}</span>
            <button className="qty-btn" onClick={() => onAddToCart(selectedWeight)}>
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
