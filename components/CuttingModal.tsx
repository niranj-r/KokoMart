import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
} from 'react-native';
import Colors from '@/constants/colors';
import { X } from 'lucide-react-native';

interface CuttingModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (cuttingType: string) => void;
    options?: string[];
}

const DEFAULT_CUTTING_TYPES = [
    'Curry Cut (Small)',
    'Curry Cut (Medium)',
    'Whole Bird',
    'Boneless Cubes',
    'Minced (Keema)',
];

export default function CuttingModal({ visible, onClose, onSelect, options }: CuttingModalProps) {
    const cuttingOptions = options && options.length > 0 ? options : DEFAULT_CUTTING_TYPES;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Select Cutting Type</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <X size={24} color={Colors.charcoal} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.optionsContainer}>
                                {cuttingOptions.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={styles.optionButton}
                                        onPress={() => onSelect(type)}
                                    >
                                        <Text style={styles.optionText}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.charcoal,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        backgroundColor: Colors.creamLight,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.cream,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.charcoal,
    },
});
