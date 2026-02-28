'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, MapPin, Edit2, LogOut, LogIn, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import StatusBanner from '@/components/StatusBanner';

export default function ProfilePage() {
    const router = useRouter();
    const { user, walletHistory, updateUserProfile } = useApp();
    const { logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user.name);
    const [editPhone, setEditPhone] = useState(user.phone);
    const [editAddress, setEditAddress] = useState(user.address || '');
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerType, setBannerType] = useState<'success' | 'error'>('success');
    const [bannerMessage, setBannerMessage] = useState('');

    useEffect(() => {
        setEditName(user.name);
        setEditPhone(user.phone);
        setEditAddress(user.address || '');
    }, [user]);

    const isGuest = user.id === '1' || !user.email;

    const showBanner = (type: 'success' | 'error', message: string) => {
        setBannerType(type); setBannerMessage(message); setBannerVisible(true);
    };

    const handleLogout = async () => {
        try {
            await logout();
            showBanner('success', 'Logged out successfully');
            setTimeout(() => router.push('/'), 1500);
        } catch { showBanner('error', 'Failed to log out.'); }
    };

    const handleSaveProfile = async () => {
        await updateUserProfile({ name: editName, phone: editPhone, address: editAddress });
        setIsEditing(false);
        showBanner('success', 'Profile updated!');
    };

    const getInitials = (name: string) =>
        name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'G';

    if (isEditing) {
        return (
            <div>
                <div className="page-header">
                    <div className="page-header-row">
                        <button className="back-btn" onClick={() => setIsEditing(false)}>←</button>
                        <h1 style={{ fontSize: 20 }}>Edit Profile</h1>
                        <div style={{ width: 40 }} />
                    </div>
                </div>
                <div className="scroll-content" style={{ paddingTop: 40 }}>
                    <div className="card" style={{ maxWidth: 600 }}>
                        <h2 className="desktop-page-title" style={{ marginBottom: 24 }}>Edit Profile</h2>
                        <div className="input-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Enter your name" />
                        </div>
                        <div className="input-group">
                            <label className="form-label">Phone Number</label>
                            <input className="form-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Enter phone number" />
                        </div>
                        <div className="input-group">
                            <label className="form-label">Address</label>
                            <textarea className="form-input" value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Enter delivery address" />
                        </div>
                        <button
                            style={{ width: '100%', background: 'var(--deep-teal)', color: 'var(--white)', border: 'none', borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
                            onClick={handleSaveProfile}
                        >Save Changes</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <StatusBanner visible={bannerVisible} type={bannerType} message={bannerMessage} onClose={() => setBannerVisible(false)} />

            {/* Mobile header */}
            <div className="page-header" style={{ paddingBottom: 60 }}>
                <div className="page-header-row">
                    <h1 style={{ fontSize: 24 }}>Profile</h1>
                    {!isGuest && (
                        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: 8, cursor: 'pointer', color: 'var(--cream)', display: 'flex', alignItems: 'center' }}>
                            <LogOut size={24} />
                        </button>
                    )}
                </div>
                <div className="profile-header-content">
                    <div className="avatar"><span className="avatar-text">{getInitials(user.name)}</span></div>
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                    {isGuest
                        ? <Link href="/login" className="sign-in-pill"><LogIn size={16} />Sign In / Sign Up</Link>
                        : <button className="edit-profile-pill" onClick={() => setIsEditing(true)}><Edit2 size={12} />Edit Profile</button>
                    }
                </div>
            </div>

            <div className="scroll-content" style={{ paddingTop: 32 }}>
                {/* Desktop: 2-column layout */}
                <div className="profile-desktop-layout">
                    {/* Left sidebar: profile card on desktop */}
                    <div>
                        {/* Desktop profile card (hidden on mobile via CSS) */}
                        <div className="profile-desktop-header">
                            <div className="avatar"><span className="avatar-text">{getInitials(user.name)}</span></div>
                            <div className="user-name" style={{ marginTop: 12 }}>{user.name}</div>
                            <div className="user-email">{user.email}</div>
                            {isGuest
                                ? <Link href="/login" className="sign-in-pill" style={{ marginTop: 12 }}><LogIn size={16} />Sign In / Sign Up</Link>
                                : <button className="edit-profile-pill" onClick={() => setIsEditing(true)} style={{ marginTop: 12 }}><Edit2 size={12} />Edit Profile</button>
                            }
                            {!isGuest && (
                                <button onClick={handleLogout} style={{ marginTop: 12, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                    <LogOut size={16} /> Sign Out
                                </button>
                            )}
                        </div>

                        {/* Membership Card */}
                        <div className="membership-card">
                            <div className="membership-card-header">
                                <div>
                                    <div className="card-label">Member Card</div>
                                    <div className="card-points">{user.wallet_points}</div>
                                    <div className="card-points-label">Chicken Points</div>
                                </div>
                                <div className="card-icon-box">
                                    <img src="/cp-profile.png" alt="points" width={40} height={40} style={{ objectFit: 'contain' }} />
                                </div>
                            </div>
                            <div className="card-footer-text">1 Point = ₹1 • Redeemable at checkout</div>
                        </div>
                    </div>

                    {/* Right column: contact info + history */}
                    <div>
                        {/* Contact Info */}
                        <div className="section-container">
                            <h2 className="section-title">Contact Information</h2>
                            <div className="info-card">
                                <div className="info-row">
                                    <div className="icon-circle"><Mail size={18} color="var(--deep-teal)" /></div>
                                    <div>
                                        <div className="info-label">Email</div>
                                        <div className="info-value">{user.email || 'Not set'}</div>
                                    </div>
                                </div>
                                <div className="info-divider" />
                                <div className="info-row">
                                    <div className="icon-circle"><Phone size={18} color="var(--deep-teal)" /></div>
                                    <div>
                                        <div className="info-label">Phone</div>
                                        <div className="info-value">{user.phone || 'Add phone number'}</div>
                                    </div>
                                </div>
                                <div className="info-divider" />
                                <div className="info-row">
                                    <div className="icon-circle"><MapPin size={18} color="var(--deep-teal)" /></div>
                                    <div>
                                        <div className="info-label">Address</div>
                                        <div className="info-value">{user.address || 'Add delivery address'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Wallet History */}
                        {walletHistory.length > 0 && (
                            <div className="section-container">
                                <h2 className="section-title">Recent Activity</h2>
                                <div className="info-card">
                                    {walletHistory.map((t, index) => (
                                        <div key={t.id}>
                                            <div className="history-item">
                                                <div className="history-icon" style={{ background: t.type === 'earned' ? '#1DB95415' : '#E6394615' }}>
                                                    {t.type === 'earned' ? <TrendingUp size={18} color="#1DB954" /> : <TrendingDown size={18} color="#E63946" />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div className="history-desc">{t.description}</div>
                                                    <div className="history-date">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                </div>
                                                <div className="history-amount" style={{ color: t.type === 'earned' ? '#1DB954' : '#E63946' }}>
                                                    {t.type === 'earned' ? '+' : '-'}{t.amount}
                                                </div>
                                            </div>
                                            {index < walletHistory.length - 1 && <div className="info-divider" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ height: 40 }} />
            </div>
        </div>
    );
}
