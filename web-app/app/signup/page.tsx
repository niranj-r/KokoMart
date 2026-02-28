'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StatusBanner from '@/components/StatusBanner';

export default function SignupPage() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerType, setBannerType] = useState<'success' | 'error'>('success');
    const [bannerMessage, setBannerMessage] = useState('');

    const showBanner = (type: 'success' | 'error', message: string) => {
        setBannerType(type); setBannerMessage(message); setBannerVisible(true);
    };

    const handleSignup = async () => {
        if (!name || !email || !password) { showBanner('error', 'Name, email and password are required.'); return; }
        setIsLoading(true);
        try {
            await signUp(email, password, name, phone, address);
            showBanner('success', 'Account created!');
            setTimeout(() => router.replace('/'), 1500);
        } catch (e: any) {
            let msg = "Failed to sign up.";
            if (e.code === 'auth/email-already-in-use') msg = "Email already in use.";
            if (e.code === 'auth/weak-password') msg = "Password is too weak (min. 6 chars).";
            showBanner('error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <StatusBanner visible={bannerVisible} type={bannerType} message={bannerMessage} onClose={() => setBannerVisible(false)} />
            <img src="/logo.png" alt="Meat Up" className="auth-logo" />
            <p className="auth-tagline">Fresh Chicken, Delivered.</p>
            <div className="auth-form">
                <h2>Create Account</h2>
                <div className="auth-input-group">
                    <User size={20} color="var(--extrared)" />
                    <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="auth-input-group">
                    <Mail size={20} color="var(--extrared)" />
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="auth-input-group">
                    <Phone size={20} color="var(--extrared)" />
                    <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="auth-input-group">
                    <MapPin size={20} color="var(--extrared)" />
                    <input placeholder="Delivery Address" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div className="auth-input-group">
                    <Lock size={20} color="var(--extrared)" />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button className="auth-btn" onClick={handleSignup} disabled={isLoading}>
                    {isLoading ? <span className="spinner" /> : <>Create Account <ArrowRight size={20} /></>}
                </button>
                <div className="auth-footer-row">
                    <span>Already have an account?</span>
                    <Link href="/login" className="auth-link">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
