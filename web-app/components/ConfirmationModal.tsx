'use client';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationModal({
    visible, title, message, confirmText = 'Confirm', cancelText = 'Cancel',
    type = 'info', onConfirm, onCancel
}: ConfirmationModalProps) {
    if (!visible) return null;

    const isDanger = type === 'danger';

    return (
        <div className="confirm-modal-center" onClick={onCancel}>
            <div className="confirm-modal-box" onClick={e => e.stopPropagation()}>
                <div className="confirm-icon" style={{ background: isDanger ? '#FEE2E2' : '#EBF5FB' }}>
                    {isDanger
                        ? <AlertTriangle size={28} color="#E63946" />
                        : <Info size={28} color="#2E86C1" />
                    }
                </div>
                <h3 className="confirm-modal-title">{title}</h3>
                <p className="confirm-modal-msg">{message}</p>
                <div className="confirm-modal-btns">
                    <button
                        className="confirm-btn-yes"
                        style={{
                            background: isDanger ? '#E63946' : 'var(--deep-teal)',
                            color: '#fff'
                        }}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                    <button className="confirm-btn-no" onClick={onCancel}>{cancelText}</button>
                </div>
            </div>
        </div>
    );
}
