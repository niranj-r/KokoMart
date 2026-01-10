import { initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace the following with your app's Firebase project configuration
// You can find these in the Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyChD7SyoC3ESkNfiPK3yXYOAekCVnZHkCs",
    authDomain: "kokomart-e1f08.firebaseapp.com",
    projectId: "kokomart-e1f08",
    storageBucket: "kokomart-e1f08.firebasestorage.app",
    messagingSenderId: "692286395880",
    appId: "1:692286395880:web:0e9d51c09b63ed2864005d",
    measurementId: "G-BDQMLF350X"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Initialize Auth with persistence
// @ts-ignore
let auth: import('firebase/auth').Auth;
if (typeof getReactNativePersistence === 'function') {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
} else {
    // Fallback for environments where the RN persistence function isn't available
    // or checks failed. Basic getAuth handles it well for Expo Go/Web mostly.
    auth = getAuth(app);
}

// Initialize Firestore
import { getFirestore } from 'firebase/firestore';
const db = getFirestore(app);

export { auth, db };
