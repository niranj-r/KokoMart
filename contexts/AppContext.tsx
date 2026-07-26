import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useRef } from 'react';
import { CartItem, User, Order, WalletTransaction, OrderStatus, UserAddress } from '@/types';
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
    wallet_points: 150,
    addresses: [],
    created_at: Date.now(),
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef<Order[]>([]); // Ref to track orders for interval without stale closures
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Preorder state
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null);
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState<string | null>(null);

  // Keep ref in sync
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Sync with Firebase Auth
  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let simulationInterval: ReturnType<typeof setInterval> | undefined;
    let isMounted = true;

    const initUser = () => {
      if (authUser) {
        // Real-time user profile subscription
        const unsubscribeUser = UserService.subscribeToUser(authUser.uid, (profile) => {
          if (isMounted && profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone || '',
              address: profile.address || '',
              addresses: (profile.addresses && profile.addresses.length > 0) 
                ? profile.addresses.reduce((acc: UserAddress[], curr) => {
                    if (!acc.some(a => a.id === curr.id)) acc.push(curr);
                    return acc;
                  }, [])
                : (profile.address ? [{
                    id: 'primary-legacy',
                    label: 'Primary',
                    details: profile.address,
                    isPrimary: true
                  }] : []),
              wallet_points: profile.wallet_points,
              created_at: profile.created_at,
            });
          }
        });

        // Real-time order updates
        unsubscribeOrders = OrderService.subscribeToUserOrders(authUser.uid, (userOrders) => {
          if (isMounted) {
            setOrders(userOrders);
          }
        });

        return unsubscribeUser;

      } else {
        // Reset to guest
        setUser({
          id: '1',
          name: 'Guest User',
          phone: '',
          email: '',
          address: '',
          addresses: [],
          wallet_points: 0,
          created_at: Date.now(),
        });
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

  useEffect(() => {

    // Real-time subscription
    const unsubscribe = ProductService.subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts);
    });

    return () => unsubscribe();
  }, []);

  // Reactive point crediting
  // If the Admin Portal updates status to 'delivered' but doesn't credit points, this client will do it.
  useEffect(() => {
    orders.forEach(async (order) => {
      if (order.status === 'delivered' && !order.points_credited && (order.earned_points || 0) > 0) {
        console.log(`[AppContext] Detected delivered order ${order.id} needing points. Triggering credit.`);
        await OrderService.ensurePointsCredited(order.id);
      }
    });
  }, [orders]);

  const cartTotalWeight = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemUnit = item.product.unit.toUpperCase();
      if (itemUnit === 'KG') return total + (item.weight * item.quantity);
      if (itemUnit === 'G') return total + ((item.weight * item.quantity) / 1000);
      return total;
    }, 0);
  }, [cart]);

  const addToCart = (productId: string, quantity: number, weight: number, cuttingType?: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, message: 'Product not found' };

    // Calculate additional weight in KG
    const unit = product.unit.toUpperCase();
    let additionalWeightInKg = 0;
    if (unit === 'KG') {
      additionalWeightInKg = weight * quantity;
    } else if (unit === 'G') {
      additionalWeightInKg = (weight * quantity) / 1000;
    }

    if (cartTotalWeight + additionalWeightInKg > 25) {
      return { success: false, message: 'You can only order up to 25kg in a single order.' };
    }

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

  const placeOrder = async (
    address: string,
    deliverySlot: string,
    walletUsed: number = 0,
    note?: string,
    deliveryCharge: number = 0,
    taxAmount: number = 0,
    platformFee: number = 0,
    discount: number = 0,
    paymentMethod: 'online' | 'cod' = 'cod',
    paymentDetails?: { payment_id: string; razorpay_order_id: string }
  ) => {
    if (!user.id) return;
    if (walletUsed > user.wallet_points) {
      throw new Error("Insufficient wallet points");
    }

    try {
      const subtotal = cartTotal;
      const finalAmount = subtotal + taxAmount + platformFee + deliveryCharge - discount - walletUsed;

      // Chicken Points: 1 point per 1 kg (total weight)
      // ... existing code ...

      const orderPayload = {
        user_id: user.id,
        items: cart.map(item => {
          // Use variant price if a variant/cuttingType is selected (e.g. Brown Egg vs White Egg)
          let itemPrice = item.product.current_price;
          if (item.product.variants && item.cuttingType) {
            const variant = item.product.variants.find(v => v.name === item.cuttingType);
            if (variant) itemPrice = variant.price;
          }
          return {
            product_id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            weight: item.weight,
            unit: item.product.unit,
            price: itemPrice * item.weight,
            ...(item.cuttingType ? { cuttingType: item.cuttingType } : {}),
          };
        }),
        total_amount: subtotal,
        discount,
        tax_amount: taxAmount,
        platform_fee: platformFee,
        delivery_charge: deliveryCharge,
        wallet_used: walletUsed,
        final_amount: finalAmount,
        earned_points: Math.floor(cart.reduce((sum, item) => {
          const unit = item.product.unit.toUpperCase();
          const isMeat = unit === 'KG' || unit === 'G';
          return isMeat ? sum + item.weight * item.quantity : sum;
        }, 0)),
        address,
        delivery_slot: deliverySlot,
        note,
        payment_method: paymentMethod,
        ...(paymentDetails ? {
          payment_id: paymentDetails.payment_id,
          razorpay_order_id: paymentDetails.razorpay_order_id
        } : {})
      };

      const result = await OrderService.createOrder(orderPayload);

      // Save address if it's completely new (not in addresses list)
      const isAlreadySaved = user.addresses?.some(a => 
        a.details.trim().toLowerCase() === address.trim().toLowerCase()
      );
      
      if (address && !isAlreadySaved && !isGuest) {
        const newAddrObj: UserAddress = {
          id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label: 'Other',
          details: address.trim(),
          isPrimary: false
        };
        await UserService.saveAddress(user.id, newAddrObj);
        // Note: No optimistic update here; let onSnapshot handle the sync to prevent duplicates
      }

      clearCart();
      return result;
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
    cartTotalWeight,
    selectedDeliveryDate,
    setSelectedDeliveryDate,
    selectedDeliverySlot,
    setSelectedDeliverySlot,
    addToCart,
    removeFromCart,
    updateCartItemPrice,
    clearCart,
    placeOrder,
    isGuest: !authUser,
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
    },
    saveAddress: async (addressDetails: string, label: string = 'Other') => {
      if (!user.id || !addressDetails.trim()) return;
      
      // Check if already exists to prevent duplicates
      const exists = user.addresses?.some(a => 
        a.details.trim().toLowerCase() === addressDetails.trim().toLowerCase()
      );
      if (exists) return;

      const newAddrObj: UserAddress = {
        id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label,
        details: addressDetails.trim(),
        isPrimary: (user.addresses || []).length === 0
      };
      await UserService.saveAddress(user.id, newAddrObj);
      // Let onSnapshot handle the update to ensure single source of truth
    },
    removeAddress: async (address: string | UserAddress) => {
      if (!user.id) return;
      const addrObj = typeof address === 'string' 
        ? user.addresses?.find(a => a.details === address)
        : address;
      
      if (!addrObj) return;

      await UserService.removeAddress(user.id, addrObj);
      setUser((prev: User) => ({ 
        ...prev, 
        addresses: (prev.addresses || []).filter(a => a.id !== addrObj.id) 
      }));
    }
  };
});