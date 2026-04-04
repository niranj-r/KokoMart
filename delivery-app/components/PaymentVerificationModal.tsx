import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Banknote, QrCode, ShieldCheck, X } from 'lucide-react-native';
import Colors from '../constants/colors';

interface PaymentVerificationModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: (mode: 'cash' | 'upi' | 'delivery') => void;
}

export default function PaymentVerificationModal({ isVisible, onClose, onConfirm }: PaymentVerificationModalProps) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Payment Verification</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={Colors.deepTeal} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Choose the payment mode used by the customer:</Text>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => onConfirm('cash')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(29, 185, 84, 0.1)' }]}>
                                <Banknote size={28} color={Colors.priceUp} />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionLabel}>Cash Collection</Text>
                                <Text style={styles.optionDesc}>Received physical cash</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => onConfirm('upi')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 2, 12, 0.1)' }]}>
                                <QrCode size={28} color={Colors.deepTeal} />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionLabel}>UPI / Digital</Text>
                                <Text style={styles.optionDesc}>Paid via QR or Wallet</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => onConfirm('delivery')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 123, 0, 0.1)' }]}>
                                <ShieldCheck size={28} color={Colors.orange} />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionLabel}>Confirm Delivery</Text>
                                <Text style={styles.optionDesc}>Mark as delivered (General)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        backgroundColor: Colors.cream,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.deepTeal,
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.charcoal,
        opacity: 0.8,
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.charcoal,
    },
    optionDesc: {
        fontSize: 13,
        color: Colors.charcoal,
        opacity: 0.6,
        marginTop: 2,
    },
    cancelButton: {
        width: '100%',
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.deepTeal,
        opacity: 0.7,
    },
});
