'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import CuttingModal from '@/components/CuttingModal';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addToCart, removeFromCart, cart } = useApp();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedWeight, setSelectedWeight] = useState<number>(1);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (!params.id || typeof params.id !== 'string') return;
        ProductService.getProductById(params.id).then(p => {
            setProduct(p);
            if (p) {
                if (p.unit === 'kg') setSelectedWeight(1);
                else if (p.unit === 'g') setSelectedWeight(250);
                else setSelectedWeight(1);
            }
            setLoading(false);
        });
    }, [params.id]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>Loading...</div>;
    if (!product) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><p>Product not found.</p><Link href="/" style={{ color: 'var(--deep-teal)' }}>← Back to Home</Link></div>;

    const getOptions = () => {
        if (product.unit === 'kg') return [0.5, 1, 2];
        if (product.unit === 'g') return [250, 500, 1000];
        if (product.unit === 'pc' || product.unit === 'pack') return [1, 2, 4];
        return [1, 2, 5];
    };

    const priceQty = product.price_quantity || 1;
    const options = getOptions();
    const quantity = cart.filter(item => item.product.id === product.id && item.weight === selectedWeight).reduce((s, i) => s + i.quantity, 0);

    const handleAddToCart = () => {
        if (product.variants && product.variants.length > 0) setModalVisible(true);
        else if (product.cutting_types && product.cutting_types.length > 0) setModalVisible(true);
        else addToCart(product.id, 1, selectedWeight);
    };

    const handleRemove = () => {
        const itemToRemove = cart.find(item => item.product.id === product.id && item.weight === selectedWeight);
        if (itemToRemove) removeFromCart(product.id, selectedWeight, itemToRemove.cuttingType);
    };

    return (
        <div>
            <div className="page-header" style={{ paddingBottom: 20 }}>
                <div className="page-header-row">
                    <button className="back-btn" onClick={() => router.back()}>
                        <ArrowLeft size={22} />
                    </button>
                    <h1 style={{ fontSize: 18, flex: 1, textAlign: 'center' }}>{product.name}</h1>
                    <Link href="/cart" className="cart-icon-btn" style={{ color: 'var(--cream)', display: 'flex', alignItems: 'center' }}>
                        <ShoppingCart size={22} />
                    </Link>
                </div>
            </div>

            <div style={{ maxWidth: 720, margin: '24px auto 0', padding: '0 0 80px' }}>
                <img src={product.image} alt={product.name} className="product-detail-img" style={{ borderRadius: '0 0 28px 28px', width: '100%', height: 280, objectFit: 'cover' }} />
                <div className="product-detail-content">
                    <div className="card-header-row">
                        <h2 className="card-title" style={{ fontSize: 24 }}>{product.name}</h2>
                        <div className="price-tag">
                            <span className="price-tag-text" style={{ fontSize: 22 }}>₹{product.current_price}</span>
                            <span className="price-unit">/{product.unit}</span>
                        </div>
                    </div>

                    {product.description && (
                        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24 }}>{product.description}</p>
                    )}

                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 12 }}>Select Quantity</h3>
                        <div className="variant-container">
                            {options.map(opt => {
                                const label = (product.unit === 'kg' || product.unit === 'g')
                                    ? `${opt}${product.unit}`
                                    : `${opt * priceQty} ${product.unit}`;
                                return (
                                    <button
                                        key={opt}
                                        className={`variant-chip ${selectedWeight === opt ? 'active' : ''}`}
                                        onClick={() => setSelectedWeight(opt)}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ background: 'var(--cream-light)', borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Price for selected qty</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--orange)' }}>
                                    ₹{(product.current_price * selectedWeight).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {quantity === 0 ? (
                        <button className="add-btn" onClick={handleAddToCart}>ADD TO CART</button>
                    ) : (
                        <div className="qty-container">
                            <button className="qty-btn" onClick={handleRemove}><Minus size={18} /></button>
                            <span className="qty-text">{quantity}</span>
                            <button className="qty-btn" onClick={handleAddToCart}><Plus size={18} /></button>
                        </div>
                    )}
                </div>
            </div>

            <CuttingModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelect={(v) => { addToCart(product.id, 1, selectedWeight, v); setModalVisible(false); }}
                options={product.cutting_types}
                variants={product.variants}
                title={product.variants ? "Select Type" : "Select Cutting Type"}
            />
        </div>
    );
}
