import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import { CartItem, User, Order, WalletTransaction, OrderStatus } from '@/types';
import { MOCK_PRODUCTS } from '@/mocks/products';
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
    created_at: new Date().toISOString(),
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Sync with Firebase Auth
  useEffect(() => {
    if (authUser) {
      // Fetch fresh profile from Firestore
      UserService.getUser(authUser.uid).then(profile => {
        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || '',
            address: profile.address || '',
            is_first_order_completed: profile.is_first_order_completed,
            wallet_points: profile.wallet_points,
            created_at: new Date(profile.created_at).toISOString(),
          });

          // Real-time order updates
          const unsubscribeOrders = OrderService.subscribeToUserOrders(profile.id, (userOrders) => {
            setOrders(userOrders);
          });

          // Simulation: Advance order status every 5 minutes
          const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'received', 'cutting', 'packing', 'out_for_delivery', 'delivered'];
          const simulationInterval = setInterval(() => {
            console.log("Simulating order status updates...");
            setOrders(currentOrders => { // Access latest state if needed for logic, but we act on Firestore
              currentOrders.forEach(async (order) => {
                if (order.status !== 'delivered' && order.status !== 'cancelled') {
                  const currentIndex = statusFlow.indexOf(order.status);
                  if (currentIndex !== -1 && currentIndex < statusFlow.length - 1) {
                    const nextStatus = statusFlow[currentIndex + 1];
                    try {
                      await OrderService.updateOrderStatus(order.id, nextStatus);
                      console.log(`Updated order ${order.id} to ${nextStatus}`);
                    } catch (e) {
                      console.error(`Failed to auto-update order ${order.id}`, e);
                    }
                  }
                }
              });
              return currentOrders; // State update handled by subscription
            });
          }, 5 * 60 * 1000); // 5 minutes

          return () => {
            unsubscribeOrders();
            clearInterval(simulationInterval);
          };
        }
      });
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
        created_at: new Date().toISOString(),
      });
    }
  }, [authUser]);

  useEffect(() => {
    // Initial load and seeding check
    const initProducts = async () => {
      let fetchedProducts = await ProductService.getAllProducts();

      if (fetchedProducts.length === 0) {
        console.log("Seeding products...");
        for (const product of MOCK_PRODUCTS) {
          await ProductService.seedProduct(product);
        }
      }
    };
    initProducts();

    // Real-time subscription
    const unsubscribe = ProductService.subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts);
    });

    return () => unsubscribe();
  }, []);

  const addToCart = (productId: string, weight: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev: CartItem[]) => {
      const existing = prev.find((item) => item.product.id === productId && item.weight === weight);
      if (existing) {
        return prev.map((item) =>
          item.product.id === productId && item.weight === weight
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, weight }];
    });
  };

  const removeFromCart = (productId: string, weight: number) => {
    setCart((prev: CartItem[]) => {
      const existing = prev.find((item) => item.product.id === productId && item.weight === weight);
      if (!existing) return prev;

      if (existing.quantity === 1) {
        return prev.filter((item) => !(item.product.id === productId && item.weight === weight));
      }

      return prev.map((item) =>
        item.product.id === productId && item.weight === weight
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
    return cart.reduce((sum, item) => sum + item.product.current_price * item.weight * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const placeOrder = async (address: string, deliverySlot: string, walletUsed: number) => {
    const subtotal = cartTotal;
    const discount = user.is_first_order_completed ? 0 : subtotal * 0.1;
    const finalAmount = subtotal - discount - walletUsed;
    const earnedPoints = Math.floor(cart.reduce((sum, item) => sum + item.weight * item.quantity, 0));

    try {
      const orderId = await OrderService.createOrder({
        user_id: user.id,
        items: cart.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          weight: item.weight,
          price: item.product.current_price
        })),
        total_amount: subtotal,
        discount,
        wallet_used: walletUsed,
        final_amount: finalAmount,
        earned_points: earnedPoints,
        // status and created_at are handled by the service
      });

      const newOrder: Order = {
        id: orderId,
        user_id: user.id,
        items: cart.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          weight: item.weight,
          price: item.product.current_price
        })),
        total_amount: subtotal,
        discount,
        wallet_used: walletUsed,
        final_amount: finalAmount,
        earned_points: earnedPoints,
        status: 'pending',
        created_at: Date.now(),
      };

      setOrders((prev: Order[]) => [newOrder, ...prev]);

      if (!user.is_first_order_completed) {
        setUser((prev: User) => ({ ...prev, is_first_order_completed: true }));
      }

      if (walletUsed > 0) {
        setUser((prev: User) => ({ ...prev, wallet_points: prev.wallet_points - walletUsed }));
      }

      // Update address if it's new/changed
      if (address && address !== user.address) {
        await UserService.updateUser(user.id, { address });
        setUser((prev: User) => ({ ...prev, address }));
      }

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
