'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StatusBanner from '@/components/StatusBanner';

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerType, setBannerType] = useState<'success' | 'error'>('success');
    const [bannerMessage, setBannerMessage] = useState('');

    const showBanner = (type: 'success' | 'error', message: string) => {
        setBannerType(type);
        setBannerMessage(message);
        setBannerVisible(true);
    };

    const handleLogin = async () => {
        if (!email || !password) { showBanner('error', 'Please enter both email and password.'); return; }
        setIsLoading(true);
        try {
            await signIn(email, password);
            showBanner('success', 'Logged in successfully!');
            setTimeout(() => router.replace('/'), 1500);
        } catch (e: any) {
            let msg = "Failed to sign in.";
            if (e.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            if (e.code === 'auth/invalid-email') msg = "Invalid email address.";
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
                <h2>Welcome Back</h2>
                <div className="auth-input-group">
                    <Mail size={20} color="var(--extrared)" />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                </div>
                <div className="auth-input-group">
                    <Lock size={20} color="var(--extrared)" />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                </div>
                <button className="auth-btn" onClick={handleLogin} disabled={isLoading}>
                    {isLoading ? <span className="spinner" /> : <>Sign In <ArrowRight size={20} /></>}
                </button>
                <div className="auth-footer-row">
                    <span>Don't have an account?</span>
                    <Link href="/signup" className="auth-link">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
