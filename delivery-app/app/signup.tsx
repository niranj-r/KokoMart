import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebaseConfig';
import Colors from '../constants/colors';

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignUp = async () => {
        // Validation
        if (!name || !email || !phone || !vehicleNumber || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Save Partner Info to Firestore
            await setDoc(doc(db, 'partners', user.uid), {
                id: user.uid,
                name,
                email,
                phone,
                vehicle_number: vehicleNumber,
                created_at: Date.now(),
                is_active: true // Auto-approve for now
            });

            Alert.alert('Success', 'Account created successfully!');
            router.replace('/orders');
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>Partner Sign-Up</Text>
                    <Text style={styles.subtitle}>Join our delivery network</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            placeholderTextColor={Colors.priceNeutral}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor={Colors.priceNeutral}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your phone number"
                            placeholderTextColor={Colors.priceNeutral}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Vehicle Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. KA-01-AB-1234"
                            placeholderTextColor={Colors.priceNeutral}
                            value={vehicleNumber}
                            onChangeText={setVehicleNumber}
                            autoCapitalize="characters"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter password (min 6 chars)"
                            placeholderTextColor={Colors.priceNeutral}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm your password"
                            placeholderTextColor={Colors.priceNeutral}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.signUpButton}
                        onPress={handleSignUp}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.signUpButtonText}>Register</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Text style={styles.loginLinkText}>
                            Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.deepTeal,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40
    },
    content: {
        backgroundColor: Colors.deepTealDark,
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.cream,
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        color: Colors.creamLight,
        textAlign: 'center',
        marginBottom: 24,
        opacity: 0.8
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        color: Colors.cream,
        marginBottom: 6,
        fontWeight: '600',
        marginLeft: 4,
        fontSize: 14
    },
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderColor: Colors.tealBlue,
        padding: 14,
        borderRadius: 14,
        color: Colors.cream,
        fontSize: 15
    },
    signUpButton: {
        backgroundColor: Colors.orange,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: Colors.orange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    signUpButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 17,
        letterSpacing: 0.5
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginLinkText: {
        color: Colors.creamLight,
        fontSize: 14,
        opacity: 0.9
    },
    loginLinkBold: {
        color: Colors.cream,
        fontWeight: 'bold'
    }
});
