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
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, Plus, ChevronLeft, ArrowRight, Star, MessageSquarePlus } from 'lucide-react-native';
import { ReviewService } from '@/services/ReviewService';
import { Review } from '@/types';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import CuttingModal from '@/components/CuttingModal';
import StatusBanner from '@/components/StatusBanner';
import { getNextAvailableDay, isProductAvailableToday } from '@/utils/getNextAvailableDay';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, addToCart, user, isGuest, cartTotalWeight } = useApp();
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Status Banner
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerType, setBannerType] = useState<'success' | 'error'>('error');
  const [bannerMessage, setBannerMessage] = useState('');

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBannerType(type);
    setBannerMessage(message);
    setBannerVisible(true);
  };

  const product = products.find((p) => p.id === id);

  React.useEffect(() => {
    if (id) {
      const unsubscribe = ReviewService.subscribeToProductReviews(id as string, (fetchedReviews) => {
        setReviews(fetchedReviews);
      });
      return () => unsubscribe();
    }
  }, [id]);

  const handleSubmitReview = async () => {
    if (isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to leave a review.');
      return;
    }
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await ReviewService.addReview({
        product_id: product?.id as string,
        user_id: user.id,
        user_name: user.name,
        rating: newRating,
        comment: newComment.trim(),
      });
      setReviewModalVisible(false);
      setNewRating(5);
      setNewComment('');
      Alert.alert('Success', 'Thank you for your review!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
  const isPcUnit = product.unit.toLowerCase() === 'pc' || product.unit === 'pack';
  const weightOptions = isPcUnit ? [6, 12, 30] : [0.5, 1, 2, 3, 4];
  const defaultWeight = weightOptions[0];
  const effectiveWeight = selectedWeight ?? defaultWeight;
  const availableToday = isProductAvailableToday(product);

  const totalPrice = product.current_price * effectiveWeight * quantity;
  const earnPoints = Math.floor(effectiveWeight * quantity);

  const handleAddToCartRequest = () => {
    setModalVisible(true);
  };

  const handleCuttingTypeSelect = (cuttingType: string) => {
    for (let i = 0; i < quantity; i++) {
      const res = addToCart(product.id, 1, effectiveWeight, cuttingType);
      if (res && !res.success) {
        showBanner('error', res.message || 'Limit exceeded');
        setModalVisible(false);
        return; // Don't navigate back if there's an error
      }
    }
    setModalVisible(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBanner 
        visible={bannerVisible} 
        message={bannerMessage} 
        type={bannerType} 
        onHide={() => setBannerVisible(false)} 
      />
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
          <Image source={{ uri: product.image }} style={[styles.productImage, !availableToday && { opacity: 0.45 }]} resizeMode="cover" />
          <View style={styles.imageOverlay} />
          {!availableToday && (
            <View style={styles.outOfStockOverlay}>
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockBadgeText}>Out of Stock</Text>
              </View>
            </View>
          )}
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
                <Text style={styles.unit}>/{product.unit}</Text>
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
            <Text style={styles.sectionTitle}>Select {isPcUnit ? 'Quantity' : 'Weight'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weightOptions}>
              {weightOptions.map((weight) => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.weightOption,
                    effectiveWeight === weight && styles.weightOptionActive,
                    !availableToday && styles.weightOptionDisabled,
                  ]}
                  onPress={() => setSelectedWeight(weight)}
                  disabled={!availableToday}
                >
                  <Text
                    style={[
                      styles.weightOptionText,
                      effectiveWeight === weight && styles.weightOptionTextActive,
                    ]}
                  >
                    {weight} {isPcUnit ? (product.unit.toLowerCase() === 'pc' ? 'pc' : product.unit) : 'kg'}
                  </Text>
                  {effectiveWeight === weight && <View style={styles.activeDot} />}
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
                  <Minus size={18} color={quantity === 1 ? '#AAA' : Colors.white} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const unit = product.unit.toUpperCase();
                    let itemWeightInKg = 0;
                    if (unit === 'KG') itemWeightInKg = effectiveWeight;
                    else if (unit === 'G') itemWeightInKg = effectiveWeight / 1000;
                    
                    if (cartTotalWeight + ((quantity + 1) * itemWeightInKg) > 25) {
                      showBanner('error', 'You can only order up to 25kg in a single order.');
                      return;
                    }
                    setQuantity(quantity + 1);
                  }}
                >
                  <Plus size={18} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {(() => {
            const unit = product.unit.toUpperCase();
            const isMeat = unit === 'KG' || unit === 'G';
            if (!isMeat) return null;
            return (
              <View style={styles.rewardCard}>
                <View style={styles.rewardIconContainer}>
                  <Image source={require('../../assets/images/cp.png')} style={styles.rewardIcon} resizeMode="contain" />
                </View>
                <View>
                  <Text style={styles.rewardTitle}>Premium Rewards</Text>
                  <Text style={styles.rewardText}>
                    Earn <Text style={{ fontWeight: 'bold', color: Colors.white }}>{earnPoints} Meat Points</Text>
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* Reviews Section */}
          <View style={styles.divider} />
          <View style={styles.section}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              {!isGuest && (
                <TouchableOpacity 
                  style={styles.addReviewLink}
                  onPress={() => setReviewModalVisible(true)}
                >
                  <MessageSquarePlus size={18} color={Colors.deepTeal} />
                  <Text style={styles.addReviewLinkText}>Add Review</Text>
                </TouchableOpacity>
              )}
            </View>

            {reviews.length === 0 ? (
              <View style={styles.noReviews}>
                <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewUserRow}>
                    <Text style={styles.reviewUser}>{review.user_name}</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={12} 
                          color={s <= review.rating ? "#FFD700" : "#E0E0E0"} 
                          fill={s <= review.rating ? "#FFD700" : "transparent"} 
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>

          {/* Spacer for bottom bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate this Product</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Plus size={24} color={Colors.charcoal} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            </View>

            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setNewRating(s)}>
                  <Star 
                    size={32} 
                    color={s <= newRating ? "#FFD700" : "#E0E0E0"} 
                    fill={s <= newRating ? "#FFD700" : "transparent"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Tell us what you think..."
              placeholderTextColor="#999"
              multiline
              value={newComment}
              onChangeText={setNewComment}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmittingReview && { opacity: 0.7 }]}
              onPress={handleSubmitReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          {availableToday ? (
            <>
              <View>
                <Text style={styles.footerLabel}>Total Amount</Text>
                <Text style={styles.footerPrice}>₹{totalPrice.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCartRequest}>
                <Text style={styles.addToCartText}>Add to Cart</Text>
                <ArrowRight size={20} color={Colors.white} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.nextAvailableFooter}>
              <View style={styles.nextAvailableRow}>
                <View style={styles.nextAvailableDot} />
                <Text style={styles.nextAvailableLabel}>Next Available</Text>
              </View>
              <Text style={styles.nextAvailableValue}>
                {product.available_days && product.available_days.length > 0
                  ? getNextAvailableDay(product.available_days)
                  : product.next_available || 'Check back soon'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <CuttingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleCuttingTypeSelect}
        options={product.cutting_types}
        variants={product.variants}
        title={product.variants ? 'Select Type' : 'Select Cutting Type'}
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
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  outOfStockBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  weightOptionDisabled: {
    opacity: 0.4,
  },
  nextAvailableFooter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextAvailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextAvailableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.orange,
  },
  nextAvailableLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.orange,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nextAvailableValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.charcoal,
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
    backgroundColor: Colors.tealBlue,
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
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.tealBlue.substring(0, 7) + '20', // Light teal border
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: 160,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: Colors.tealBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.tealBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityButtonDisabled: {
    backgroundColor: '#F0F0F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.tealBlue,
    minWidth: 32,
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
    width: 25,
    height: 25,
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

  // Reviews Styles
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.deepTeal.substring(0, 7) + '20',
  },
  addReviewLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.deepTeal,
  },
  noReviews: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.charcoal,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reviewModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  starPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  reviewInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    color: Colors.charcoal,
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: Colors.deepTeal,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
