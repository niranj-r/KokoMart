import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MapPin, Clock, Wallet } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cartTotal, user, placeOrder } = useApp();
  const [address, setAddress] = useState(user.address || '123 Main Street, Bangalore');
  const [deliverySlot, setDeliverySlot] = useState('Today, 6:00 PM - 8:00 PM');
  const [useWalletPoints, setUseWalletPoints] = useState(false);

  const firstOrderDiscount = !user.is_first_order_completed ? cartTotal * 0.1 : 0;
  const maxWalletRedemption = Math.min(user.wallet_points, cartTotal - firstOrderDiscount);
  const walletDeduction = useWalletPoints ? maxWalletRedemption : 0;
  const finalTotal = cartTotal - firstOrderDiscount - walletDeduction;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }

    try {
      const orderId = await placeOrder(address, deliverySlot, walletDeduction);
      Alert.alert(
        'Order Placed! 🎉',
        `Your order #${orderId.slice(-6)} has been placed successfully`,
        [
          {
            text: 'View Orders',
            onPress: () => router.replace('/orders'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Checkout',
          headerStyle: { backgroundColor: Colors.deepTeal },
          headerTintColor: Colors.cream,
          headerTitleStyle: { fontWeight: 'bold' as const },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={Colors.orange} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter delivery address"
            placeholderTextColor={Colors.priceNeutral}
            multiline
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={Colors.orange} />
            <Text style={styles.sectionTitle}>Delivery Slot</Text>
          </View>
          <View style={styles.slotContainer}>
            {[
              'Today, 6:00 PM - 8:00 PM',
              'Tomorrow, 10:00 AM - 12:00 PM',
              'Tomorrow, 6:00 PM - 8:00 PM',
            ].map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slotOption,
                  deliverySlot === slot && styles.slotOptionActive,
                ]}
                onPress={() => setDeliverySlot(slot)}
              >
                <Text
                  style={[
                    styles.slotText,
                    deliverySlot === slot && styles.slotTextActive,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {user.wallet_points > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Wallet size={20} color={Colors.orange} />
              <Text style={styles.sectionTitle}>Chicken Points Wallet</Text>
            </View>
            <TouchableOpacity
              style={styles.walletCard}
              onPress={() => setUseWalletPoints(!useWalletPoints)}
            >
              <View style={styles.walletInfo}>
                <Text style={styles.walletBalance}>
                  {user.wallet_points} Points Available
                </Text>
                <Text style={styles.walletSubtext}>
                  Max redemption: ₹{maxWalletRedemption}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  useWalletPoints && styles.checkboxActive,
                ]}
              >
                {useWalletPoints && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
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
          {walletDeduction > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountLabel]}>
                Wallet Points Used
              </Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -₹{walletDeduction.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
          <Text style={styles.paymentMethod}>💵 Cash on Delivery</Text>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.footer}>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderText}>Place Order - ₹{finalTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.charcoal,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: Colors.creamLight,
  },
  slotContainer: {
    gap: 12,
  },
  slotOption: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.creamLight,
  },
  slotOptionActive: {
    backgroundColor: Colors.tealBlue,
    borderColor: Colors.tealBlue,
  },
  slotText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.charcoal,
  },
  slotTextActive: {
    color: Colors.white,
  },
  walletCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.creamLight,
  },
  walletInfo: {
    flex: 1,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  walletSubtext: {
    fontSize: 14,
    color: Colors.priceNeutral,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.creamLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.tealBlue,
    borderColor: Colors.tealBlue,
  },
  checkmark: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: 'bold' as const,
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
  paymentMethod: {
    fontSize: 14,
    color: Colors.priceNeutral,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600' as const,
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.creamLight,
    padding: 20,
  },
  placeOrderButton: {
    backgroundColor: Colors.orange,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  placeOrderText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
});
