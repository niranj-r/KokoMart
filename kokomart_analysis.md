# KokoMart Application - Comprehensive Analysis

## 📋 Executive Summary

**KokoMart** is a mobile-first chicken delivery application built with React Native and Expo. The app provides a premium e-commerce experience for ordering fresh chicken products with real-time price tracking, loyalty rewards, and comprehensive order management.

---

## 🏗️ Technical Architecture

### Platform & Framework
- **Framework**: React Native with Expo (~54.0.27)
- **Router**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Platforms**: iOS, Android, and Web
- **Package Manager**: npm/bun

### Core Dependencies
```json
{
  "expo": "~54.0.27",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "firebase": "^12.7.0",
  "@tanstack/react-query": "^5.83.0",
  "zustand": "^5.0.2",
  "expo-router": "file-based routing"
}
```

### Backend & Database
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (Email/Password)
- **Real-time Updates**: Firestore subscriptions
- **Storage**: AsyncStorage for local persistence

### State Management
- **Global State**: Custom Context API (`AppContext`, `AuthContext`)
- **Server State**: React Query (configured but not heavily used)
- **Local State**: React hooks (useState, useEffect)

---

## 🎨 Design System

### Color Palette

The application uses a sophisticated teal and orange color scheme:

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Deep Teal** | `#0E4F63` | Primary brand color, headers, navigation |
| **Deep Teal Dark** | `#0B3F52` | Darker variant for depth |
| **Cream** | `#F6E9C8` | Background, text on dark surfaces |
| **Cream Light** | `#FFF1D6` | Light backgrounds, subtle accents |
| **Orange** | `#ff7b00ff` | CTAs, highlights, primary actions |
| **Charcoal** | `#0F1720` | Primary text color |
| **Teal Blue** | `#08424dff` | Active states, selections |
| **Price Up** | `#1DB954` | Price increase indicator (green) |
| **Price Down** | `#E63946` | Price decrease indicator (red) |
| **Price Neutral** | `#acbbc2ff` | Neutral price state (gray) |
| **White** | `#FFFFFF` | Card backgrounds, contrast |

### Typography
- **Primary Font**: System default (San Francisco on iOS, Roboto on Android)
- **Font Sizes**:
  - Logo/Brand: 28-36px, bold
  - Headers: 22-28px, bold
  - Section Titles: 18-20px, bold
  - Body Text: 14-16px, regular/semi-bold
  - Small Text: 12-14px, regular

### Design Principles
1. **Premium Feel**: Rounded corners (12-20px), subtle shadows, smooth transitions
2. **Color Psychology**: Teal conveys trust and freshness, orange creates urgency
3. **Visual Hierarchy**: Bold headers, clear CTAs, organized information
4. **Consistency**: Unified spacing (16-20px), consistent border radius

---

## 🗂️ Project Structure

```
KOOOKOO/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Home screen (product catalog)
│   │   ├── cart.tsx             # Shopping cart
│   │   ├── orders.tsx           # Order history & tracking
│   │   ├── profile.tsx          # User profile & wallet
│   │   └── _layout.tsx          # Tab bar configuration
│   ├── product/                  # Product detail pages
│   ├── checkout.tsx             # Checkout flow
│   ├── login.tsx                # Authentication
│   ├── signup.tsx               # Registration
│   └── _layout.tsx              # Root layout
├── contexts/
│   ├── AppContext.tsx           # Global app state
│   └── AuthContext.tsx          # Authentication state
├── services/
│   ├── ProductService.ts        # Product CRUD operations
│   ├── OrderService.ts          # Order management
│   └── UserService.ts           # User profile management
├── constants/
│   └── colors.ts                # Color palette
├── mocks/
│   └── products.ts              # Mock product data
├── types.ts                      # TypeScript interfaces
└── config/                       # Firebase configuration
```

---

## ✨ Core Features

### 1. **Authentication System**

