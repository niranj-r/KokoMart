import { db } from '@/config/firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy, doc, getDoc, runTransaction, onSnapshot } from 'firebase/firestore';
import { Review, Product } from '@/types';

export const ReviewService = {
    addReview: async (reviewData: Omit<Review, 'id' | 'created_at'>) => {
        try {
            const productRef = doc(db, 'products', reviewData.product_id);
            
            await runTransaction(db, async (transaction) => {
                const productSnap = await transaction.get(productRef);
                if (!productSnap.exists()) {
                    throw new Error("Product does not exist!");
                }

                const product = productSnap.data() as Product;
                const newReviewCount = (product.review_count || 0) + 1;
                const newAvgRating = ((product.avg_rating || 0) * (product.review_count || 0) + reviewData.rating) / newReviewCount;

                // 1. Add the review
                const reviewCol = collection(db, 'reviews');
                const newReviewRef = doc(reviewCol);
                transaction.set(newReviewRef, {
                    ...reviewData,
                    created_at: Date.now()
                });

                // 2. Update product aggregate stats
                transaction.update(productRef, {
                    avg_rating: newAvgRating,
                    review_count: newReviewCount
                });
            });

            return true;
        } catch (error) {
            console.error("Error adding review:", error);
            throw error;
        }
    },

    getProductReviews: async (productId: string): Promise<Review[]> => {
        try {
            const q = query(
                collection(db, 'reviews'), 
                where("product_id", "==", productId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Review))
                .sort((a, b) => b.created_at - a.created_at);
        } catch (error) {
            console.error("Error fetching product reviews:", error);
            return [];
        }
    },

    subscribeToProductReviews: (productId: string, callback: (reviews: Review[]) => void) => {
        const q = query(
            collection(db, 'reviews'), 
            where("product_id", "==", productId)
        );
        return onSnapshot(q, (snapshot) => {
            const reviews = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Review))
                .sort((a, b) => b.created_at - a.created_at);
            callback(reviews);
        }, (error) => {
            console.error("Error subscribing to reviews:", error);
        });
    }
};
