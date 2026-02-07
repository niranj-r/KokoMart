import { View, Text, FlatList, StyleSheet, Linking, Alert, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { auth } from '../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { subscribeToOrders, updateOrderStatus } from '../services/OrderService';
import { Order } from '../types';
import Colors from '../constants/colors';
import { MapPin, CheckCircle, LogOut, Package } from 'lucide-react-native';

export default function Orders() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) {
            router.replace('/login');
            return;
        }

        const unsubscribe = subscribeToOrders((fetchedOrders) => {
            setOrders(fetchedOrders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/login');
    }

    const handleTravel = (address?: string) => {
        if (!address) {
            Alert.alert('Error', 'No address available for this order.');
            return;
        }
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
        Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open map.'));
    };

    const handleMarkDelivered = async (orderId: string) => {
        try {
            await updateOrderStatus(orderId, 'delivered');
            Alert.alert('Success', 'Order marked as delivered.');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to update status: ' + error.message);
        }
    };

    const renderItem = ({ item }: { item: Order }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
                <MapPin size={18} color={Colors.deepTeal} style={{ marginTop: 2 }} />
                <Text style={styles.address}>{item.address || 'No address provided'}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.amountLabel}>Total Amount:</Text>
                <Text style={styles.amount}>₹{item.final_amount}</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.travelButton]}
                    onPress={() => handleTravel(item.address)}
                    activeOpacity={0.8}
                >
                    <MapPin size={20} color={Colors.white} />
                    <Text style={styles.buttonText}>Navigate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.deliverButton]}
                    onPress={() => handleMarkDelivered(item.id)}
                    activeOpacity={0.8}
                >
                    <CheckCircle size={20} color={Colors.white} />
                    <Text style={styles.buttonText}>Delivered</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.deepTeal} />
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Meat UP</Text>
                    <Text style={styles.headerSubtitle}>Deliveries</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <LogOut size={20} color={Colors.cream} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.cream} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Package size={64} color={Colors.tealBlue} />
                            <Text style={styles.emptyText}>No active deliveries</Text>
                            <Text style={styles.emptySubtext}>You're all caught up!</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.deepTeal,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: Colors.deepTealDark,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.cream,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.creamLight,
        opacity: 0.8,
    },
    logoutButton: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    list: {
        padding: 16,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: Colors.cream,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderId: {
        fontWeight: 'bold',
        fontSize: 18,
        color: Colors.deepTeal,
    },
    time: {
        fontSize: 12,
        color: Colors.charcoal,
        marginTop: 2,
        opacity: 0.7,
    },
    statusBadge: {
        backgroundColor: Colors.orange,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start',
        gap: 8,
    },
    address: {
        fontSize: 15,
        color: Colors.charcoal,
        flex: 1,
        lineHeight: 20,
    },
    amountLabel: {
        fontSize: 16,
        color: Colors.charcoal,
        flex: 1,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.deepTeal,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    travelButton: {
        backgroundColor: Colors.deepTeal,
    },
    deliverButton: {
        backgroundColor: Colors.priceUp,
    },
    buttonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 15,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        opacity: 0.8,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.cream,
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 16,
        color: Colors.creamLight,
    }
});
