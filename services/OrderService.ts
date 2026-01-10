import { db } from '@/config/firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Order } from '@/types';
import { UserService } from './UserService';

export const OrderService = {
    createOrder: async (orderData: Omit<Order, 'id' | 'created_at' | 'status'>) => {
        try {
            const newOrder = {
                ...orderData,
                status: 'pending',
                created_at: Date.now()
            };

            const docRef = await addDoc(collection(db, 'orders'), newOrder);

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

            return docRef.id;
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
    }
};
