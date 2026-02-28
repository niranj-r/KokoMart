import { db } from '@/config/firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, onSnapshot, getDoc, runTransaction } from 'firebase/firestore';
import { Order, OrderStatus } from '@/types';
import { UserService } from './UserService';

export const OrderService = {
    createOrder: async (orderData: Omit<Order, 'id' | 'created_at' | 'status'>) => {
        try {
            const today = new Date();
            const yy = today.getFullYear().toString().slice(-2);
            const mm = (today.getMonth() + 1).toString().padStart(2, '0');
            const dd = today.getDate().toString().padStart(2, '0');
            const dateStr = `${dd}${mm}${yy}`;

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
                }

                currentCount++;
                const countStr = currentCount.toString().padStart(2, '0');
                display_id = `MU-${dateStr}-${countStr}`;

                transaction.set(counterRef, { date: dateStr, count: currentCount });

                const newOrder = {
                    ...orderData,
                    display_id,
                    status: 'pending',
                    created_at: Date.now()
                };

                newOrderRef = doc(collection(db, 'orders'));
                transaction.set(newOrderRef, newOrder);
            });

            if (orderData.wallet_used > 0) {
                const user = await UserService.getUser(orderData.user_id);
                if (user) {
                    await UserService.updateWallet(orderData.user_id, Math.max(0, user.wallet_points - orderData.wallet_used));
                }
            }

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
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order))
                .sort((a, b) => b.created_at - a.created_at);
        } catch (error) {
            console.error("Error fetching user orders:", error);
            return [];
        }
    },

    updateOrderStatus: async (orderId: string, status: OrderStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) return;

            const orderData = orderSnap.data() as Order;
            const updates: any = { status };

            if (status === 'delivered' && !orderData.points_credited && (orderData.earned_points || 0) > 0) {
                const user = await UserService.getUser(orderData.user_id);
                if (user) {
                    await UserService.updateWallet(orderData.user_id, user.wallet_points + orderData.earned_points);
                    updates.points_credited = true;
                }
            }

            await updateDoc(orderRef, updates);
        } catch (error) {
            console.error("Error updating order status:", error);
            throw error;
        }
    },

    subscribeToUserOrders: (userId: string, callback: (orders: Order[]) => void) => {
        const q = query(collection(db, 'orders'), where("user_id", "==", userId));
        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order))
                .sort((a, b) => b.created_at - a.created_at);
            callback(orders);
        }, (error) => {
            console.error("Error subscribing to user orders:", error);
        });
    },

    ensurePointsCredited: async (orderId: string) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                const orderData = orderSnap.data() as Order;
                if (orderData.status === 'delivered' && !orderData.points_credited && (orderData.earned_points || 0) > 0) {
                    const user = await UserService.getUser(orderData.user_id);
                    if (user) {
                        const newTotal = (user.wallet_points || 0) + orderData.earned_points;
                        await UserService.updateWallet(orderData.user_id, newTotal);
                        await updateDoc(orderRef, { points_credited: true });
                    }
                }
            }
        } catch (error) {
            console.error("Error ensuring points credited:", error);
        }
    }
};
