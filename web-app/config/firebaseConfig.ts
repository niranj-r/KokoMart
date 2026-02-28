import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCtqSTywhBqxfYQx7MmqMlGiSv-On3MGBk",
    authDomain: "meatup-f8c49.firebaseapp.com",
    projectId: "meatup-f8c49",
    storageBucket: "meatup-f8c49.firebasestorage.app",
    messagingSenderId: "270170795022",
    appId: "1:270170795022:web:09f1eb597a81c69f22205f"
};

let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
