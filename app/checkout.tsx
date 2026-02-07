import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MapPin, Clock, Wallet, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { calculateDistance, calculateDeliveryTime, STORE_LOCATION } from '@/utils/locationUtils';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, cartTotal, user, placeOrder } = useApp();
  const [address, setAddress] = useState(user.address || '');
  const [useWalletPoints, setUseWalletPoints] = useState(false);

  const [locationLoading, setLocationLoading] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const firstOrderDiscount = !user.is_first_order_completed ? cartTotal * 0.1 : 0;

  // Tax Calculation
  const taxRate = 0; // 0% for now
  const taxAmount = cartTotal * taxRate;

  const maxWalletRedemption = Math.min(user.wallet_points, cartTotal - firstOrderDiscount + taxAmount);
  const walletDeduction = useWalletPoints ? maxWalletRedemption : 0;

  const finalTotal = cartTotal + taxAmount - firstOrderDiscount - walletDeduction;

  useEffect(() => {
    // Attempt to get location on mount if address is empty or just to check
    getCurrentLocation();
  }, []);

  // Auto-calculate delivery when address changes
  useEffect(() => {
    if (!address.trim()) return;

    const timer = setTimeout(() => {
      calculateFromAddress();
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [address]);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const dist = calculateDistance(
        latitude,
        longitude,
        STORE_LOCATION.latitude,
        STORE_LOCATION.longitude
      );

      // Apply road factor for display as well? Let's show direct for now or consistent with time calc logic
      const roadDist = dist * 1.4;

      setDeliveryDistance(parseFloat(roadDist.toFixed(1)));
      setDeliveryTime(calculateDeliveryTime(dist)); // function handles road factor internally if needed, but we used dist directly in util? Let's check util. 
      // Actually util applies * 1.4 inside. calculateDistance returns direct distance.
      // So passed 'dist' (direct) to calculateDeliveryTime (which multiplies by 1.4) is correct.

      // Reverse geocoding for address if empty
      if (!address) {
        let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const formattedAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
          setAddress(formattedAddress);
        }
      }

    } catch (error) {
      setLocationError('Could not fetch location');
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  const calculateFromAddress = async () => {
    if (!address.trim()) return;

    setLocationLoading(true);
    setLocationError(null);

    // Function to try geocoding an address string
    const tryGeocode = async (addr: string) => {
      // 1. Try Expo
      try {
        const result = await Location.geocodeAsync(addr);
        if (result.length > 0) return { lat: result[0].latitude, lon: result[0].longitude };
      } catch (e) { }

      // 2. Try Nominatim
      try {
        const encoded = encodeURIComponent(addr);
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`, {
          headers: { 'User-Agent': 'KokoMartApp/1.0' }
        });
        const data = await resp.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      } catch (e) { }

      return null;
    };

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      // Step 1: Try full address
      let coords = await tryGeocode(address);

      // Step 2: If failed, try simplified address (remove house no/name)
      // Format: House no, house name, landmark, place, city, state - pincode
      if (!coords) {
        // Try to extract from "place" onwards or just "city, state - pincode"
        // Simple heuristic: take the last 3 parts or distinct parts if comma separated
        const parts = address.split(',').map((p: string) => p.trim());
        if (parts.length > 2) {
          // Try joining last 3 parts (likely Place, City, State-Pin)
          const simpleAddress = parts.slice(-3).join(', ');
          console.log("Trying simplified address:", simpleAddress);
          coords = await tryGeocode(simpleAddress);
        }
      }

      // Step 3: Try just Pincode if available
      if (!coords) {
        const pincodeMatch = address.match(/\b\d{6}\b/);
        if (pincodeMatch) {
          console.log("Trying pincode:", pincodeMatch[0]);
          coords = await tryGeocode(pincodeMatch[0]);
        }
      }

      if (!coords) {
        setLocationError('Could not find location. Please ensure "City, State - Pincode" is correct.');
        return;
      }

      const { lat, lon } = coords;
      const dist = calculateDistance(
        lat,
        lon,
        STORE_LOCATION.latitude,
        STORE_LOCATION.longitude
      );

      const roadDist = dist * 1.4;

      setDeliveryDistance(parseFloat(roadDist.toFixed(1)));
      setDeliveryTime(calculateDeliveryTime(dist));

    } catch (error) {
      setLocationError('Error calculating distance');
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }

    // We can use the calculated time string as the "slot"
    const slotString = deliveryTime
      ? `Within ${deliveryTime} mins`
      : 'Standard Delivery';

    try {
      const orderId = await placeOrder(address, slotString, walletDeduction);
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
          <View style={styles.addressContainer}>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="House, Landmark, City, State - Pincode"
              placeholderTextColor={Colors.priceNeutral}
              multiline
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Navigation size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
          {/* Auto-calculates now, button removed */}
          {locationError && (
            <Text style={styles.errorText}>{locationError}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={Colors.orange} />
            <Text style={styles.sectionTitle}>Estimated Delivery</Text>
          </View>

          <View style={styles.deliveryCard}>
            {deliveryTime ? (
              <>
                <Text style={styles.deliveryTimeBig}>{deliveryTime} mins</Text>
                <Text style={styles.deliveryDistance}>
                  Distance: {deliveryDistance} km ({deliveryDistance! <= 7 ? 'Base Range' : 'Extended Range'})
                </Text>
                <Text style={styles.deliveryNote}>
                  Based on your location relative to Sreekaryam Store.
                </Text>
              </>
            ) : (
              <View style={{ alignItems: 'center', padding: 10 }}>
                {locationLoading ? (
                  <ActivityIndicator size="small" color={Colors.orange} />
                ) : (
                  <Text style={styles.deliveryPlaceholder}>
                    {address.trim() ? 'Calculating...' : 'Enter address to see delivery time'}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {
          user.wallet_points > 0 && (
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
          )
        }

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>

          {/* Itemized Bill */}
          <View style={styles.billItems}>
            {cart.map((item, index) => (
              <View key={item.product.id || index} style={styles.billRow}>
                <Text style={styles.billItemName}>
                  {item.product.name} <Text style={styles.billItemQty}>x{item.quantity}</Text>
                  {item.product.category === 'chicken' && item.cuttingType && (
                    <Text style={styles.billItemMeta}> ({item.cuttingType})</Text>
                  )}
                </Text>
                <Text style={styles.billItemPrice}>₹{(item.product.current_price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax ({(taxRate * 100).toFixed(0)}%)</Text>
            <Text style={styles.summaryValue}>+₹{taxAmount.toFixed(2)}</Text>
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
      </ScrollView >

      <SafeAreaView style={styles.footer}>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderText}>Place Order - ₹{finalTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View >
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
  addressContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
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
  locationButton: {
    width: 50,
    backgroundColor: Colors.tealBlue,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.priceDown,
    marginTop: 8,
    fontSize: 14,
  },
  deliveryCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.creamLight,
    alignItems: 'center',
  },
  deliveryTimeBig: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: Colors.orange,
    marginBottom: 8,
  },
  deliveryDistance: {
    fontSize: 16,
    color: Colors.charcoal,
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  deliveryNote: {
    fontSize: 14,
    color: Colors.priceNeutral,
    textAlign: 'center',
  },
  deliveryPlaceholder: {
    fontSize: 16,
    color: Colors.priceNeutral,
    fontStyle: 'italic',
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
  calculateButton: {
    backgroundColor: Colors.deepTeal,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: Colors.white,
    fontWeight: 'bold' as const,
    fontSize: 14,
  },
  billItems: {
    marginBottom: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billItemName: {
    fontSize: 15,
    color: Colors.charcoal,
    flex: 1,
  },
  billItemQty: {
    fontWeight: 'bold',
    color: Colors.tealBlue,
  },
  billItemMeta: {
    fontSize: 13,
    color: Colors.priceNeutral,
    fontStyle: 'italic',
  },
  billItemPrice: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.charcoal,
  },
});
