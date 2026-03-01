'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, Wallet, Navigation, FileText, CheckCircle2, TicketPercent, Sparkles } from 'lucide-react';
import Script from 'next/script';
import { useApp } from '@/contexts/AppContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { calculateDistance, calculateDeliveryTime, STORE_LOCATION } from '@/utils/locationUtils';
import OrderSuccessModal from '@/components/OrderSuccessModal';

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, cartTotal, user, placeOrder } = useApp();
    const [address, setAddress] = useState(user.address || '');
    const [useWalletPoints, setUseWalletPoints] = useState(false);
    const [note, setNote] = useState('');
    const [orderSuccessVisible, setOrderSuccessVisible] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);
    const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
    const [deliveryTime, setDeliveryTime] = useState<number | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const firstOrderDiscount = !user.is_first_order_completed ? cartTotal * 0.1 : 0;
    const taxRate = 0;
    const taxAmount = cartTotal * taxRate;
    const freeDistance = 7.5;
    const ratePerKm = 3;
    let deliveryCharge = 0;
    if (deliveryDistance && deliveryDistance > freeDistance) {
        deliveryCharge = Math.ceil((deliveryDistance - freeDistance) * ratePerKm);
    }
    const maxWalletRedemption = Math.min(user.wallet_points, cartTotal - firstOrderDiscount + taxAmount + deliveryCharge);
    const walletDeduction = useWalletPoints ? maxWalletRedemption : 0;
    const finalTotal = Math.max(0, cartTotal + taxAmount + deliveryCharge - firstOrderDiscount - walletDeduction);

    useEffect(() => { getCurrentLocation(); }, []);

    useEffect(() => {
        if (!address.trim()) return;
        const timer = setTimeout(() => calculateFromAddress(), 1500);
        return () => clearTimeout(timer);
    }, [address]);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) { setLocationError('Geolocation not supported'); return; }
        setLocationLoading(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const dist = calculateDistance(latitude, longitude, STORE_LOCATION.latitude, STORE_LOCATION.longitude);
                setDeliveryDistance(parseFloat((dist * 1.4).toFixed(1)));
                setDeliveryTime(calculateDeliveryTime(dist));
                if (!address) {
                    try {
                        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await resp.json();
                        if (data.display_name) setAddress(data.display_name);
                    } catch { }
                }
                setLocationLoading(false);
            },
            () => { setLocationError('Could not fetch location'); setLocationLoading(false); }
        );
    };

    const calculateFromAddress = async () => {
        if (!address.trim()) return;
        setLocationLoading(true);
        setLocationError(null);
        try {
            const encoded = encodeURIComponent(address);
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`);
            const data = await resp.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                const dist = calculateDistance(lat, lon, STORE_LOCATION.latitude, STORE_LOCATION.longitude);
                setDeliveryDistance(parseFloat((dist * 1.4).toFixed(1)));
                setDeliveryTime(calculateDeliveryTime(dist));
            } else {
                setLocationError('Could not find location. Try "City, State - Pincode".');
            }
        } catch { setLocationError('Error calculating distance'); }
        finally { setLocationLoading(false); }
    };

    const handlePlaceOrder = async () => {
        if (!address.trim()) { alert('Please enter delivery address'); return; }
        const slotString = deliveryTime ? `Within ${deliveryTime} mins` : 'Standard Delivery';

        if (paymentMethod === 'cod') {
            try {
                // COD Flow
                const result = await placeOrder(address, slotString, walletDeduction, note, deliveryCharge);
                if (!result) throw new Error("Order placement failed");
                setPlacedOrderId(result.display_id);
                setOrderSuccessVisible(true);
            } catch {
                alert('Failed to place order. Please try again.');
            }
        } else {
            // Online Payment Flow
            setIsProcessingPayment(true);
            try {
                const functions = getFunctions();
                const createOrderCallable = httpsCallable(functions, 'createRazorpayOrder');
                const functionResponse = await createOrderCallable({ amount: finalTotal, currency: 'INR' });
                const orderData = functionResponse.data as any;

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', // Safe to expose public key
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: 'Meat UP',
                    description: 'Secure Payment',
                    order_id: orderData.id,
                    handler: async function (response: any) {
                        try {
                            const result = await placeOrder(address, slotString, walletDeduction, note, deliveryCharge, {
                                payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id
                            });
                            if (!result) throw new Error("Order placement failed");
                            setPlacedOrderId(result.display_id);
                            setOrderSuccessVisible(true);
                        } catch (err) {
                            console.error("Payment verified but order failed:", err);
                            alert("Payment successful but failed to capture order. Please contact support.");
                        }
                    },
                    prefill: {
                        name: user.name || '',
                        email: user.email || '',
                        contact: user.phone || ''
                    },
                    theme: {
                        color: '#153C33' // deep-teal
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', function (response: any) {
                    alert("Payment Failed: " + response.error.description);
                });
                rzp.open();

            } catch (err) {
                console.error("Razorpay Init Error:", err);
                alert('Failed to initialize payment gateway.');
            } finally {
                setIsProcessingPayment(false);
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <Link href="/cart" className="back-btn">←</Link>
                    <h1 style={{ fontSize: 20 }}>Checkout</h1>
                    <div style={{ width: 40 }} />
                </div>
            </div>

            <div className="scroll-content page-with-order-footer" style={{ paddingTop: 32 }}>
                <h1 className="desktop-page-title">Checkout</h1>

                {firstOrderDiscount > 0 && (
                    <div className="discount-banner" style={{ marginBottom: 28 }}>
                        <div className="discount-icon-box"><TicketPercent size={24} /></div>
                        <div style={{ flex: 1 }}>
                            <div className="discount-title">First Order Offer Applied!</div>
                            <div className="discount-subtitle">You'll save 10% on this order as a welcome gift.</div>
                        </div>
                        <Sparkles size={24} color="var(--cream)" />
                    </div>
                )}

                {/* 2-column layout on desktop */}
                <div className="checkout-desktop-layout">
                    {/* Left column: delivery + preferences + wallet */}
                    <div>
                        {/* Delivery Details */}
                        <div className="section-container">
                            <h2 className="section-title">Delivery Details</h2>
                            <div className="card">
                                <div className="input-group">
                                    <div className="label-row">
                                        <MapPin size={14} color="var(--deep-teal)" />
                                        <span className="form-label">Address</span>
                                    </div>
                                    <textarea className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="House No, Building, Landmark, City..." rows={3} />
                                    <button className="locate-btn" onClick={getCurrentLocation} disabled={locationLoading}>
                                        {locationLoading ? <span className="spinner" style={{ borderColor: 'rgba(99,2,12,0.3)', borderTopColor: 'var(--deep-teal)' }} /> : <Navigation size={14} />}
                                        Use Current Location
                                    </button>
                                    {locationError && <p className="error-text">{locationError}</p>}
                                </div>
                                <div className="divider-line" />
                                <div className="info-row-flex">
                                    <div className="icon-circle"><Clock size={20} color="var(--deep-teal)" /></div>
                                    <div style={{ flex: 1 }}>
                                        <div className="info-label">Estimated Arrival</div>
                                        <div className="info-value">{deliveryTime ? `${deliveryTime} mins` : 'Calculating...'}</div>
                                    </div>
                                    {deliveryDistance && <span className="info-badge">{deliveryDistance} km</span>}
                                </div>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="section-container">
                            <h2 className="section-title">Preferences</h2>
                            <div className="card">
                                <div className="input-group">
                                    <div className="label-row">
                                        <FileText size={14} color="var(--deep-teal)" />
                                        <span className="form-label">Order Note</span>
                                    </div>
                                    <textarea className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Leave at door, Ring bell..." rows={2} />
                                </div>
                            </div>
                        </div>

                        {/* Wallet */}
                        {user.wallet_points > 0 && (
                            <div className="section-container">
                                <h2 className="section-title">Offers & Wallet</h2>
                                <div className="card">
                                    <div className="wallet-header">
                                        <div>
                                            <div className="card-label">Chicken Points</div>
                                            <div className="wallet-points">{user.wallet_points}</div>
                                            <div className="wallet-sub">Available Balance</div>
                                        </div>
                                        <div className="card-icon-box">
                                            <img src="/cp-profile.png" alt="points" width={28} height={28} style={{ objectFit: 'contain' }} />
                                        </div>
                                    </div>
                                    <div className="wallet-action">
                                        <span className="wallet-save-text">
                                            Save <strong style={{ color: 'var(--orange)' }}>₹{maxWalletRedemption.toFixed(0)}</strong> on this order
                                        </span>
                                        <input type="checkbox" className="toggle-switch" checked={useWalletPoints} onChange={e => setUseWalletPoints(e.target.checked)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column: payment summary + place order */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Payment Summary */}
                        <div className="section-container" style={{ marginBottom: 0 }}>
                            <h2 className="section-title">Payment Summary</h2>
                            <div className="card">
                                {cart.map((item, index) => (
                                    <div key={`${item.product.id}-${index}`} className="bill-item-row">
                                        <span className="bill-item-qty">{item.quantity}x</span>
                                        <div style={{ flex: 1, padding: '0 10px' }}>
                                            <div className="bill-item-name">{item.product.name}</div>
                                            <div className="bill-item-meta">{item.weight}{item.product.unit} {item.cuttingType ? `• ${item.cuttingType}` : ''}</div>
                                        </div>
                                        <span className="bill-item-price">₹{(item.product.current_price * item.quantity * item.weight).toFixed(2)}</span>
                                    </div>
                                ))}
                                <hr className="dashed-line" />
                                <div className="summary-row"><span className="summary-label">Subtotal</span><span className="summary-value">₹{cartTotal.toFixed(2)}</span></div>
                                <div className="summary-row"><span className="summary-label">Tax (0%)</span><span className="summary-value">+₹0.00</span></div>
                                <div className="summary-row">
                                    <span className="summary-label">Delivery Charge</span>
                                    <span className="summary-value" style={{ color: deliveryCharge === 0 ? 'var(--price-up)' : undefined }}>
                                        {deliveryCharge === 0 ? 'Free' : `+₹${deliveryCharge.toFixed(2)}`}
                                    </span>
                                </div>
                                {firstOrderDiscount > 0 && (
                                    <div className="summary-row">
                                        <span className="summary-label" style={{ color: 'var(--price-up)' }}>New User Discount</span>
                                        <span className="summary-value" style={{ color: 'var(--price-up)' }}>-₹{firstOrderDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                {useWalletPoints && walletDeduction > 0 && (
                                    <div className="summary-row">
                                        <span className="summary-label" style={{ color: 'var(--orange)' }}>Points Redeemed</span>
                                        <span className="summary-value" style={{ color: 'var(--orange)' }}>-₹{walletDeduction.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="divider-line" />
                                <div className="total-row">
                                    <span className="total-label">Total Payable</span>
                                    <span className="total-value">₹{finalTotal.toFixed(2)}</span>
                                </div>
                                <div style={{ marginTop: 20 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 8 }}>Pay Via</div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            className="pm-btn"
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                padding: '12px',
                                                border: `1px solid ${paymentMethod === 'online' ? 'var(--deep-teal)' : '#ddd'}`,
                                                borderRadius: 12,
                                                background: paymentMethod === 'online' ? 'rgba(21, 60, 51, 0.05)' : 'white'
                                            }}
                                            onClick={() => setPaymentMethod('online')}
                                        >
                                            <Wallet size={16} color={paymentMethod === 'online' ? 'var(--deep-teal)' : '#888'} />
                                            <span style={{ fontSize: 13, fontWeight: 600, color: paymentMethod === 'online' ? 'var(--deep-teal)' : '#666' }}>Pay Online</span>
                                        </button>
                                        <button
                                            className="pm-btn"
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                padding: '12px',
                                                border: `1px solid ${paymentMethod === 'cod' ? 'var(--deep-teal)' : '#ddd'}`,
                                                borderRadius: 12,
                                                background: paymentMethod === 'cod' ? 'rgba(21, 60, 51, 0.05)' : 'white'
                                            }}
                                            onClick={() => setPaymentMethod('cod')}
                                        >
                                            <CheckCircle2 size={16} color={paymentMethod === 'cod' ? 'var(--deep-teal)' : '#888'} />
                                            <span style={{ fontSize: 13, fontWeight: 600, color: paymentMethod === 'cod' ? 'var(--deep-teal)' : '#666' }}>Cash on Delivery</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Place order button — inline on desktop, fixed on mobile */}
                        <div className="place-order-footer">
                            <button className="place-order-btn" onClick={handlePlaceOrder} disabled={isProcessingPayment}>
                                <div className="btn-content">
                                    <span className="btn-text">{isProcessingPayment ? 'PROCESSING...' : 'PLACE ORDER'}</span>
                                    <div className="btn-divider" />
                                    <span className="btn-price">₹{finalTotal.toFixed(2)}</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ height: 20 }} />
            </div>

            <OrderSuccessModal
                visible={orderSuccessVisible}
                orderId={placedOrderId}
                onTrackOrder={() => { setOrderSuccessVisible(false); router.push('/orders'); }}
                onContinueShopping={() => { setOrderSuccessVisible(false); router.push('/'); }}
            />
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </div>
    );
}
