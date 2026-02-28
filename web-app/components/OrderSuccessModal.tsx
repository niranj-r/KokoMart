'use client';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

interface OrderSuccessModalProps {
    visible: boolean;
    orderId: string;
    onTrackOrder: () => void;
    onContinueShopping: () => void;
}

export default function OrderSuccessModal({ visible, orderId, onTrackOrder, onContinueShopping }: OrderSuccessModalProps) {
    if (!visible) return null;

    return (
        <div className="success-modal-center">
            <div className="success-modal-box">
                <div className="success-icon-circle">
                    <CheckCircle size={48} color="var(--price-up)" strokeWidth={2} />
                </div>
                <h2 className="success-title">Order Placed!</h2>
                <p className="success-order-id">{orderId}</p>
                <p className="success-subtitle">
                    Your fresh order is confirmed and being prepared. You'll receive it soon!
                </p>
                <button className="success-btn-primary" onClick={onTrackOrder}>
                    Track Order
                </button>
                <button className="success-btn-secondary" onClick={onContinueShopping}>
                    Continue Shopping
                </button>
            </div>
        </div>
    );
}
