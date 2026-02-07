import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Order, OrderStatus } from '../types';

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
    // Fetch orders that are ready for delivery or in progress.
    // For now, let's fetch 'confirmed', 'packing', 'cutting', 'out_for_delivery'.
    // You might want to filter this further based on requirements.
    const q = query(
        collection(db, 'orders'),
        where('status', '==', 'out_for_delivery')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
        });

        // Sort client-side to avoid composite index requirement
        orders.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA; // Descending order
        });

        callback(orders);
    });

    return unsubscribe;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
};
