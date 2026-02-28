'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

// hide nav on auth pages
const hideNavRoutes = ['/login', '/signup'];

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const showNav = !hideNavRoutes.includes(pathname);

    return (
        <div className="app-shell">
            {showNav && <Navbar />}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
