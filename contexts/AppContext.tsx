import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import { CartItem, User, Order, WalletTransaction, OrderStatus } from '@/types';
import { ProductService } from '@/services/ProductService';
import { OrderService } from '@/services/OrderService';
import { UserService } from '@/services/UserService';
import { useAuth } from './AuthContext';

export const [AppProvider, useApp] = createContextHook(() => {
  const { user: authUser } = useAuth();


  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Guest User',
    phone: '',
    email: '',
    is_first_order_completed: false,
    wallet_points: 150,
    created_at: Date.now(),
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Sync with Firebase Auth
  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let simulationInterval: ReturnType<typeof setInterval> | undefined;
    let isMounted = true;

    const initUser = async () => {
      if (authUser) {
        // Fetch fresh profile from Firestore
        const profile = await UserService.getUser(authUser.uid);

        if (!isMounted) return;

        if (profile) {
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

          // Real-time order updates
          unsubscribeOrders = OrderService.subscribeToUserOrders(profile.id, async (userOrders) => {
            if (isMounted) {
              setOrders(userOrders);

              // Check if any order is recently delivered to refresh points
              // In a real app, you might want a more robust check (e.g. comparing with previous state)
              // For now, if there is a delivered order, we re-fetch the user to get updated points
              const hasDeliveredOrder = userOrders.some(o => o.status === 'delivered');
              if (hasDeliveredOrder) {
                const updatedUser = await UserService.getUser(profile.id);
                if (updatedUser && isMounted) {
                  setUser(prev => ({
                    ...prev,
                    wallet_points: updatedUser.wallet_points
                  }));
                }
              }
            }
          });

          // Simulation: Advance order status every 5 minutes
          const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'received', 'cutting', 'packing', 'out_for_delivery', 'delivered'];
          simulationInterval = setInterval(() => {
            console.log("Simulating order status updates...");
            setOrders(currentOrders => {
              currentOrders.forEach(async (order) => {
                if (order.status !== 'delivered' && order.status !== 'cancelled') {
                  const currentIndex = statusFlow.indexOf(order.status);
                  if (currentIndex !== -1 && currentIndex < statusFlow.length - 1) {
                    const nextStatus = statusFlow[currentIndex + 1];
                    try {
                      // Use safe update to check if it wasn't cancelled in the meantime
                      await OrderService.advanceDemoOrderStatus(order.id, nextStatus);
                      console.log(`Attempted auto-update for order ${order.id} to ${nextStatus}`);
                    } catch (e) {
                      console.error(`Failed to auto-update order ${order.id}`, e);
                    }
                  }
                }
              });
              return currentOrders;
            });
          }, 5 * 60 * 1000); // 5 minutes
        }
      } else {
        // Reset to guest
        setUser({
          id: '1',
          name: 'Guest User',
          phone: '',
          email: '',
          address: '',
          is_first_order_completed: false,
          wallet_points: 0,
          created_at: Date.now(),
        });
        setOrders([]);
      }
    };

    initUser();

    return () => {
      isMounted = false;
      if (unsubscribeOrders) unsubscribeOrders();
      if (simulationInterval) clearInterval(simulationInterval);
    };
  }, [authUser]);

  useEffect(() => {

    // Real-time subscription
    const unsubscribe = ProductService.subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts);
    });

    return () => unsubscribe();
  }, []);

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

    setCart((prev: CartItem[]) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, product }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      let price = item.product.current_price;
      if (item.product.variants && item.cuttingType) {
        const variant = item.product.variants.find(v => v.name === item.cuttingType);
        if (variant) {
          price = variant.price;
        }
      }
      return total + (price * item.quantity * item.weight);
    }, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const placeOrder = async (address: string, paymentMethod: string, walletUsed: number = 0, note?: string) => {
    if (!user.id) return;
    if (walletUsed > user.wallet_points) {
      throw new Error("Insufficient wallet points");
    }

    try {
      const subtotal = cartTotal;
      const discount = 0; // Implement discount logic if needed
      const finalAmount = subtotal - discount - walletUsed;
      // Chicken Points: 1 point per 1 kg (total weight)
      const earnedPoints = Math.floor(cart.reduce((sum, item) => sum + item.weight * item.quantity, 0));

      const orderPayload = {
        user_id: user.id,
        items: cart.map(item => {
          let price = item.product.current_price;
          if (item.product.variants && item.cuttingType) {
            const variant = item.product.variants.find(v => v.name === item.cuttingType);
            if (variant) price = variant.price;
          }
          return {
            product_id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            weight: item.weight,
            price: price,
            ...(item.cuttingType ? { cuttingType: item.cuttingType } : {}),
          };
        }),
        total_amount: subtotal,
        discount,
        wallet_used: walletUsed,
        final_amount: finalAmount,
        earned_points: earnedPoints,
        address,
        note,
      };

      const orderId = await OrderService.createOrder(orderPayload);

      // Update address if it's new/changed
      if (address && address !== user.address) {
        await UserService.updateUser(user.id, { address });
      }

      // Optimistic update for address and wallet points (deduction)
      setUser((prev: User) => ({
        ...prev,
        address: address || prev.address,
        wallet_points: Math.max(0, prev.wallet_points - walletUsed)
      }));

      clearCart();
      return orderId;
    } catch (e) {
      console.error("Order Failed", e);
      throw e;
    }
  };

  return {
    user,
    cart,
    orders,
    walletHistory,
    products,
    cartTotal,
    cartItemCount,
    addToCart,
    removeFromCart,
    updateCartItemPrice,
    clearCart,
    placeOrder,
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

        // Update local order state
        setOrders((prev: Order[]) => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));

      } catch (error) {
        console.error("Failed to cancel order", error);
        throw error;
      }
    }
  };
});
