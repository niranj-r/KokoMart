import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Order, OrderStatus } from '../types';

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
    // Fetch orders that are ready for delivery or in progress.
    // For now, let's fetch 'confirmed', 'packing', 'cutting', 'out_for_delivery'.
    // You might want to filter this further based on requirements.
    const q = query(
        collection(db, 'orders'),
        where('status', '==', 'out_for_delivery'),
        orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
        });
        callback(orders);
    });

    return unsubscribe;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
};
