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
  Switch,
  Platform,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MapPin, Clock, Wallet, Navigation, FileText, ChevronLeft, CheckCircle2, Truck, TicketPercent, Sparkles, AlertCircle, Plus, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { calculateDistance, calculateDeliveryTime, STORE_LOCATION, getGoogleMapsDistance } from '@/utils/locationUtils';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import RazorpayCheckoutGateway from '@/components/RazorpayCheckoutGateway';
import { encode } from 'base-64';
import Constants from 'expo-constants';
import { firebaseConfig } from '@/config/firebaseConfig';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, cartTotal, user, placeOrder, isGuest, saveAddress, selectedDeliveryDate, selectedDeliverySlot } = useApp();
  const [address, setAddress] = useState(user.address || '');
  const [useWalletPoints, setUseWalletPoints] = useState(false);
  const [note, setNote] = useState('');
  const [orderSuccessVisible, setOrderSuccessVisible] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod');
  const [showRazorpayGateway, setShowRazorpayGateway] = useState(false);
  const [currentRazorpayOrderId, setCurrentRazorpayOrderId] = useState('');

  const [locationLoading, setLocationLoading] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastCalculatedAddress, setLastCalculatedAddress] = useState('');

  // New Address In Checkout State
  const [showAddAddressInline, setShowAddAddressInline] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrDetails, setNewAddrDetails] = useState('');
  const [isSavingNewAddr, setIsSavingNewAddr] = useState(false);



  // Tax Calculation
  const taxRate = 0.05; // 5%
  const taxAmount = cartTotal * taxRate;

  // Platform Fee Calculation (0%)
  const platformFeeRate = 0.00; // 0%
  const handlingFee = cartTotal * platformFeeRate;

  // Delivery Charge Calculation
  const ratePerKm = 7;
  let deliveryCharge = 0;

  if (deliveryDistance !== null && deliveryDistance >= 0) {
    deliveryCharge = Math.max(1, Math.ceil(deliveryDistance)) * ratePerKm;
  }

  const maxWalletRedemption = Math.min(user.wallet_points, cartTotal + taxAmount + handlingFee + deliveryCharge);
  const walletDeduction = useWalletPoints ? maxWalletRedemption : 0;

  const finalTotal = Math.max(0, cartTotal + taxAmount + handlingFee + deliveryCharge - walletDeduction);

  useEffect(() => {
    // Attempt to get location on mount if address is empty or just to check
    getCurrentLocation();
  }, []);

  // Auto-calculate delivery when address changes
  useEffect(() => {
    if (!address.trim() || address === lastCalculatedAddress) return;

    const timer = setTimeout(() => {
      calculateFromAddress();
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [address, lastCalculatedAddress]);

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

      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || firebaseConfig.apiKey || '';
      let dist = 0;
      let time = 0;

      // --- 1. GOOGLE ROUTE DISTANCE (PRIMARY) ---
      const googleData = await getGoogleMapsDistance(latitude, longitude, STORE_LOCATION.latitude, STORE_LOCATION.longitude, apiKey);
      if (googleData) {
        dist = googleData.distanceKm;
        time = calculateDeliveryTime(dist, true); // True flag skips the curvature multiplier
      } 
      // --- 2. HAVERSINE DISTANCE (FALLBACK) ---
      else {
        const straightDist = calculateDistance(latitude, longitude, STORE_LOCATION.latitude, STORE_LOCATION.longitude);
        dist = straightDist * 1.4;                  // Curve multiplier applied to straight line
        time = calculateDeliveryTime(straightDist, false); // False flag adds 1.4x factor to time calculation
      }

      setDeliveryDistance(parseFloat(dist.toFixed(1)));
      setDeliveryTime(time);

      if (!address) {
        let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const formattedAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
          setAddress(formattedAddress);
          setLastCalculatedAddress(formattedAddress);
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

    const tryGeocode = async (addr: string) => {
      // Add local region context if not already present to ensure highly accurate local geocoding
      let query = addr;
      const lowerAddr = addr.toLowerCase();
      if (!lowerAddr.includes('trivandrum') && !lowerAddr.includes('thiruvananthapuram')) {
        query = `${addr}, Trivandrum, Kerala, India`;
      }

      try {
        const result = await Location.geocodeAsync(query);
        if (result.length > 0) return { lat: result[0].latitude, lon: result[0].longitude };
      } catch (e) { }

      try {
        const encoded = encodeURIComponent(query);
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`, {
          headers: { 'User-Agent': 'MeatUPApp/1.0' }
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

      let coords = await tryGeocode(address);

      // Progressive fallback: strip items from the beginning to geocode general locality/street
      if (!coords) {
        const parts = address.split(',').map((p: string) => p.trim());
        for (let i = 1; i < parts.length; i++) {
          const subAddress = parts.slice(i).join(', ');
          if (subAddress.trim()) {
            coords = await tryGeocode(subAddress);
            if (coords) break;
          }
        }
      }

      // Final fallback: match and geocode just the 6-digit pincode if present
      if (!coords) {
        const pincodeMatch = address.match(/\b\d{6}\b/);
        if (pincodeMatch) {
          coords = await tryGeocode(pincodeMatch[0]);
        }
      }

      if (!coords) {
        setLocationError('Could not find location. Please ensure "City, State - Pincode" is correct.');
        return;
      }

      const { lat, lon } = coords;
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || firebaseConfig.apiKey || '';
      let dist = 0;
      let time = 0;

      // --- 1. GOOGLE ROUTE DISTANCE (PRIMARY) ---
      const googleData = await getGoogleMapsDistance(lat, lon, STORE_LOCATION.latitude, STORE_LOCATION.longitude, apiKey);
      if (googleData) {
        dist = googleData.distanceKm;
        time = calculateDeliveryTime(dist, true); // True flag skips the curvature multiplier
      } 
      // --- 2. HAVERSINE DISTANCE (FALLBACK) ---
      else {
        const straightDist = calculateDistance(lat, lon, STORE_LOCATION.latitude, STORE_LOCATION.longitude);
        dist = straightDist * 1.4;                  // Curve multiplier applied to straight line
        time = calculateDeliveryTime(straightDist, false); // False flag adds 1.4x factor to time calculation
      }

      if (dist > 25) {
        setDeliveryDistance(parseFloat(dist.toFixed(1)));
        setLocationError('Delivery is restricted to 25km from our store. Please choose a closer location.');
        return;
      }

      setDeliveryDistance(parseFloat(dist.toFixed(1)));
      setDeliveryTime(time);
      setLastCalculatedAddress(address);

    } catch (error) {
      setLocationError('Error calculating distance');
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleAddNewAddress = async () => {
    if (!newAddrLabel.trim()) {
      Alert.alert('Error', 'Please enter a label for the address (e.g., Home, Work).');
      return;
    }
    if (!newAddrDetails.trim() || newAddrDetails.trim().length < 10) {
      Alert.alert('Error', 'Please enter a complete address (at least 10 characters).');
      return;
    }
    setIsSavingNewAddr(true);
    try {
      await saveAddress(newAddrDetails.trim(), newAddrLabel.trim() || 'Home');
      setAddress(newAddrDetails.trim());
      setShowAddAddressInline(false);
      setNewAddrDetails('');
      setNewAddrLabel('Home');
      Alert.alert('Success', 'Address saved to your profile.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save address.');
    } finally {
      setIsSavingNewAddr(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (isGuest) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to place an order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/login') }
        ]
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }

    if (!deliveryDistance || deliveryDistance > 25) {
      Alert.alert('Out of Delivery Range', 'We currently only deliver within 25km of our base location. Please select a closer address.');
      return;
    }

    const slotString = (selectedDeliveryDate && selectedDeliverySlot)
      ? `${selectedDeliveryDate} • ${selectedDeliverySlot}`
      : (deliveryTime ? `Within ${deliveryTime} mins` : 'Standard Delivery');

    if (paymentMethod === 'cod') {
      try {
        const result = await placeOrder(address, slotString, walletDeduction, note, deliveryCharge, taxAmount, handlingFee, 0, 'cod');
        if (!result) throw new Error("Order placement failed");

        const { display_id } = result;
        setPlacedOrderId(display_id);
        setOrderSuccessVisible(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to place order. Please try again.');
        console.error(error);
      }
    } else {
      // Razorpay Online Payment Flow - Direct Client-Side WebView (No Firebase / Expo Go Compatible)
      try {
        const RAZORPAY_KEY_ID = (process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || Constants.expoConfig?.extra?.razorpayKeyId || '').trim();
        const RAZORPAY_KEY_SECRET = (process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || Constants.expoConfig?.extra?.razorpayKeySecret || '').trim();

        console.log("DEBUG: Razorpay Key Info", {
          KEY_ID_FOUND: !!RAZORPAY_KEY_ID,
          KEY_SECRET_FOUND: !!RAZORPAY_KEY_SECRET,
          FROM_ENV: !!process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
          FROM_EXTRA: !!Constants.expoConfig?.extra?.razorpayKeyId
        });
        
        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
          console.error("DEBUG: Razorpay keys are MISSING from both process.env and Constants.expoConfig.extra.");
          Alert.alert('Configuration Error', 'Razorpay keys are missing. Please ensure your .env file is correctly set up and restart your Expo server with "npx expo start --clear".');
          return;
        }

        // Standard Base64 Encoding for Basic Auth
        const credentials = `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`;
        const basicAuth = encode(credentials).replace(/\s+/g, ''); // Ensure no spaces/newlines
        
        console.log("DEBUG: Key Lengths", {
          ID_LEN: RAZORPAY_KEY_ID.length,
          SECRET_LEN: RAZORPAY_KEY_SECRET.length
        });

        // console.log("DEBUG: Auth Header Preview:", basicAuth.substring(0, 10)); // Hidden for security in live mode

        // 1. Create Order on Razorpay directly from client (Insecure but complying with "no firebase")
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${basicAuth}`,
          },
          body: JSON.stringify({
            amount: Math.round(finalTotal * 100), // convert to paise
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Razorpay API Error Response:", errorData);
          throw new Error("Failed to create order on Razorpay");
        }

        const orderData = await response.json();
        const razorpayOrderId = orderData.id;

        // 2. Open WebView Gateway
        setCurrentRazorpayOrderId(razorpayOrderId);
        setShowRazorpayGateway(true);

      } catch (error) {
        Alert.alert('Error', 'Failed to initiate payment. Please try again.');
        console.error("Razorpay Error:", error);
      }
    }
  };

  const handleRazorpaySuccess = async (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
    setShowRazorpayGateway(false);

    // Create actual order in Firebase now that payment succeeded
    const slotString = (selectedDeliveryDate && selectedDeliverySlot)
      ? `${selectedDeliveryDate} • ${selectedDeliverySlot}`
      : (deliveryTime ? `Within ${deliveryTime} mins` : 'Standard Delivery');

    try {
      const paymentDetails = {
        payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        signature: data.razorpay_signature // can be saved if needed
      };

      const result = await placeOrder(address, slotString, walletDeduction, note, deliveryCharge, taxAmount, handlingFee, 0, 'online', paymentDetails);
      if (!result) throw new Error("Order placement failed");

      const { display_id } = result;
      setPlacedOrderId(display_id);
      setOrderSuccessVisible(true);
    } catch (error) {
      Alert.alert('Payment Verified but Order Failed', 'Please contact support with your Payment ID.');
      console.error(error);
    }
  };

  const handleTrackOrder = () => {
    setOrderSuccessVisible(false);
    router.replace('/orders');
  };

  const handleContinueShopping = () => {
    setOrderSuccessVisible(false);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Custom Header matching Profile.tsx */}
      <View style={[styles.headerBg, { paddingTop: insets.top }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={Colors.cream} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Checkout</Text>
          <View style={{ width: 28 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >


        {/* Guest Sign-in Prompt */}
        {isGuest && (
          <View style={styles.guestBanner}>
            <View style={styles.guestIconContainer}>
              <AlertCircle size={24} color={Colors.white} />
            </View>
            <View style={styles.guestContent}>
              <Text style={styles.guestTitle}>Sign in to Order</Text>
              <Text style={styles.guestSubtitle}>
                Please log in to your account to place orders and manage your profile.
              </Text>
              <TouchableOpacity 
                style={styles.guestLoginBtn}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.guestLoginBtnText}>Sign In Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2. Unified Delivery Card */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.card}>
            {/* Address Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <MapPin size={14} color={Colors.deepTeal} style={{ marginRight: 6 }} />
                <Text style={styles.label}>Address</Text>
              </View>

              {/* Saved Addresses Selector */}
              {user.addresses && user.addresses.length > 0 && (
                <View style={styles.savedAddressesWrapper}>
                  <Text style={styles.savedLabel}>Saved Addresses:</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.savedAddressesList}
                  >
                    <TouchableOpacity 
                      style={styles.addNewChip}
                      onPress={() => setShowAddAddressInline(true)}
                    >
                      <Plus size={16} color={Colors.deepTeal} />
                      <Text style={styles.addNewChipText}>Add New</Text>
                    </TouchableOpacity>

                    {(() => {
                      const displayAddresses = [...(user.addresses || [])];
                      // If main address isn't in the list, add it as Primary
                      if (user.address && !displayAddresses.some(a => a.details === user.address)) {
                        displayAddresses.unshift({
                          id: 'primary-temp',
                          label: 'Primary',
                          details: user.address,
                          isPrimary: true
                        });
                      }
                      
                      return displayAddresses.map((savedAddr, idx) => {
                        const isSelected = address === savedAddr.details;
                        const uniqueKey = `addr-${savedAddr.id || idx}-${idx}`;
                        return (
                          <TouchableOpacity 
                            key={uniqueKey} 
                            style={[
                              styles.addressChip,
                              isSelected && styles.addressChipActive
                            ]}
                            onPress={() => setAddress(savedAddr.details)}
                          >
                            <Text 
                              style={[
                                styles.addressChipText,
                                isSelected && styles.addressChipTextActive
                              ]}
                              numberOfLines={1}
                            >
                              {savedAddr.label || 'Address'}
                            </Text>
                            <Text style={styles.addressChipDetails} numberOfLines={1}>
                              {savedAddr.details}
                            </Text>
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </ScrollView>
                </View>
              )}

              {showAddAddressInline && (
                <View style={styles.inlineAddForm}>
                  <View style={styles.inlineFormHeader}>
                    <Text style={styles.inlineFormTitle}>Add New Address</Text>
                    <TouchableOpacity onPress={() => setShowAddAddressInline(false)}>
                      <X size={20} color="#999" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Label (e.g. Home, Office)"
                    value={newAddrLabel}
                    onChangeText={setNewAddrLabel}
                  />
                  <TextInput
                    style={[styles.inlineInput, { minHeight: 60 }]}
                    placeholder="Full Address Details..."
                    value={newAddrDetails}
                    onChangeText={setNewAddrDetails}
                    multiline
                  />
                  <TouchableOpacity 
                    style={[styles.inlineSaveBtn, !newAddrDetails.trim() && { opacity: 0.5 }]}
                    onPress={handleAddNewAddress}
                    disabled={isSavingNewAddr || !newAddrDetails.trim()}
                  >
                    {isSavingNewAddr ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.inlineSaveBtnText}>Save & Select</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="House No, Building, Landmark, City..."
                placeholderTextColor="#999"
                multiline
              />
              <TouchableOpacity
                style={styles.locateButton}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={Colors.deepTeal} />
                ) : (
                  <>
                    <Navigation size={14} color={Colors.deepTeal} />
                    <Text style={styles.locateText}>Use Current Location</Text>
                  </>
                )}
              </TouchableOpacity>
              {locationError && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={18} color={Colors.priceDown} />
                  <Text style={styles.errorBannerText}>{locationError}</Text>
                </View>
              )}
            </View>

            {/* Delivery Estimate Badge */}
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Clock size={20} color={Colors.deepTeal} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  {(selectedDeliveryDate && selectedDeliverySlot) ? 'Scheduled Delivery' : 'Estimated Arrival'}
                </Text>
                <Text style={styles.infoValue}>
                  {(selectedDeliveryDate && selectedDeliverySlot) 
                    ? `${selectedDeliveryDate}\n${selectedDeliverySlot}` 
                    : (deliveryTime ? `${deliveryTime} mins` : 'Calculating...')}
                </Text>
              </View>
              {deliveryDistance && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{deliveryDistance} km</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 3. Order Preferences */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <FileText size={14} color={Colors.deepTeal} style={{ marginRight: 6 }} />
                <Text style={styles.label}>Order Note</Text>
              </View>
              <TextInput
                style={[styles.input, { minHeight: 60, height: 'auto' }]}
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Leave at door, Ring bell..."
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* 4. Wallet (Matching Card Style) */}
        {user.wallet_points > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Offers & Wallet</Text>
            <View style={styles.card}>
              <View style={styles.walletHeader}>
                <View>
                  <Text style={styles.cardLabel}>Meat Points</Text>
                  <Text style={styles.walletPoints}>{user.wallet_points}</Text>
                  <Text style={styles.walletSub}>Available Balance</Text>
                </View>
                <View style={styles.walletIconContainer}>
                  <Image source={require('../assets/images/cp-profile.png')} style={styles.walletIcon} resizeMode="contain" />
                </View>
              </View>

              <View style={styles.walletAction}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletSaveText}>
                    Save <Text style={{ fontWeight: 'bold', color: Colors.orange }}>₹{maxWalletRedemption.toFixed(0)}</Text> on this order
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: Colors.cream.substring(0, 7), true: Colors.deepTeal.substring(0, 7) }}
                  thumbColor={useWalletPoints ? Colors.cream.substring(0, 7) : Colors.deepTeal.substring(0, 7)}
                  ios_backgroundColor={Colors.cream.substring(0, 7)}
                  onValueChange={setUseWalletPoints}
                  value={useWalletPoints}
                />
              </View>
            </View>
          </View>
        )}

        {/* 5. Bill Summary */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.card}>
            {cart.map((item, index) => (
              <View key={`${item.product.id}-${index}`} style={styles.billItemRow}>
                <Text style={styles.billItemQty}>{item.quantity}x</Text>
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={styles.billItemName}>{item.product.name}</Text>
                  <Text style={styles.billItemMeta}>{item.weight} {item.product.unit} {item.cuttingType ? `• ${item.cuttingType}` : ''}</Text>
                </View>
                <Text style={styles.billItemPrice}>
                  ₹{(() => {
                    let price = item.product.current_price;
                    if (item.product.variants && item.cuttingType) {
                      const variant = item.product.variants.find(v => v.name === item.cuttingType);
                      if (variant) price = variant.price;
                    }
                    return (price * item.quantity * item.weight).toFixed(2);
                  })()}
                </Text>
              </View>
            ))}

            <View style={styles.dashedLine} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({(taxRate * 100).toFixed(0)}%)</Text>
              <Text style={styles.summaryValue}>+₹{taxAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Fee (0%)</Text>
              <Text style={styles.summaryValue}>+₹{handlingFee.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charge</Text>
              <Text style={[styles.summaryValue, deliveryCharge === 0 && { color: Colors.priceUp }]}>
                {deliveryCharge === 0 ? 'Free' : `+₹${deliveryCharge.toFixed(2)}`}
              </Text>
            </View>


            {useWalletPoints && walletDeduction > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.orange }]}>Points Redeemed</Text>
                <Text style={[styles.summaryValue, { color: Colors.orange }]}>-₹{walletDeduction.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.totalDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.charcoal, marginBottom: 12 }}>Pay Via</Text>

              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  paymentMethod === 'cod' && styles.paymentMethodCardActive
                ]}
                onPress={() => setPaymentMethod('cod')}
              >
                <View style={[styles.radioCircle, paymentMethod === 'cod' && styles.radioCircleActive]}>
                  {paymentMethod === 'cod' && <View style={styles.radioInner} />}
                </View>
                <CheckCircle2 size={20} color={paymentMethod === 'cod' ? Colors.deepTeal : '#888'} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.pmTitle, paymentMethod === 'cod' && styles.pmTitleActive]}>Cash on Delivery</Text>
                  <Text style={styles.pmSub}>Pay cash at the time of delivery</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Footer */}
      <View style={styles.floatFooter}>
        <TouchableOpacity 
          style={[
            styles.checkoutBtn, 
            ((deliveryDistance !== null && deliveryDistance > 25) || isGuest) ? styles.checkoutBtnDisabled : null
          ]} 
          onPress={handlePlaceOrder}
          disabled={deliveryDistance !== null && deliveryDistance > 25}
        >
          <View style={styles.btnContent}>
            <Text style={styles.btnText}>PLACE ORDER</Text>
            <View style={styles.btnDivider} />
            <Text style={styles.btnPrice}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <OrderSuccessModal
        visible={orderSuccessVisible}
        orderId={placedOrderId}
        onTrackOrder={handleTrackOrder}
        onContinueShopping={handleContinueShopping}
      />

      {showRazorpayGateway && (
        <RazorpayCheckoutGateway
          amount={finalTotal}
          orderId={currentRazorpayOrderId}
          name={user.name || 'Meat UP Customer'}
          email={user.email || 'customer@meatup.com'}
          contact={user.phone || '9999999999'}
          onSuccess={handleRazorpaySuccess}
          onClose={() => setShowRazorpayGateway(false)}
          onError={(errorMsg) => {
            setShowRazorpayGateway(false);
            Alert.alert('Payment Initialization Failed', errorMsg || 'An unknown error occurred with Razorpay.');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  // Replicated Header Styles
  headerBg: {
    backgroundColor: Colors.deepTeal,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: -20, // Negative margin to allow content overlap overlap if needed, but we use scrollContent padding here
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.cream,
    letterSpacing: 0.5,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30, // Spacing from header
  },

  discountBanner: {
    backgroundColor: Colors.deepTealDark,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  discountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  discountContent: {
    flex: 1,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  discountSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  guestBanner: {
    backgroundColor: Colors.orange,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  guestIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  guestContent: {
    flex: 1,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  guestSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 12,
  },
  guestLoginBtn: {
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  guestLoginBtnText: {
    color: Colors.orange,
    fontWeight: '700',
    fontSize: 13,
  },

  // Section Styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Input Styles matching Profile
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    textAlignVertical: 'top',
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.deepTeal.substring(0, 7) + '10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  locateText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.deepTeal,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.priceDown.substring(0, 7) + '10',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.priceDown.substring(0, 7) + '20',
  },
  errorBannerText: {
    flex: 1,
    color: Colors.priceDown,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Delivery Info
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.deepTeal.substring(0, 7) + '10', // Light tint
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  badge: {
    backgroundColor: Colors.orange,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // Wallet
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.deepTeal,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
    marginBottom: 4,
  },
  walletPoints: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.deepTeal,
  },
  walletSub: {
    fontSize: 13,
    color: '#888',
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.orange.substring(0, 7) + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIcon: {
    width: 28,
    height: 28,
  },
  walletAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 16,
    justifyContent: 'space-between',
  },
  walletSaveText: {
    fontSize: 13,
    color: Colors.charcoal,
  },

  // Bill & Footer
  billItemRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  billItemQty: {
    fontWeight: '700',
    color: Colors.deepTeal,
    fontSize: 14,
    width: 24,
  },
  billItemName: {
    fontSize: 14,
    color: Colors.charcoal,
    fontWeight: '600',
  },
  billItemMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  billItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    borderRadius: 1,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.deepTeal,
  },
  codBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4', // Light green
    padding: 8,
    borderRadius: 12,
    marginTop: 16,
    gap: 6,
  },
  codText: {
    fontSize: 12,
    color: Colors.deepTeal,
    fontWeight: '600',
  },

  // Footer
  floatFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  checkoutBtn: {
    backgroundColor: Colors.deepTeal,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  btnDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  btnPrice: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#eee',
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  paymentMethodCardActive: {
    borderColor: Colors.deepTeal,
    backgroundColor: Colors.deepTeal.substring(0, 7) + '08',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: Colors.deepTeal,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.deepTeal,
  },
  pmTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  pmTitleActive: {
    color: Colors.deepTeal,
  },
  pmSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  savedAddressesWrapper: {
    marginBottom: 16,
  },
  savedLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600',
  },
  savedAddressesList: {
    paddingRight: 20,
    gap: 8,
  },
  addressChip: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    maxWidth: 200,
  },
  addressChipActive: {
    backgroundColor: Colors.deepTeal.substring(0, 7) + '15',
    borderColor: Colors.deepTeal,
  },
  addressChipText: {
    fontSize: 13,
    color: '#666',
  },
  addressChipTextActive: {
    color: Colors.deepTeal,
    fontWeight: '700',
  },
  addressChipDetails: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  addNewChip: {
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.deepTeal,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
    height: 45,
    alignSelf: 'center',
  },
  addNewChipText: {
    fontSize: 13,
    color: Colors.deepTeal,
    fontWeight: '700',
  },
  inlineAddForm: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  inlineFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inlineFormTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  inlineInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 10,
  },
  inlineSaveBtn: {
    backgroundColor: Colors.deepTeal,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  inlineSaveBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
