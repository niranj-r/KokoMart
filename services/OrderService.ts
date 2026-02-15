import { db } from '@/config/firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { Order } from '@/types';
import { UserService } from './UserService';

export const OrderService = {
    createOrder: async (orderData: Omit<Order, 'id' | 'created_at' | 'status'>) => {
        try {
            const today = new Date();
            const yy = today.getFullYear().toString().slice(-2);
            const mm = (today.getMonth() + 1).toString().padStart(2, '0');
            const dd = today.getDate().toString().padStart(2, '0');
            const dateStr = `${dd}${mm}${yy}`; // DDMMYY

            let display_id = '';
            let newOrderRef: any;

            await runTransaction(db, async (transaction) => {
                const counterRef = doc(db, 'counters', 'daily_orders');
                const counterSnap = await transaction.get(counterRef);

                let currentCount = 0;

                if (counterSnap.exists()) {
                    const data = counterSnap.data();
                    if (data.date === dateStr) {
                        currentCount = data.count || 0;
                    }
                    // If date doesn't match, currentCount stays 0 (reset)
                }

                currentCount++;
                const countStr = currentCount.toString().padStart(2, '0');
                display_id = `MU-${dateStr}-${countStr}`;

                transaction.set(counterRef, {
                    date: dateStr,
                    count: currentCount
                });

                const newOrder = {
                    ...orderData,
                    display_id,
                    status: 'pending',
                    created_at: Date.now()
                };

                // Create a ref for the new order and set it within transaction
                // Note: addDoc cannot be used directly in transaction, so we use doc() to generate ID and set()
                newOrderRef = doc(collection(db, 'orders'));
                transaction.set(newOrderRef, newOrder);
            });

            // Post-transaction updates (points etc) - these are best effort after order creation

            // Deduct wallet points if used
            if (orderData.wallet_used > 0) {
                const user = await UserService.getUser(orderData.user_id);
                if (user) {
                    await UserService.updateWallet(orderData.user_id, Math.max(0, user.wallet_points - orderData.wallet_used));
                }
            }

            // Add earned points
            if (orderData.earned_points > 0) {
                const user = await UserService.getUser(orderData.user_id);
                if (user) {
                    await UserService.updateWallet(orderData.user_id, user.wallet_points + orderData.earned_points);
                }
            }

            // Update first order status
            const user = await UserService.getUser(orderData.user_id);
            if (user && !user.is_first_order_completed) {
                await UserService.updateUser(orderData.user_id, { is_first_order_completed: true });
            }

            return { id: newOrderRef.id, display_id };
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },

    getUserOrders: async (userId: string): Promise<Order[]> => {
        try {
            const q = query(collection(db, 'orders'), where("user_id", "==", userId));
            // Note: Composite index might be needed for ordering by date with a filter on user_id
            // For now simpler query
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (error) {
            console.error("Error fetching user orders:", error);
            return [];
        }
    },

    updateOrderStatus: async (orderId: string, status: any) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status });
        } catch (error) {
            console.error("Error updating order status:", error);
            throw error;
        }
    },

    subscribeToUserOrders: (userId: string, callback: (orders: Order[]) => void) => {
        const q = query(collection(db, 'orders'), where("user_id", "==", userId));
        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            callback(orders);
        }, (error) => {
            console.error("Error subscribing to user orders:", error);
        });
    },

    // Safe update for demo simulation to prevent overwriting 'cancelled' status
    advanceDemoOrderStatus: async (orderId: string, nextStatus: any) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            // Transactionless check for simplicity, but reads fresh data
            const orderSnap = await import('firebase/firestore').then(mod => mod.getDoc(orderRef));

            if (orderSnap.exists()) {
                const currentStatus = orderSnap.data().status;
                if (currentStatus === 'cancelled' || currentStatus === 'delivered') {
                    console.log(`Skipping auto-update for order ${orderId} as it is ${currentStatus}`);
                    return;
                }
                await updateDoc(orderRef, { status: nextStatus });
            }
        } catch (error) {
            console.error("Error advancing order status:", error);
        }
    }
};