#### Screens
- [login.tsx](file:///N:/KOOOKOO/app/login.tsx)
- [signup.tsx](file:///N:/KOOOKOO/app/signup.tsx)

#### Features
- Email/password authentication via Firebase Auth
- Guest mode support
- Persistent login sessions
- Profile creation on signup
- Automatic user profile initialization in Firestore

#### User Flow
1. User opens app → Guest mode by default
2. Click "Sign In / Sign Up" → Navigate to login
3. New users → Sign up with email, password, name, phone
4. Existing users → Sign in with credentials
5. Successful auth → Redirect to home screen
6. Profile data synced from Firestore

---

### 2. **Product Catalog & Browsing**

#### Screen
- [index.tsx](file:///N:/KOOOKOO/app/(tabs)/index.tsx) (Home)

#### Features
- **Live Price Ticker**: Horizontal scrolling ticker showing top 3 products with real-time prices
- **Price Direction Indicators**: Visual arrows (↑/↓) with percentage changes
- **Search Functionality**: Filter products by name
- **Product Cards**: Image, name, price, weight selector (1kg, 1.5kg, 2kg)
- **Quick Add to Cart**: Direct add from product card
- **Real-time Price Updates**: Firestore subscriptions update prices automatically

#### Product Data Model
```typescript
interface Product {
  id: string;
  name: string;
  category: string;
  current_price: number;
  previous_price: number;
  price_direction: 'up' | 'down' | 'neutral';
  price_change_percentage: number;
  image: string;
  availability: boolean;
}
```

#### Visual Elements
- **Live Prices Section**: Dark teal background with horizontal scroll
- **Product Grid**: White cards with rounded corners, shadows
- **Price Indicators**: Color-coded badges (green for up, red for down)

---

### 3. **Shopping Cart**

#### Screen
- [cart.tsx](file:///N:/KOOOKOO/app/(tabs)/cart.tsx)

#### Features
- **Cart Item Management**: Add, remove, adjust quantities
- **Weight-based Pricing**: Each weight variant is a separate cart item
- **Real-time Price Sync**: Cart prices update when product prices change
- **First Order Discount**: Automatic 10% discount for new users
- **Bill Summary**: Subtotal, discounts, total calculation
- **Chicken Points Preview**: Shows points to be earned
- **Empty State**: Friendly message with "Browse Products" CTA

#### Cart Logic
- Items identified by `product_id` + `weight` combination
- Quantity increment/decrement with trash icon for last item
- Total calculation: `price × weight × quantity` per item
- Discount applied before wallet points

---

### 4. **Checkout Flow**

#### Screen
- [checkout.tsx](file:///N:/KOOOKOO/app/checkout.tsx)

#### Features
- **Delivery Address**: Editable text input (pre-filled from profile)
- **Delivery Slot Selection**: 3 time slot options
- **Wallet Points Redemption**: Optional checkbox to use points
- **Payment Summary**: Detailed breakdown with all deductions
- **Cash on Delivery**: Only payment method (no online payment)
- **Order Placement**: Creates order in Firestore, clears cart

#### Checkout Flow
1. User clicks "Proceed to Checkout" from cart
2. Enter/confirm delivery address
3. Select delivery time slot
4. Optionally redeem wallet points (max = cart total - discount)
5. Review payment summary
6. Click "Place Order"
7. Order created → Navigate to orders screen

---

### 5. **Order Management & Tracking**

#### Screen
- [orders.tsx](file:///N:/KOOOKOO/app/(tabs)/orders.tsx)

#### Features
- **Order History**: All user orders sorted by date
- **Real-time Status Updates**: Firestore subscriptions for live updates
- **Order Timeline**: Visual progress tracker with 7 stages
- **Order Cancellation**: Cancel pending orders with wallet refund
- **Status Badges**: Color-coded status indicators
- **Auto-progression**: Orders advance through stages every 5 minutes (simulation)

#### Order Statuses
```typescript
type OrderStatus = 
  | 'pending'           // Orange - Order placed
  | 'confirmed'         // Teal - Admin confirmed
  | 'received'          // Teal - Received at facility
  | 'cutting'           // Orange - Being processed
  | 'packing'           // Orange - Being packed
  | 'out_for_delivery'  // Green - On the way
  | 'delivered'         // Green - Completed
  | 'cancelled';        // Red - Cancelled
```

#### Order Timeline Component
- Vertical timeline with icons for each stage
- Active stages highlighted in teal/orange
- Current stage emphasized
- Completed stages shown in teal
- Future stages grayed out

---

### 6. **User Profile & Wallet**

#### Screen
- [profile.tsx](file:///N:/KOOOKOO/app/(tabs)/profile.tsx)

#### Features
- **Profile Display**: Name, email, phone, address
- **Editable Profile**: In-place editing with save/cancel
- **Chicken Points Wallet**: Loyalty rewards system
- **Wallet Balance**: Large display of available points
- **Points Info**: Earning and redemption rules
- **Transaction History**: Earned/redeemed points log
- **Guest Mode Detection**: Shows "Sign In / Sign Up" CTA
- **Logout**: Sign out and return to guest mode

#### Wallet System
- **Earning**: 1 point per kg purchased (credited after delivery)
- **Redemption**: 1 point = ₹1 discount at checkout
- **Max Redemption**: Cannot exceed cart total minus discounts
- **Refund on Cancellation**: Points refunded if order cancelled

---

### 7. **Navigation Structure**

#### Tab Bar (Bottom Navigation)
1. **Home** (🏠): Product catalog and search
2. **Cart** (🛒): Shopping cart with badge count
3. **Orders** (📦): Order history and tracking
4. **Profile** (👤): User profile and wallet

#### Modal Screens
- **Checkout**: Full-screen modal from cart
- **Product Details**: (Placeholder for future implementation)
- **Login/Signup**: Full-screen auth flows

#### Header Design
- **Deep Teal Background**: Consistent across all tabs
- **Cream Text**: High contrast for readability
- **Logo**: "KokoMart" branding on home screen
- **Cart Badge**: Orange badge with item count

---

## 🔥 Firebase Integration

### Firestore Collections

#### `products`
```typescript
{
  id: string,
  name: string,
  category: string,
  current_price: number,
  previous_price: number,
  price_direction: 'up' | 'down' | 'neutral',
  price_change_percentage: number,
  image: string,
  availability: boolean
}
```

#### `users`
```typescript
{
  id: string,              // Firebase Auth UID
  name: string,
  email: string,
  phone: string,
  address?: string,
  is_first_order_completed: boolean,
  wallet_points: number,
  created_at: number       // Timestamp
}
```

#### `orders`
```typescript
{
  id: string,
  user_id: string,
  items: OrderItem[],
  total_amount: number,
  discount: number,
  wallet_used: number,
  final_amount: number,
  earned_points: number,
  status: OrderStatus,
  created_at: number,
  address?: string,
  delivery_slot?: string
}
```

### Real-time Subscriptions
- **Products**: Live price updates via `onSnapshot`
- **Orders**: Real-time order status changes
- **User Profile**: Wallet balance updates

---

## 🎯 Key User Flows

### New User Journey
1. Open app → Guest mode
2. Browse products → Add to cart
3. Proceed to checkout → Prompted to sign up
4. Create account → Profile created in Firestore
5. Complete checkout → First order 10% discount applied
6. Order placed → Track in orders tab
7. Order delivered → Earn chicken points

### Returning User Journey
1. Open app → Auto-login from saved session
2. Browse products → See live price changes
3. Add to cart → Quick weight selection
4. Checkout → Use wallet points
5. Place order → Real-time tracking
6. Receive order → Points credited

### Price Update Flow
1. Admin updates product price in Firestore
2. Firestore subscription triggers update
3. Product list refreshes automatically
4. Cart prices update if product in cart
5. Live ticker shows new prices
6. Price direction indicator updates

---

## 🛠️ Services Layer

### ProductService
- `getAllProducts()`: Fetch all products
- `seedProduct()`: Initialize products in Firestore
- `subscribeToProducts()`: Real-time product updates

### OrderService
- `createOrder()`: Create new order in Firestore
- `updateOrderStatus()`: Change order status
- `subscribeToUserOrders()`: Real-time order updates

### UserService
- `createUser()`: Initialize user profile
- `getUser()`: Fetch user profile
- `updateUser()`: Update profile fields
- `updateWallet()`: Modify wallet balance

---

## 🎨 UI/UX Highlights

### Visual Design
- **Rounded Corners**: 12-20px for modern feel
- **Shadows**: Subtle elevation (shadowOpacity: 0.1)
- **Card-based Layout**: White cards on cream background
- **Color-coded Feedback**: Green (success), red (error), orange (action)

### Interactions
- **Haptic Feedback**: Touch responses (via expo-haptics)
- **Loading States**: Activity indicators during async operations
- **Empty States**: Friendly messages with CTAs
- **Alerts**: Native alerts for confirmations and errors

### Accessibility
- **High Contrast**: Teal/cream, charcoal/white combinations
- **Clear CTAs**: Bold orange buttons
- **Icon Support**: Lucide icons for visual clarity
- **Readable Fonts**: 14-16px minimum for body text

---

## 📱 Screen-by-Screen Breakdown

### Home Screen ([index.tsx](file:///N:/KOOOKOO/app/(tabs)/index.tsx))
- **Header**: Logo + cart button with badge
- **Search Bar**: Filter products by name
- **Live Prices Ticker**: Horizontal scroll with top 3 products
- **Product Grid**: All products with quick add
- **Background**: Deep teal header → cream body

### Cart Screen ([cart.tsx](file:///N:/KOOOKOO/app/(tabs)/cart.tsx))
- **Header**: "Cart (count)" title
- **Discount Banner**: First order 10% off (if applicable)
- **Cart Items**: Image, name, weight, price, quantity controls
- **Bill Summary**: Subtotal, discount, total
- **Footer**: Total + "Proceed to Checkout" button
- **Empty State**: Shopping bag icon + CTA

### Orders Screen ([orders.tsx](file:///N:/KOOOKOO/app/(tabs)/orders.tsx))
- **Header**: "Orders" title
- **Order Cards**: Order ID, date, status badge, items, total
- **Timeline**: Visual progress for active orders
- **Cancel Button**: For pending orders only
- **Points Earned**: Shown for delivered orders
- **Empty State**: Package icon + message

### Profile Screen ([profile.tsx](file:///N:/KOOOKOO/app/(tabs)/profile.tsx))
- **Header**: "Profile" + logout button
- **Profile Card**: Avatar, name, email, phone, address
- **Edit Mode**: In-place editing with save/cancel
- **Wallet Card**: Orange card with points balance
- **Wallet Info**: Earning/redemption rules
- **Transaction History**: Earned/redeemed log
- **Guest CTA**: "Sign In / Sign Up" button

### Checkout Screen ([checkout.tsx](file:///N:/KOOOKOO/app/checkout.tsx))
- **Address Section**: Editable text input
- **Delivery Slot**: 3 selectable time slots
- **Wallet Section**: Checkbox to use points
- **Payment Summary**: Detailed breakdown
- **Footer**: "Place Order" button with total
- **Payment Method**: "💵 Cash on Delivery"

### Login Screen ([login.tsx](file:///N:/KOOOKOO/app/login.tsx))
- **Branding**: "KokoMart" logo + tagline
- **Form**: Email + password inputs
- **Sign In Button**: Orange with arrow icon
- **Footer**: "Don't have an account? Sign Up"
- **Background**: Deep teal full screen

---

## 🔄 State Management

### AppContext
- **Products**: Array of all products
- **Cart**: Array of cart items
- **Orders**: Array of user orders
- **User**: Current user profile
- **Wallet History**: Transaction log

### AuthContext
- **User**: Firebase Auth user object
- **Sign In**: Email/password authentication
- **Sign Up**: Create account + Firestore profile
- **Logout**: Sign out and clear state

### Local State
- **Search Query**: Product filtering
- **Selected Weight**: Weight selector state
- **Delivery Slot**: Checkout selection
- **Use Wallet Points**: Checkbox state
- **Edit Mode**: Profile editing state

---

## 🚀 Performance Optimizations

1. **Real-time Subscriptions**: Only subscribe to user-specific data
2. **Memoization**: `useMemo` for cart calculations
3. **Lazy Loading**: Products loaded once, cached in state
4. **Optimistic Updates**: UI updates before Firestore confirmation
5. **Debounced Search**: (Can be added for better performance)

---

## 🔐 Security & Rules

### Firestore Rules
- Users can only read/write their own profile
- Users can only read/write their own orders
- Products are read-only for users
- Admin role required for product updates (not implemented)

### Authentication
- Firebase Auth handles password hashing
- Secure token-based sessions
- Auto-logout on token expiration

---

## 📊 Data Flow

### Product Updates
```
Firestore (products) → ProductService.subscribeToProducts() 
→ AppContext.setProducts() → UI Re-render
```

### Order Placement
```
User clicks "Place Order" → AppContext.placeOrder() 
→ OrderService.createOrder() → Firestore (orders) 
→ Update wallet → Clear cart → Navigate to orders
```

### Price Sync in Cart
```
Product price changes in Firestore → AppContext.updateCartItemPrice() 
→ Cart re-renders with new prices
```

---

## 🎯 Business Logic

### Pricing
- Base price per kg
- Weight multiplier (1kg, 1.5kg, 2kg)
- Quantity multiplier
- First order discount (10%)
- Wallet points deduction

### Loyalty System
- Earn 1 point per kg purchased
- Points credited after delivery
- 1 point = ₹1 discount
- Max redemption = cart total - discounts

### Order Lifecycle
1. **Pending**: Order placed, awaiting confirmation
2. **Confirmed**: Admin confirmed (auto after 5 min)
3. **Received**: Received at facility (auto after 5 min)
4. **Cutting**: Being processed (auto after 5 min)
5. **Packing**: Being packed (auto after 5 min)
6. **Out for Delivery**: On the way (auto after 5 min)
7. **Delivered**: Completed (auto after 5 min)

---

## 🎨 Design Patterns

### Component Patterns
- **Container/Presentational**: Screens fetch data, components display
- **Compound Components**: OrderCard with Timeline sub-component
- **Render Props**: Not heavily used
- **Higher-Order Components**: Not used

### Code Organization
- **Feature-based**: Screens grouped by functionality
- **Service Layer**: Separate Firebase logic from UI
- **Type Safety**: TypeScript interfaces for all data models
- **Context Providers**: Global state management

---

## 🌟 Unique Features

1. **Live Price Ticker**: Stock market-style price updates
2. **Price Direction Indicators**: Visual feedback on price changes
3. **Chicken Points**: Gamified loyalty system
4. **Real-time Order Tracking**: 7-stage visual timeline
5. **Weight-based Cart**: Each weight is a separate cart item
6. **First Order Discount**: Automatic 10% off for new users
7. **Wallet Points Redemption**: Flexible discount system
8. **Auto-order Progression**: Simulated order lifecycle

---

## 📝 Summary

**KokoMart** is a well-architected, feature-rich chicken delivery application that combines:
- **Modern Tech Stack**: React Native, Expo, Firebase, TypeScript
- **Premium Design**: Teal/orange color scheme, rounded cards, subtle shadows
- **Real-time Features**: Live price updates, order tracking
- **Loyalty System**: Chicken Points for repeat customers
- **Comprehensive Flows**: Browse → Cart → Checkout → Track → Earn

The app demonstrates best practices in mobile development with clean code organization, type safety, real-time data synchronization, and a polished user experience.

---

## 🎨 Color Palette Reference

```css
/* Primary Colors */
--deep-teal: #0E4F63;
--deep-teal-dark: #0B3F52;
--orange: #ff7b00ff;

/* Background Colors */
--cream: #F6E9C8;
--cream-light: #FFF1D6;
--white: #FFFFFF;

/* Text Colors */
--charcoal: #0F1720;
--price-neutral: #acbbc2ff;

/* Accent Colors */
--teal-blue: #08424dff;
--price-up: #1DB954;
--price-down: #E63946;
```

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Application Version**: 1.0.0
