import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function CartScreen() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, cartTotal, user } = useApp();
  const insets = useSafeAreaInsets();

  const firstOrderDiscount = !user.is_first_order_completed ? cartTotal * 0.1 : 0;
  const finalTotal = cartTotal - firstOrderDiscount;

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top }]}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Cart</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingBag size={80} color={Colors.extrared} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some fresh chicken to get started</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.emptyButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Cart ({cart.length})</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!user.is_first_order_completed && (
          <View style={styles.discountBanner}>
            <Text style={styles.discountText}>🎉 First Order 10% OFF Applied!</Text>
          </View>
        )}

        <View style={styles.itemsContainer}>
          {cart.map((item, index) => (
            <View key={`${item.product.id}-${item.weight}-${index}`} style={styles.cartItem}>
              <Image source={{ uri: item.product.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemWeight}>
                  {item.weight}kg
                  {item.cuttingType ? ` • ${item.cuttingType}` : ''}
                </Text>
                <Text style={styles.itemPrice}>
                  ₹{item.product.current_price * item.weight * item.quantity}
                </Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => removeFromCart(item.product.id, item.weight, item.cuttingType)}
                >
                  {item.quantity === 1 ? (
                    <Trash2 size={18} color={Colors.priceDown} />
                  ) : (
                    <Minus size={18} color={Colors.charcoal} />
                  )}
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => addToCart(item.product.id, item.weight, item.cuttingType!)}
                >
                  <Plus size={18} color={Colors.charcoal} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Bill Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
          </View>
          {firstOrderDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountLabel]}>
                First Order Discount (10%)
              </Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -₹{firstOrderDiscount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
          <Text style={styles.pointsEarn}>
            You will earn {Math.floor(cart.reduce((sum, item) => sum + item.weight * item.quantity, 0))} Chicken Points
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.footer}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerPrice}>₹{finalTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push('/checkout')}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  safeArea: {
    backgroundColor: Colors.deepTeal,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.extrared,
    marginBottom: 32,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: Colors.orange,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  discountBanner: {
    backgroundColor: Colors.priceUp,
    padding: 16,
    margin: 20,
    borderRadius: 16,
  },
  discountText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
    textAlign: 'center',
  },
  itemsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: Colors.creamLight,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  itemWeight: {
    fontSize: 14,
    color: Colors.extrared,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.orange,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.creamLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    minWidth: 24,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: Colors.white,
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.charcoal,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.charcoal,
  },
  discountLabel: {
    color: Colors.priceUp,
  },
  discountValue: {
    color: Colors.priceUp,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.creamLight,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.orange,
  },
  pointsEarn: {
    fontSize: 14,
    color: Colors.tealBlue,
    fontWeight: '600' as const,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.creamLight,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerLabel: {
    fontSize: 14,
    color: Colors.extrared,
    marginBottom: 4,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
  },
  checkoutButton: {
    backgroundColor: Colors.orange,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
});
