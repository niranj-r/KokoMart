export interface Product {
    id: string;
    name: string;
    category: string;
    current_price: number;
    previous_price: number;
    price_direction: 'up' | 'down' | 'neutral';
    price_change_percentage: number;
    image: string;
    availability: boolean;
    description?: string;
    cutting_types?: string[];
    unit: string;
    increment: number;
    price_quantity?: number; // For "30 for 15 pieces" logic. Defaults to 1 if undefined.
    variants?: ProductVariant[];
}

export interface ProductVariant {
    name: string;
    price: number;
}

export interface UserProfile {
    id: string; // Firebase Auth UID
    name: string;
    phone: string;
    email: string;
    is_first_order_completed: boolean;
    wallet_points: number;
    created_at: number; // Timestamp
    address?: string;
}

export type User = UserProfile;

export interface CartItem {
    product: Product;
    quantity: number;
    weight: number;
    cuttingType?: string;
}

export interface WalletTransaction {
    id: string;
    type: 'earned' | 'redeemed';
    amount: number;
    orderId: string;
    date: string;
    description: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'received' | 'cutting' | 'packing' | 'out_for_delivery';

export interface OrderItem {
    product_id: string;
    name: string;
    quantity: number;
    weight: number;
    price: number;
    cuttingType?: string;
}

export interface Order {
    id: string;
    user_id: string;
    items: OrderItem[];
    total_amount: number;
    discount: number;
    wallet_used: number;
    final_amount: number;
    earned_points: number;
    status: OrderStatus;
    created_at: number;
    address: string;
    delivery_slot?: string;
    note?: string;
}
