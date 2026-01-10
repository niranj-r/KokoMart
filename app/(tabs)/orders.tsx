import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Package, Scissors, Box, Truck, CheckCircle, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Order, OrderStatus } from '@/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string }> = {
  pending: { label: 'Order Pending', icon: Clock, color: Colors.orange },
  confirmed: { label: 'Order Confirmed', icon: Package, color: Colors.tealBlue }, // Added confirmed to satisfy all keys or map safely
  received: { label: 'Order Received', icon: Package, color: Colors.tealBlue },
  cutting: { label: 'Cutting', icon: Scissors, color: Colors.orange },
  packing: { label: 'Packing', icon: Box, color: Colors.orange },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: Colors.priceUp },
  delivered: { label: 'Delivered', icon: CheckCircle, color: Colors.priceUp },
  cancelled: { label: 'Cancelled', icon: Box, color: Colors.priceDown },
};

export default function OrdersScreen() {
  const { orders, cancelOrder } = useApp();

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Orders</Text>
          </View>
        </SafeAreaView>
        <View style={styles.emptyContainer}>
          <Package size={80} color={Colors.priceNeutral} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.ordersContainer}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onCancel={cancelOrder} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function OrderCard({ order, onCancel }: { order: Order; onCancel: (id: string) => Promise<void> }) {
  const config = STATUS_CONFIG[order.status];
  const Icon = config.icon;

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{order.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
          <Icon size={16} color={Colors.white} />
          <Text style={styles.statusText}>{config.label}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.map((item, index) => (
          <Text key={index} style={styles.itemText}>
            • {item.name} ({item.weight}kg × {item.quantity})
          </Text>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{order.final_amount.toFixed(2)}</Text>
        </View>
        {order.status === 'delivered' && (
          <View style={styles.pointsEarned}>
            <Text style={styles.pointsText}>+{order.earned_points} Points</Text>
          </View>
        )}
      </View>

      {order.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert(
              "Cancel Order",
              "Are you sure you want to cancel this order? Any points used will be refunded.",
              [
                { text: "No", style: "cancel" },
                {
                  text: "Yes, Cancel",
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await onCancel(order.id);
                    } catch (e: any) {
                      Alert.alert("Error", "Failed to cancel order: " + e.message);
                    }
                  }
                }
              ]
            )
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      )}

      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <OrderTimeline currentStatus={order.status} />
      )}
    </View>
  );
}

function OrderTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  const statuses: OrderStatus[] = ['pending', 'received', 'cutting', 'packing', 'out_for_delivery', 'delivered'];
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <View style={styles.timeline}>
      {statuses.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <View key={status} style={styles.timelineItem}>
            <View
              style={[
                styles.timelineIcon,
                isCompleted && styles.timelineIconActive,
                isCurrent && styles.timelineIconCurrent,
              ]}
            >
              <Icon
                size={16}
                color={isCompleted ? Colors.white : Colors.priceNeutral}
              />
            </View>
            <Text
              style={[
                styles.timelineLabel,
                isCompleted && styles.timelineLabelActive,
              ]}
            >
              {config.label}
            </Text>
            {index < statuses.length - 1 && (
              <View
                style={[
                  styles.timelineLine,
                  isCompleted && styles.timelineLineActive,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  safeArea: {
    backgroundColor: Colors.deepTeal,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.priceNeutral,
    textAlign: 'center',
  },
  ordersContainer: {
    padding: 20,
    gap: 16,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.priceNeutral,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  orderItems: {
    gap: 8,
  },
  itemText: {
    fontSize: 15,
    color: Colors.charcoal,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.creamLight,
    marginVertical: 16,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.priceNeutral,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: Colors.orange,
  },
  pointsEarned: {
    backgroundColor: Colors.tealBlue,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  timeline: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.creamLight,
    gap: 16,
  },
  timelineItem: {
    position: 'relative',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.creamLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconActive: {
    backgroundColor: Colors.tealBlue,
  },
  timelineIconCurrent: {
    backgroundColor: Colors.orange,
  },
  timelineLabel: {
    position: 'absolute',
    left: 44,
    top: 8,
    fontSize: 14,
    color: Colors.priceNeutral,
  },
  timelineLabelActive: {
    color: Colors.charcoal,
    fontWeight: '600' as const,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 16,
    backgroundColor: Colors.creamLight,
  },
  timelineLineActive: {
    backgroundColor: Colors.tealBlue,
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.priceDown + '20',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.priceDown,
  },
  cancelButtonText: {
    color: Colors.priceDown,
    fontWeight: 'bold',
    fontSize: 14,
  }
});
