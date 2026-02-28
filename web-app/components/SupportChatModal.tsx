'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Headphones, X } from 'lucide-react';

interface SupportChatModalProps {
    visible: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'support';
    time: string;
}

const INITIAL_MESSAGES: Message[] = [
    {
        id: '1',
        text: "Hi! Welcome to Meat Up support. How can we help you today?",
        sender: 'support',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
];

const AUTO_REPLIES = [
    "Thank you for reaching out! Our team will assist you shortly.",
    "We understand your concern. Let me check on that for you.",
    "Your query has been noted. Is there anything else I can help with?",
    "Our team is looking into this. We'll get back to you within 30 minutes.",
];

export default function SupportChatModal({ visible, onClose }: SupportChatModalProps) {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!visible) return null;

    const sendMessage = () => {
        if (!inputText.trim()) return;
        const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const userMsg: Message = { id: Date.now().toString(), text: inputText, sender: 'user', time: now };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');

        setTimeout(() => {
            const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: reply,
                sender: 'support',
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 1200);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(99,2,12,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Headphones size={20} color="var(--deep-teal)" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--charcoal)' }}>Support Chat</div>
                            <div style={{ fontSize: 12, color: 'var(--price-up)', fontWeight: 600 }}>● Online</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                        <X size={22} />
                    </button>
                </div>

                <div className="chat-messages">
                    {messages.map(msg => (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div className={`chat-bubble ${msg.sender}`}>{msg.text}</div>
                            <span style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>{msg.time}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-row">
                    <input
                        className="chat-input"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button className="chat-send-btn" onClick={sendMessage}>
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
