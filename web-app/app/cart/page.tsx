'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, TicketPercent, Sparkles } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function CartPage() {
    const router = useRouter();
    const { cart, addToCart, removeFromCart, cartTotal, user } = useApp();

    const firstOrderDiscount = !user.is_first_order_completed ? cartTotal * 0.1 : 0;
    const finalTotal = Math.max(0, cartTotal - firstOrderDiscount);

    if (cart.length === 0) {
        return (
            <div>
                {/* Mobile header */}
                <div className="page-header">
                    <div className="page-header-row">
                        <h1>My Cart</h1>
                        <span className="header-badge">0 items</span>
                    </div>
                </div>
                <div className="scroll-content" style={{ paddingTop: 48 }}>
                    {/* Desktop title */}
                    <h1 className="desktop-page-title">My Cart</h1>
                    <div className="empty-state">
                        <div className="empty-icon-bg">
                            <ShoppingBag size={64} color="var(--deep-teal)" />
                        </div>
                        <h2 className="empty-title">Your Cart is Empty</h2>
                        <p className="empty-subtitle">Looks like you haven't added any fresh cuts yet.</p>
                        <Link href="/" className="empty-btn">Start Shopping</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Mobile header */}
            <div className="page-header">
                <div className="page-header-row">
                    <h1>My Cart</h1>
                    <span className="header-badge">{cart.length} items</span>
                </div>
            </div>

            <div className="scroll-content" style={{ paddingTop: 32 }}>
                {/* Desktop title */}
                <h1 className="desktop-page-title">My Cart</h1>

                {!user.is_first_order_completed && (
                    <div className="discount-banner" style={{ marginBottom: 28 }}>
                        <div className="discount-icon-box">
                            <TicketPercent size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="discount-title">First Order Offer Applied!</div>
                            <div className="discount-subtitle">You'll save 10% on this order as a welcome gift.</div>
                        </div>
                        <Sparkles size={24} color="var(--cream)" style={{ opacity: 0.8 }} />
                    </div>
                )}

                {/* 2-column desktop layout: items left, summary right */}
                <div className="cart-desktop-layout">
                    {/* Left: cart items */}
                    <div>
                        <div className="cart-list">
                            {cart.map((item, index) => (
                                <div key={`${item.product.id}-${item.weight}-${index}`} className="cart-card">
                                    <img src={item.product.image} alt={item.product.name} className="cart-item-img" />
                                    <div className="cart-item-info">
                                        <div className="cart-item-name">{item.product.name}</div>
                                        <div className="cart-item-variant">
                                            {item.weight}kg {item.cuttingType ? `• ${item.cuttingType}` : ''}
                                        </div>
                                        <div className="cart-item-price">
                                            ₹{(item.product.current_price * item.weight * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="cart-controls">
                                        <button className="ctrl-btn" onClick={() => removeFromCart(item.product.id, item.weight, item.cuttingType)}>
                                            {item.quantity === 1
                                                ? <Trash2 size={16} color="var(--price-down)" />
                                                : <Minus size={16} color="var(--charcoal)" />
                                            }
                                        </button>
                                        <span className="ctrl-qty">{item.quantity}</span>
                                        <button className="ctrl-btn" onClick={() => addToCart(item.product.id, 1, item.weight, item.cuttingType)}>
                                            <Plus size={16} color="var(--charcoal)" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right column: summary + checkout button */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="summary-card">
                            <h3 className="summary-card-title">Bill Summary</h3>
                            <div className="summary-row">
                                <span className="summary-label">Subtotal</span>
                                <span className="summary-value">₹{cartTotal.toFixed(2)}</span>
                            </div>
                            {firstOrderDiscount > 0 && (
                                <div className="summary-row">
                                    <span className="summary-label" style={{ color: 'var(--price-up)' }}>First Order Discount (10%)</span>
                                    <span className="summary-value" style={{ color: 'var(--price-up)' }}>-₹{firstOrderDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="divider-line" />
                            <div className="total-row">
                                <span className="total-label">Total Payable</span>
                                <span className="total-value">₹{finalTotal.toFixed(2)}</span>
                            </div>
                            <div className="points-badge">
                                <span>🐔</span>
                                <span>
                                    You'll earn <strong>{Math.floor(cart.reduce((s, i) => s + i.weight * i.quantity, 0))}</strong> Chicken Points
                                </span>
                            </div>
                        </div>

                        {/* Inline checkout footer (becomes fixed on mobile via CSS) */}
                        <div className="cart-footer">
                            <div>
                                <div className="footer-total-label">Total</div>
                                <div className="footer-total-value">₹{finalTotal.toFixed(2)}</div>
                            </div>
                            <Link href="/checkout" className="checkout-btn">
                                Checkout
                                <ArrowRight size={20} color="var(--white)" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div style={{ height: 20 }} />
            </div>
        </div>
    );
}
