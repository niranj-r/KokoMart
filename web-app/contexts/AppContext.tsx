'use client';
import { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { CartItem, User, Order, WalletTransaction, OrderStatus } from '@/types';
import { ProductService } from '@/services/ProductService';
import { OrderService } from '@/services/OrderService';
import { UserService } from '@/services/UserService';
import { useAuth } from './AuthContext';

interface AppState {
    user: User;
    cart: CartItem[];
    orders: Order[];
    walletHistory: WalletTransaction[];
    products: any[];
    cartTotal: number;
    cartItemCount: number;
    addToCart: (productId: string, quantity: number, weight: number, cuttingType?: string) => void;
    removeFromCart: (productId: string, weight: number, cuttingType?: string) => void;
    updateCartItemPrice: (productId: string) => void;
    clearCart: () => void;
    placeOrder: (
        address: string,
        deliverySlot: string,
        walletUsed?: number,
        note?: string,
        deliveryCharge?: number,
        paymentDetails?: { payment_id: string; razorpay_order_id: string }
    ) => Promise<any>;
    updateUserProfile: (data: Partial<User>) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
}

const defaultUser: User = {
    id: '1',
    name: 'Guest User',
    phone: '',
    email: '',
    is_first_order_completed: false,
    wallet_points: 0,
    created_at: Date.now(),
};

const AppContext = createContext<AppState>({} as AppState);

export function AppProvider({ children }: { children: ReactNode }) {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<User>(defaultUser);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [walletHistory] = useState<WalletTransaction[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Sync with Firebase Auth
    useEffect(() => {
        let unsubscribeOrders: (() => void) | undefined;
        let isMounted = true;

        const initUser = () => {
            if (authUser) {
                const unsubscribeUser = UserService.subscribeToUser(authUser.uid, (profile) => {
                    if (isMounted && profile) {
                        setUser({
                            id: profile.id,
                            name: profile.name,
                            email: profile.email,
                            phone: profile.phone || '',
                            address: profile.address || '',
                            is_first_order_completed: profile.is_first_order_completed,
                            wallet_points: profile.wallet_points,
                            created_at: profile.created_at,
                        });
                    }
                });

                unsubscribeOrders = OrderService.subscribeToUserOrders(authUser.uid, (userOrders) => {
                    if (isMounted) setOrders(userOrders);
                });

                return unsubscribeUser;
            } else {
                setUser({ ...defaultUser });
                setOrders([]);
            }
        };

        const userUnsubscribe = initUser();

        return () => {
            isMounted = false;
            if (unsubscribeOrders) unsubscribeOrders();
            if (userUnsubscribe && typeof userUnsubscribe === 'function') userUnsubscribe();
        };
    }, [authUser]);

    // Subscribe to products
    useEffect(() => {
        const unsubscribe = ProductService.subscribeToProducts((updatedProducts) => {
            setProducts(updatedProducts);
        });
        return () => unsubscribe();
    }, []);

    // Reactive point crediting
    useEffect(() => {
        orders.forEach(async (order) => {
            if (order.status === 'delivered' && !order.points_credited && (order.earned_points || 0) > 0) {
                await OrderService.ensurePointsCredited(order.id);
            }
        });
    }, [orders]);

    const addToCart = (productId: string, quantity: number, weight: number, cuttingType?: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        setCart((prev: CartItem[]) => {
            const existing = prev.find((item) => item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity, weight, cuttingType }];
        });
    };

    const removeFromCart = (productId: string, weight: number, cuttingType?: string) => {
        setCart((prev: CartItem[]) => {
            const existing = prev.find((item) => item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType);
            if (!existing) return prev;

            if (existing.quantity === 1) {
                return prev.filter((item) => !(item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType));
            }

            return prev.map((item) =>
                item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            );
        });
    };

    const updateCartItemPrice = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        setCart((prev: CartItem[]) => prev.map((item) => item.product.id === productId ? { ...item, product } : item));
    };

    const clearCart = () => setCart([]);

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => {
            let price = item.product.current_price;
            if (item.product.variants && item.cuttingType) {
                const variant = item.product.variants.find((v: any) => v.name === item.cuttingType);
                if (variant) price = variant.price;
            }
            return total + (price * item.quantity * item.weight);
        }, 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    const placeOrder = async (
        address: string,
        deliverySlot: string,
        walletUsed = 0,
        note?: string,
        deliveryCharge = 0,
        paymentDetails?: { payment_id: string; razorpay_order_id: string }
    ) => {
        if (!user.id) return;
        if (walletUsed > user.wallet_points) throw new Error("Insufficient wallet points");

        try {
            const subtotal = cartTotal;
            const discount = 0;
            const finalAmount = subtotal - discount - walletUsed + deliveryCharge;

            const orderPayload = {
                user_id: user.id,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    name: item.product.name,
                    quantity: item.quantity,
                    weight: item.weight,
                    price: item.product.current_price,
                    ...(item.cuttingType ? { cuttingType: item.cuttingType } : {}),
                })),
                total_amount: subtotal,
                discount,
                delivery_charge: deliveryCharge,
                wallet_used: walletUsed,
                final_amount: finalAmount,
                earned_points: Math.floor(cart.reduce((sum, item) => sum + item.weight * item.quantity, 0)),
                address,
                delivery_slot: deliverySlot,
                note,
                ...(paymentDetails ? {
                    payment_id: paymentDetails.payment_id,
                    razorpay_order_id: paymentDetails.razorpay_order_id,
                    payment_method: 'online',
                    is_paid: true
                } : {
                    payment_method: 'cod',
                    is_paid: false
                })
            };

            const result = await OrderService.createOrder(orderPayload);

            if (address && address !== user.address) {
                await UserService.updateUser(user.id, { address });
                setUser((prev: User) => ({ ...prev, address }));
            }

            clearCart();
            return result;
        } catch (e) {
            console.error("Order Failed", e);
            throw e;
        }
    };

    return (
        <AppContext.Provider value={{
            user, cart, orders, walletHistory, products, cartTotal, cartItemCount,
            addToCart, removeFromCart, updateCartItemPrice, clearCart, placeOrder,
            updateUserProfile: async (data: Partial<User>) => {
                if (!user.id) return;
                await UserService.updateUser(user.id, data);
                setUser((prev: User) => ({ ...prev, ...data }));
            },
            cancelOrder: async (orderId: string) => {
                const order = orders.find(o => o.id === orderId);
                if (!order || order.status !== 'pending') return;
                try {
                    await OrderService.updateOrderStatus(orderId, 'cancelled');
                    if (order.wallet_used > 0) {
                        const newPoints = user.wallet_points + order.wallet_used;
                        await UserService.updateWallet(user.id, newPoints);
                        setUser((prev: User) => ({ ...prev, wallet_points: newPoints }));
                    }
                    setOrders((prev: Order[]) => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
                } catch (error) {
                    console.error("Failed to cancel order", error);
                    throw error;
                }
            }
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
