import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import NavbarWrapper from "@/components/NavbarWrapper";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Meat Up - Fresh Chicken, Delivered",
  description: "Order fresh chicken and meat products delivered to your door.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <AppProvider>
            <NavbarWrapper>
              {children}
            </NavbarWrapper>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
