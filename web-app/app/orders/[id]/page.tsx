'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, Package, Scissors, Box, Truck, Headphones, MapPin, Calendar, FileText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Order, OrderStatus } from '@/types';
import SupportChatModal from '@/components/SupportChatModal';
import ConfirmationModal from '@/components/ConfirmationModal';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string; bgColor: string }> = {
    pending: { label: 'Order Pending', icon: Clock, color: '#F97316', bgColor: '#FFF4E6' },
    confirmed: { label: 'Confirmed', icon: CheckCircle, color: '#4d0808', bgColor: '#E6F4F1' },
    received: { label: 'Received', icon: Package, color: '#4d0808', bgColor: '#E6F4F1' },
    cutting: { label: 'Cutting', icon: Scissors, color: '#F97316', bgColor: '#FFF4E6' },
    packing: { label: 'Packing', icon: Box, color: '#F97316', bgColor: '#FFF4E6' },
    out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: '#1DB954', bgColor: '#E6F5EA' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: '#1DB954', bgColor: '#E6F5EA' },
    cancelled: { label: 'Cancelled', icon: Box, color: '#E63946', bgColor: '#FEE2E2' },
};

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { orders, cancelOrder } = useApp();
    const [order, setOrder] = useState<Order | null>(null);
    const [chatVisible, setChatVisible] = useState(false);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);

    useEffect(() => {
        if (params.id && typeof params.id === 'string') {
            const foundOrder = orders.find(o => o.id === params.id);
            if (foundOrder) setOrder(foundOrder);
        }
    }, [params.id, orders]);

    if (!order) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                <p>Order not found.</p>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--deep-teal)', fontWeight: 700, marginTop: 16, cursor: 'pointer' }}>
                    ← Back to Orders
                </button>
            </div>
        );
    }

    const config = STATUS_CONFIG[order.status];
    const StatusIcon = config.icon;

    const handleConfirmCancel = async () => {
        await cancelOrder(order.id);
        setCancelModalVisible(false);
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header" style={{ paddingBottom: 20 }}>
                <div className="page-header-row">
                    <button className="back-btn" onClick={() => router.back()}>
                        <ArrowLeft size={22} />
                    </button>
                    <h1 style={{ fontSize: 18, flex: 1, textAlign: 'center', margin: 0 }}>Order Details</h1>
                    <div style={{ width: 44 }} /> {/* Balance for back button */}
                </div>
            </div>

            <div className="scroll-content" style={{ paddingTop: 32, maxWidth: 800, margin: '0 auto' }}>
                {/* Desktop Title Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }} className="desktop-page-title-row">
                    <h1 className="desktop-page-title" style={{ margin: 0, display: 'inline-block' }}>Order Details</h1>
                    <button
                        onClick={() => router.back()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(99, 2, 12, 0.08)', color: 'var(--charcoal)', border: 'none', borderRadius: 14, padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                {/* Status Card */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                            <div className="order-id" style={{ fontSize: 18, marginBottom: 4 }}>
                                {order.display_id || `ORDER #${order.id.slice(-6).toUpperCase()}`}
                            </div>
                            <div style={{ color: '#888', fontSize: 14 }}>
                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div className="status-badge" style={{ backgroundColor: config.bgColor, color: config.color, padding: '8px 12px', fontSize: 14 }}>
                            <StatusIcon size={16} />
                            {config.label}
                        </div>
                    </div>

                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div style={{ marginTop: 20, padding: '20px 0 10px' }}>
                            <OrderTimeline currentStatus={order.status} />
                        </div>
                    )}
                </div>

                {/* 2-Column Desktop Layout for Details */}
                <div className="checkout-desktop-layout" style={{ gap: 24 }}>
                    {/* Left Column: Items */}
                    <div>
                        <div className="card" style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--charcoal)' }}>Items Ordered</h2>
                            <div className="items-list" style={{ marginTop: 0 }}>
                                {order.items.map((item, index) => (
                                    <div key={`${order.id}-${index}`} className="item-row" style={{ padding: '12px 0', borderBottom: index < order.items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div className="item-bullet" style={{ marginTop: 6 }} />
                                                <div>
                                                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)' }}>{item.name}</div>
                                                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                                                        {item.weight}kg {item.cuttingType ? `• ${item.cuttingType}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 15, fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(2)}</div>
                                                <div style={{ fontSize: 13, color: '#888' }}>Qty: {item.quantity}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="card" style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--charcoal)' }}>Delivery Details</h2>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                <MapPin size={20} color="var(--deep-teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Delivery Address</div>
                                    <div style={{ fontSize: 15, lineHeight: 1.5 }}>{order.address}</div>
                                </div>
                            </div>
                            {order.delivery_slot && (
                                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                    <Calendar size={20} color="var(--deep-teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Delivery Slot</div>
                                        <div style={{ fontSize: 15 }}>{order.delivery_slot}</div>
                                    </div>
                                </div>
                            )}
                            {order.note && (
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <FileText size={20} color="var(--deep-teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Delivery Note</div>
                                        <div style={{ fontSize: 15 }}>{order.note}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Bill & Actions */}
                    <div>
                        <div className="card" style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--charcoal)' }}>Bill Summary</h2>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ color: '#666' }}>Item Total</div>
                                <div style={{ fontWeight: 600 }}>₹{order.total_amount.toFixed(2)}</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ color: '#666' }}>Delivery Charge</div>
                                <div style={{ fontWeight: 600 }}>
                                    {order.delivery_charge && order.delivery_charge > 0
                                        ? `₹${order.delivery_charge.toFixed(2)}`
                                        : <span style={{ color: 'var(--deep-teal)' }}>FREE</span>}
                                </div>
                            </div>

                            {order.discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--deep-teal)' }}>
                                    <div>Discount</div>
                                    <div style={{ fontWeight: 600 }}>-₹{order.discount.toFixed(2)}</div>
                                </div>
                            )}

                            {order.wallet_used > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--deep-teal)' }}>
                                    <div>Wallet Applied</div>
                                    <div style={{ fontWeight: 600 }}>-₹{order.wallet_used.toFixed(2)}</div>
                                </div>
                            )}

                            <div className="dashed-line" />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>Grand Total</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--orange)' }}>₹{order.final_amount.toFixed(2)}</div>
                            </div>

                            {order.status === 'delivered' && order.earned_points > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#FFF8E1', padding: '10px', borderRadius: 12, marginTop: 16 }}>
                                    <img src="/cp.png" alt="points" width={18} height={18} />
                                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange)' }}>You earned {order.earned_points} points!</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                            <button
                                onClick={() => setChatVisible(true)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--deep-teal)', color: 'var(--white)', border: 'none', borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%' }}
                            >
                                <Headphones size={20} /> Support Help
                            </button>

                            {order.status === 'pending' && (
                                <button
                                    onClick={() => setCancelModalVisible(true)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--alert-red)', border: '1.5px solid var(--alert-red)', borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%' }}
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ height: 60 }} />
            </div>

            <SupportChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
            <ConfirmationModal
                visible={cancelModalVisible}
                title="Cancel Order"
                message="Are you sure you want to cancel this order? This action cannot be undone."
                confirmText="Yes, Cancel"
                cancelText="No, Keep Order"
                type="danger"
                onConfirm={handleConfirmCancel}
                onCancel={() => setCancelModalVisible(false)}
            />
        </div>
    );
}

function OrderTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
    const steps: { key: OrderStatus; label: string }[] = [
        { key: 'received', label: 'Received' },
        { key: 'cutting', label: 'Cutting' },
        { key: 'packing', label: 'Packing' },
        { key: 'out_for_delivery', label: 'Out' },
        { key: 'delivered', label: 'Delivered' },
    ];
    const allStatuses: OrderStatus[] = ['pending', 'received', 'confirmed', 'cutting', 'packing', 'out_for_delivery', 'delivered'];
    const currentIndex = allStatuses.indexOf(currentStatus);

    return (
        <div className="progress-bar">
            {steps.map((step, index) => {
                const stepIndex = allStatuses.indexOf(step.key);
                const isActive = currentIndex >= stepIndex;
                const isCompleted = currentIndex > stepIndex;
                return (
                    <div key={step.key} className="step-item">
                        <div className={`step-dot ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
                            {isCompleted && <CheckCircle size={8} color="white" />}
                        </div>
                        <span className={`step-label ${isActive ? 'active' : ''}`}>{step.label}</span>
                        {index < steps.length - 1 && (
                            <div className={`step-connector ${isActive && currentIndex >= allStatuses.indexOf(steps[index + 1].key) ? 'active' : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
