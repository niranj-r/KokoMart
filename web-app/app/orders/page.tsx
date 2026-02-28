'use client';
import { useState } from 'react';
import { Package, Scissors, Box, Truck, CheckCircle, Clock, Headphones } from 'lucide-react';
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

export default function OrdersPage() {
    const { orders, cancelOrder } = useApp();
    const [chatVisible, setChatVisible] = useState(false);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const handleConfirmCancel = async () => {
        if (selectedOrderId) {
            await cancelOrder(selectedOrderId);
            setCancelModalVisible(false);
            setSelectedOrderId(null);
        }
    };

    const attemptCancel = (orderId: string) => {
        setSelectedOrderId(orderId);
        setCancelModalVisible(true);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <h1>My Orders</h1>
                    <button
                        onClick={() => setChatVisible(true)}
                        style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream)' }}
                    >
                        <Headphones size={24} />
                    </button>
                </div>
            </div>

            <div className="scroll-content" style={{ paddingTop: 32 }}>
                {/* Desktop title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                    <h1 className="desktop-page-title" style={{ margin: 0 }}>My Orders</h1>
                    <button
                        onClick={() => setChatVisible(true)}
                        className="desktop-page-title"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--deep-teal)', color: 'var(--cream)', border: 'none', borderRadius: 14, padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                    >
                        <Headphones size={18} /> Support
                    </button>
                </div>
                {orders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon-bg">
                            <Package size={64} color="var(--deep-teal)" />
                        </div>
                        <h2 className="empty-title">No Orders Yet</h2>
                        <p className="empty-subtitle">Your order history will appear here once you place an order.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <OrderCard key={order.id} order={order} onCancel={attemptCancel} />
                        ))}
                    </div>
                )}
                <div style={{ height: 40 }} />
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

import { useRouter } from 'next/navigation';

function OrderCard({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) {
    const config = STATUS_CONFIG[order.status];
    const Icon = config.icon;
    const router = useRouter();

    return (
        <div className="order-card" onClick={() => router.push(`/orders/${order.id}`)} style={{ cursor: 'pointer' }}>
            <div className="order-card-header">
                <div>
                    <div className="order-id">{order.display_id || `ORDER #${order.id.slice(-6).toUpperCase()}`}</div>
                    <div className="order-date">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div className="status-badge" style={{ backgroundColor: config.bgColor, color: config.color }}>
                    <Icon size={14} />
                    {config.label}
                </div>
            </div>

            <div className="divider-line" />

            <div className="items-list">
                {order.items.map((item, index) => (
                    <div key={`${order.id}-${index}`} className="item-row">
                        <div className="item-bullet" />
                        <span className="item-text">
                            <strong>{item.quantity}x </strong>
                            {item.name}
                            <span style={{ color: '#888' }}> ({item.weight}kg{item.cuttingType ? ` • ${item.cuttingType}` : ''})</span>
                        </span>
                    </div>
                ))}
            </div>

            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="timeline-container">
                    <OrderTimeline currentStatus={order.status} />
                </div>
            )}

            <div className="divider-line" />

            <div className="order-card-footer">
                <div>
                    <div className="order-total-label">Total Amount</div>
                    <div className="order-total-value">₹{order.final_amount.toFixed(2)}</div>
                </div>
                {order.status === 'pending' ? (
                    <button className="cancel-btn" onClick={(e) => { e.stopPropagation(); onCancel(order.id); }}>Cancel</button>
                ) : order.status === 'delivered' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF8E1', padding: '6px 10px', borderRadius: 10 }}>
                        <img src="/cp.png" alt="points" width={16} height={16} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)' }}>+{order.earned_points} pts</span>
                    </div>
                ) : null}
            </div>
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
