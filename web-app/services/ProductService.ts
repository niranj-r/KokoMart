import { db } from '@/config/firebaseConfig';
import { collection, getDocs, doc, getDoc, addDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Product } from '@/types';

export const ProductService = {
    getAllProducts: async (): Promise<Product[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, 'products'));
            return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        } catch (error) {
            console.error("Error fetching products:", error);
            return [];
        }
    },

    subscribeToProducts: (callback: (products: Product[]) => void) => {
        const q = collection(db, 'products');
        return onSnapshot(q, (snapshot) => {
            const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            callback(products);
        }, (error) => {
            console.error("Error subscribing to products:", error);
        });
    },

    getProductById: async (id: string): Promise<Product | null> => {
        try {
            const docRef = doc(db, 'products', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Product;
            }
            return null;
        } catch (error) {
            console.error("Error fetching product:", error);
            return null;
        }
    },

    updateProduct: async (id: string, updates: Partial<Product>) => {
        try {
            const docRef = doc(db, 'products', id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating product:", error);
        }
    }
};
