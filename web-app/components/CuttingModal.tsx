'use client';
import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface Option {
    name: string;
    price?: number;
}

interface CuttingModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (value: string) => void;
    options?: string[];
    variants?: Option[];
    title?: string;
}

export default function CuttingModal({ visible, onClose, onSelect, options, variants, title = "Select Option" }: CuttingModalProps) {
    const [selected, setSelected] = useState<string | null>(null);

    if (!visible) return null;

    const items = variants
        ? variants.map(v => ({ label: `${v.name} — ₹${v.price}`, value: v.name }))
        : (options || []).map(o => ({ label: o, value: o }));

    const handleConfirm = () => {
        if (selected) {
            onSelect(selected);
            setSelected(null);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <h2 className="modal-title">{title}</h2>
                {items.map(item => (
                    <button
                        key={item.value}
                        className={`modal-option-btn ${selected === item.value ? 'selected' : ''}`}
                        onClick={() => setSelected(item.value)}
                    >
                        {item.label}
                        {selected === item.value && <CheckCircle size={18} color="var(--deep-teal)" />}
                    </button>
                ))}
                <button className="modal-confirm-btn" onClick={handleConfirm} disabled={!selected}>
                    Confirm
                </button>
                <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
}
