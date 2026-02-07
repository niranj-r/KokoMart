import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Product } from '@/types';
import CuttingModal from '@/components/CuttingModal';

export default function HomeScreen() {
  const router = useRouter();
  const { products, addToCart, cartItemCount } = useApp();
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

  const handleCuttingTypeSelect = (cuttingType: string) => {
    if (selectedProduct) {
      addToCart(selectedProduct.id, selectedProduct.weight, cuttingType);
      setModalVisible(false);
      setSelectedProduct(null);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.logo}>KoKoMart</Text>
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
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
}: {
  product: Product;
  onPress: () => void;
  onAddToCart: (weight: number) => void;
}) {
  const [selectedWeight, setSelectedWeight] = useState(1);

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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddToCart(selectedWeight)}
        >
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.creamLight,
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
});
