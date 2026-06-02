import createContextHook from '@nkzw/create-context-hook';
import {
    Auth,
    onAuthStateChanged,
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    signInWithPhoneNumber,
    ApplicationVerifier,
    ConfirmationResult
} from 'firebase/auth';
import { useState, useEffect } from 'react';
import { auth } from '@/config/firebaseConfig';
import { Alert } from 'react-native';
import { UserService } from '@/services/UserService';
import { UserProfile } from '@/types';

interface AuthState {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, pass: string, silent?: boolean) => Promise<void>;
    signUp: (email: string, pass: string, name: string, phone: string, address: string, silent?: boolean) => Promise<void>;
    logout: (silent?: boolean) => Promise<void>;
    signInWithPhone: (phoneNumber: string, appVerifier: ApplicationVerifier) => Promise<ConfirmationResult>;
    confirmCode: (code: string) => Promise<User>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile: (() => void) | undefined;
        // Listen for authentication state changes
        const unsubscribeAuth = onAuthStateChanged(auth, async (usr) => {
            console.log("[AuthContext] User state changed:", usr ? usr.uid : "No user");
            setUser(usr);
            
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = undefined;
            }

            if (usr) {
                unsubscribeProfile = UserService.subscribeToUser(usr.uid, (profile) => {
                    console.log("[AuthContext] Profile updated:", profile ? "Profile loaded" : "No profile yet");
                    setUserProfile(profile);
                    setLoading(false);
                });
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });
        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const signIn = async (email: string, pass: string, silent: boolean = false) => {
        try {
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            console.error("[AuthContext] SignIn Error:", error);
            if (!silent) {
                let msg = "Failed to sign in.";
                if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
                if (error.code === 'auth/invalid-email') msg = "Invalid email address.";
                Alert.alert("Login Error", msg);
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, pass: string, name: string, phone: string, address: string, silent: boolean = false) => {
        try {
            setLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

            // Update display name
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: name
                });

                // Create User Profile in Firestore
                const newProfile = await UserService.createUser(userCredential.user.uid, {
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    wallet_points: 0
                });

                // Force refresh user to get display name
                setUser({ ...userCredential.user, displayName: name });
                setUserProfile(newProfile);
            }
        } catch (error: any) {
            console.error("[AuthContext] SignUp Error:", error);
            if (!silent) {
                let msg = "Failed to sign up.";
                if (error.code === 'auth/email-already-in-use') msg = "Email already in use.";
                if (error.code === 'auth/weak-password') msg = "Password is too weak.";
                Alert.alert("Signup Error", msg);
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };



    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    const signInWithPhone = async (phoneNumber: string, appVerifier: ApplicationVerifier) => {
        try {
            setLoading(true);
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
            return result;
        } catch (error) {
            console.error("[AuthContext] signInWithPhone Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const confirmCode = async (code: string) => {
        try {
            setLoading(true);
            if (!confirmationResult) {
                throw new Error("No active verification session");
            }
            const credential = await confirmationResult.confirm(code);
            return credential.user;
        } catch (error) {
            console.error("[AuthContext] confirmCode Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async (silent: boolean = false) => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("[AuthContext] SignOut Error:", error);
            if (!silent) {
                Alert.alert("Logout Error", "Failed to sign out.");
            }
        }
    };

    return {
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        logout,
        signInWithPhone,
        confirmCode,
    };
});
