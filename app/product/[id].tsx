import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, Plus, ChevronLeft, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import CuttingModal from '@/components/CuttingModal';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, addToCart } = useApp();
  const [selectedWeight, setSelectedWeight] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const priceColor =
    product.price_direction === 'up'
      ? Colors.priceUp
      : product.price_direction === 'down'
        ? Colors.priceDown
        : Colors.priceNeutral;

  const Icon = product.price_direction === 'up' ? TrendingUp : TrendingDown;
  const totalPrice = product.current_price * selectedWeight * quantity;
  const earnPoints = Math.floor(selectedWeight * quantity);

  const handleAddToCartRequest = () => {
    setModalVisible(true);
  };

  const handleCuttingTypeSelect = (cuttingType: string) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id, 1, selectedWeight, cuttingType);
    }
    setModalVisible(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false, // Hide default header for custom look
        }}
      />

      {/* Custom Header for Back Button */}
      <SafeAreaView style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={28} color={Colors.white} />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Helper view to maintain aspect ratio or height */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceWrapper}>
                <Text style={styles.currency}>₹</Text>
                <Text style={styles.currentPrice}>{product.current_price}</Text>
                <Text style={styles.unit}>/kg</Text>
              </View>

              {product.price_direction !== 'neutral' && (
                <View style={[styles.priceChange, { backgroundColor: priceColor }]}>
                  <Icon size={14} color={Colors.white} />
                  <Text style={styles.priceChangeText}>
                    {product.price_direction === 'up' ? '+' : ''}
                    {product.price_change_percentage}%
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Weight</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weightOptions}>
              {[1, 1.5, 2, 2.5, 3].map((weight) => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.weightOption,
                    selectedWeight === weight && styles.weightOptionActive,
                  ]}
                  onPress={() => setSelectedWeight(weight)}
                >
                  <Text
                    style={[
                      styles.weightOptionText,
                      selectedWeight === weight && styles.weightOptionTextActive,
                    ]}
                  >
                    {weight} kg
                  </Text>
                  {selectedWeight === weight && <View style={styles.activeDot} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.quantityRow}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity === 1}
                >
                  <Minus size={20} color={quantity === 1 ? Colors.priceNeutral : Colors.charcoal} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Plus size={20} color={Colors.charcoal} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.rewardCard}>
            <View style={styles.rewardIconContainer}>
              <Image source={require('../../assets/images/cp.png')} style={styles.rewardIcon} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.rewardTitle}>Premium Rewards</Text>
              <Text style={styles.rewardText}>
                Earn <Text style={{ fontWeight: 'bold', color: Colors.white }}>{earnPoints} Chicken Points</Text>
              </Text>
            </View>
          </View>

          {/* Spacer for bottom bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>Total Amount</Text>
            <Text style={styles.footerPrice}>₹{totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCartRequest}>
            <Text style={styles.addToCartText}>Add to Cart</Text>
            <ArrowRight size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <CuttingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleCuttingTypeSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepTeal,
  },
  customHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.deepTeal,
  },
  imageContainer: {
    height: 400,
    width: '100%',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.deepTeal,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  contentContainer: {
    marginTop: -40,
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 500,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.charcoal,
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.5,
  },
  categoryBadge: {
    backgroundColor: Colors.tealBlue.substring(0, 7) + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.tealBlue.substring(0, 7) + '30',
  },
  categoryText: {
    fontSize: 12,
    color: Colors.tealBlue,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.orange,
    marginRight: 2,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.orange,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 16,
    color: Colors.charcoal.substring(0, 7) + '90',
    fontWeight: '500' as const,
    marginLeft: 2,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priceChangeText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.charcoal.substring(0, 7) + 'CC',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.cream,
    textAlign: 'center',
    marginTop: 40,
  },
  weightOptions: {
    paddingRight: 20,
    gap: 12,
  },
  weightOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  weightOptionActive: {
    backgroundColor: Colors.tealBlue,
    borderColor: Colors.tealBlue,
    shadowColor: Colors.tealBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  weightOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.charcoal,
  },
  weightOptionTextActive: {
    color: Colors.white,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
    position: 'absolute',
    bottom: 6,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.white,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1, // subtle border
    borderColor: '#EFEFEF',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    minWidth: 30,
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: Colors.deepTealDark, // Premium dark background
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rewardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rewardIcon: {
    width: 32,
    height: 32,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.cream, // Light text for dark bg
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  rewardText: {
    fontSize: 13,
    color: Colors.creamLight,
    opacity: 0.9,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  footerLabel: {
    fontSize: 13,
    color: Colors.charcoal.substring(0, 7) + '80',
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.charcoal,
    letterSpacing: -0.5,
  },
  addToCartButton: {
    backgroundColor: Colors.orange,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
});
