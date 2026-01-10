import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, addToCart } = useApp();
  const [selectedWeight, setSelectedWeight] = useState(1);
  const [quantity, setQuantity] = useState(1);

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

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id, selectedWeight);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: product.name,
          headerStyle: { backgroundColor: Colors.deepTeal },
          headerTintColor: Colors.cream,
          headerTitleStyle: { fontWeight: 'bold' as const },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: product.image }} style={styles.productImage} />

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.category}>{product.category}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>₹{product.current_price}/kg</Text>
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

          <View style={styles.deliveryBadge}>
            <Text style={styles.deliveryText}>🚚 Delivery in {product.deliveryETA}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Weight</Text>
            <View style={styles.weightOptions}>
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
                    {weight}kg
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
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

          <View style={styles.rewardCard}>
            <Text style={styles.rewardTitle}>🎁 Earn Chicken Points</Text>
            <Text style={styles.rewardText}>
              You will earn {earnPoints} points with this purchase
            </Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.footer}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerPrice}>₹{totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Text style={styles.addToCartText}>Add to Cart</Text>
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
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    color: Colors.charcoal,
    textAlign: 'center',
    marginTop: 40,
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.creamLight,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productName: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: Colors.tealBlue,
    fontWeight: '600' as const,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.orange,
    marginBottom: 4,
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
  deliveryBadge: {
    backgroundColor: Colors.priceUp + '20',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  deliveryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.priceUp,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.charcoal,
    lineHeight: 24,
  },
  weightOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weightOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.creamLight,
  },
  weightOptionActive: {
    backgroundColor: Colors.tealBlue,
    borderColor: Colors.tealBlue,
  },
  weightOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.charcoal,
  },
  weightOptionTextActive: {
    color: Colors.white,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.creamLight,
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    minWidth: 40,
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: Colors.orange + '20',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.orange,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.orange,
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 14,
    color: Colors.charcoal,
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
    color: Colors.priceNeutral,
    marginBottom: 4,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
  },
  addToCartButton: {
    backgroundColor: Colors.orange,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
});
