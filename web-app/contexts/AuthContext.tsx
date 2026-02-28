'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { UserService } from '@/services/UserService';
import { UserProfile } from '@/types';

interface AuthState {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string, name: string, phone: string, address: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
    user: null,
    userProfile: null,
    loading: true,
    signIn: async () => { },
    signUp: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (usr) => {
            setUser(usr);
            if (usr) {
                const profile = await UserService.getUser(usr.uid);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signIn = async (email: string, pass: string) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, pass: string, name: string, phone: string, address: string) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            if (userCredential.user) {
                await updateProfile(userCredential.user, { displayName: name });
                const newProfile = await UserService.createUser(userCredential.user.uid, {
                    name, email, phone, address,
                    is_first_order_completed: false,
                    wallet_points: 0,
                });
                setUser({ ...userCredential.user, displayName: name });
                setUserProfile(newProfile);
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
