import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,

  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, TrendingUp, TrendingDown, ShoppingCart, ArrowRight, ShoppingBag } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Product } from '@/types';
import CuttingModal from '@/components/CuttingModal';

export default function HomeScreen() {
  const router = useRouter();
  const { products, addToCart, cartItemCount, cart, removeFromCart, cartTotal } = useApp();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const tickerPosition = useRef(new Animated.Value(0)).current;

  const topProducts = products.slice(0, 3);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(tickerPosition, {
          toValue: -100,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(tickerPosition, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [tickerPosition]);

  const filteredProducts = searchQuery
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; weight: number } | null>(null);

  const handleAddToCartRequest = (productId: string, weight: number) => {
    setSelectedProduct({ id: productId, weight });
    setModalVisible(true);
  };

  const handleRemoveFromCart = (productId: string, weight: number) => {
    // Find a cart item with this product and weight to remove
    const itemToRemove = cart.find(
      (item) => item.product.id === productId && item.weight === weight
    );
    if (itemToRemove) {
      removeFromCart(productId, weight, itemToRemove.cuttingType);
    }
  };

  const handleCuttingTypeSelect = (cuttingType: string) => {
    if (selectedProduct) {
      addToCart(selectedProduct.id, selectedProduct.weight, cuttingType);
      setModalVisible(false);
      setSelectedProduct(null);
    }
  };

  const getProductQuantityInCart = (productId: string, weight: number) => {
    return cart
      .filter((item) => item.product.id === productId && item.weight === weight)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.logo}>Meat UP</Text>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
          >
            <ShoppingCart size={24} color={Colors.white} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.priceNeutral} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for chicken..."
            placeholderTextColor={Colors.priceNeutral}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>


      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tickerContainer}>
          <Text style={styles.tickerTitle}>Live Prices</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {topProducts.map((product) => (
              <TickerItem key={product.id} product={product} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Fresh Products</Text>
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
                onAddToCart={(weight) => handleAddToCartRequest(product.id, weight)}
                onRemoveFromCart={(weight) => handleRemoveFromCart(product.id, weight)}
                quantityInCart={(weight) => getProductQuantityInCart(product.id, weight)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <CuttingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleCuttingTypeSelect}
      />

      {cartItemCount > 0 && (
        <View style={styles.viewCartBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 }}>
              <ShoppingBag size={24} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.viewCartText}>{cartItemCount} Items</Text>
              <Text style={[styles.viewCartText, { fontSize: 13, opacity: 0.9 }]}>₹{cartTotal.toFixed(2)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/cart')} style={styles.viewCartButton}>
            <Text style={styles.viewCartButtonText}>View Cart</Text>
            <ArrowRight size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TickerItem({ product }: { product: Product }) {
  const priceColor =
    product.price_direction === 'up'
      ? Colors.priceUp
      : product.price_direction === 'down'
        ? Colors.priceDown
        : Colors.priceNeutral;

  const Icon = product.price_direction === 'up' ? TrendingUp : TrendingDown;

  return (
    <View style={styles.tickerItem}>
      <Text style={styles.tickerName}>{product.name}</Text>
      <View style={styles.tickerPriceRow}>
        <Text style={styles.tickerPrice}>₹{product.current_price}/kg</Text>
        {product.price_direction !== 'neutral' && (
          <View style={[styles.tickerChange, { backgroundColor: priceColor }]}>
            <Icon size={12} color={Colors.white} />
            <Text style={styles.tickerChangeText}>
              {Math.abs(product.price_change_percentage)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ProductCard({
  product,
  onPress,
  onAddToCart,
  onRemoveFromCart,
  quantityInCart,
}: {
  product: Product;
  onPress: () => void;
  onAddToCart: (weight: number) => void;
  onRemoveFromCart: (weight: number) => void;
  quantityInCart: (weight: number) => number;
}) {
  const [selectedWeight, setSelectedWeight] = useState(1);
  const quantity = quantityInCart(selectedWeight);

  const priceColor =
    product.price_direction === 'up'
      ? Colors.priceUp
      : product.price_direction === 'down'
        ? Colors.priceDown
        : Colors.priceNeutral;

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{product.current_price}/kg</Text>
          {product.price_direction !== 'neutral' && (
            <View style={[styles.priceIndicator, { backgroundColor: priceColor }]}>
              <Text style={styles.priceIndicatorText}>
                {product.price_direction === 'up' ? '↑' : '↓'}
                {Math.abs(product.price_change_percentage)}%
              </Text>
            </View>
          )}
        </View>
        <View style={styles.weightSelector}>
          {[1, 1.5, 2].map((weight) => (
            <TouchableOpacity
              key={weight}
              style={[
                styles.weightButton,
                selectedWeight === weight && styles.weightButtonActive,
              ]}
              onPress={() => setSelectedWeight(weight)}
            >
              <Text
                style={[
                  styles.weightButtonText,
                  selectedWeight === weight && styles.weightButtonTextActive,
                ]}
              >
                {weight}kg
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {quantity === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAddToCart(selectedWeight)}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onRemoveFromCart(selectedWeight)}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onAddToCart(selectedWeight)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepTeal,
  },
  safeArea: {
    backgroundColor: Colors.deepTeal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.cream,
    letterSpacing: 0.5,
  },
  cartButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.orange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.deepTealDark,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.cream,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollViewContent: {
    paddingBottom: 100, // Space for the bottom banner
  },
  promoBanner: {
    backgroundColor: Colors.orange,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.white,
    marginBottom: 12,
  },
  promoBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  promoBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.orange,
  },
  tickerContainer: {
    paddingVertical: 20,
    backgroundColor: Colors.deepTealDark,
    marginBottom: 20,
  },
  tickerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.cream,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tickerItem: {
    backgroundColor: Colors.deepTeal,
    padding: 16,
    marginLeft: 20,
    borderRadius: 16,
    minWidth: 160,
  },
  tickerName: {
    fontSize: 14,
    color: Colors.creamLight,
    marginBottom: 8,
  },
  tickerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tickerPrice: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.cream,
  },
  tickerChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  tickerChangeText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  productsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  productsGrid: {
    gap: 16,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.creamLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
  },
  priceIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceIndicatorText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  weightSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  weightButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.creamLight,
    alignItems: 'center',
  },
  weightButtonActive: {
    backgroundColor: Colors.tealBlue,
  },
  weightButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.charcoal,
  },
  weightButtonTextActive: {
    color: Colors.white,
  },
  addButton: {
    backgroundColor: Colors.orange,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.deepTeal,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.deepTeal,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
    marginHorizontal: 12,
  },
  viewCartBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.orange,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  viewCartText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewCartButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
});