'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface StatusBannerProps {
    visible: boolean;
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
    autoClose?: number;
}

export default function StatusBanner({ visible, type, message, onClose, autoClose = 3000 }: StatusBannerProps) {
    useEffect(() => {
        if (visible && autoClose > 0) {
            const timer = setTimeout(onClose, autoClose);
            return () => clearTimeout(timer);
        }
    }, [visible, autoClose, onClose]);

    if (!visible) return null;

    return (
        <div className={`status-banner ${type}`}>
            {type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span style={{ flex: 1 }}>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                <X size={16} />
            </button>
        </div>
    );
}
