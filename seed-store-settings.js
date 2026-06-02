/**
 * Run this script once to create the settings/store document in Firestore.
 * Usage: node seed-store-settings.js
 * 
 * This creates a document at: Firestore > settings > store
 * with the field: opening_time (string) — e.g. "7:00 AM"
 * 
 * The app reads this and shows the "Opening Soon" banner when all products are out of stock.
 */

const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyCtqSTywhBqxfYQx7MmqMlGiSv-On3MGBk",
    authDomain: "meatup-f8c49.firebaseapp.com",
    projectId: "meatup-f8c49",
    storageBucket: "meatup-f8c49.firebasestorage.app",
    messagingSenderId: "270170795022",
    appId: "1:270170795022:web:09f1eb597a81c69f22205f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedStoreSettings() {
    try {
        await setDoc(doc(db, "settings", "store"), {
            opening_time: "7:00 AM",       // The opening time shown in the banner
            closing_time: "9:00 PM",        // Optional: for display purposes
            store_name: "Meat Up",
            is_open: false,                 // Can be toggled from admin panel
        });
        console.log("✅ settings/store document created successfully!");
        console.log("   The app will now show the 'Opening Soon' banner when all products are out of stock.");
        console.log("   To update the opening time, edit the 'opening_time' field in Firebase Console:");
        console.log("   Firebase Console > Firestore > settings > store > opening_time");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating settings/store:", error);
        process.exit(1);
    }
}

seedStoreSettings();
