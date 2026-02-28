'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Home, Package, User, ShoppingBag } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function Navbar() {
    const pathname = usePathname();
    const { cartItemCount } = useApp();

    const navItems = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/orders', label: 'Orders', icon: Package },
        { href: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <>
            {/* Top Navbar for Desktop */}
            <nav className="top-navbar">
                <Link href="/" className="brand">Meat Up</Link>
                <ul className="nav-links">
                    {navItems.map(item => (
                        <li key={item.href}>
                            <Link href={item.href} className={pathname === item.href ? 'active' : ''}>
                                <item.icon size={16} />
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <Link href="/cart" className="cart-btn" style={{ position: 'relative' }}>
                    <ShoppingBag size={18} />
                    View Cart
                    {cartItemCount > 0 && (
                        <span className="nav-badge">{cartItemCount}</span>
                    )}
                </Link>
            </nav>

            {/* Bottom Nav for Mobile */}
            <nav className="bottom-nav">
                {navItems.map(item => (
                    <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>
                        <item.icon size={22} />
                        {item.label}
                    </Link>
                ))}
                <Link href="/cart" className={pathname === '/cart' ? 'active' : ''} style={{ position: 'relative' }}>
                    <ShoppingCart size={22} />
                    Cart
                    {cartItemCount > 0 && (
                        <span className="bn-badge">{cartItemCount}</span>
                    )}
                </Link>
            </nav>
        </>
    );
}
