import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, ArrowRight, Phone, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password || !phone || !address) return;
        if (password !== confirmPassword) {
            // Can add Alert here if needed, or rely on UI feedback
            return;
        }

        setIsLoading(true);
        try {
            await signUp(email, password, name, phone, address);
            router.replace('/(tabs)');
        } catch (e) {
            // Error handled in AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.logo}>KoKoMart</Text>
                    <Text style={styles.tagline}>Create Your Account</Text>

                    <View style={styles.form}>
                        <Text style={styles.header}>Sign Up</Text>

                        <View style={styles.inputContainer}>
                            <User size={20} color={Colors.priceNeutral} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor={Colors.priceNeutral}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>


                        <View style={styles.inputContainer}>
                            <Phone size={20} color={Colors.priceNeutral} />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor={Colors.priceNeutral}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MapPin size={20} color={Colors.priceNeutral} />
                            <TextInput
                                style={styles.input}
                                placeholder="Address"
                                placeholderTextColor={Colors.priceNeutral}
                                value={address}
                                onChangeText={setAddress}
                                multiline
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Mail size={20} color={Colors.priceNeutral} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor={Colors.priceNeutral}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Lock size={20} color={Colors.priceNeutral} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={Colors.priceNeutral}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Lock size={20} color={Colors.priceNeutral} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor={Colors.priceNeutral}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>


                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleSignup}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <>
                                    <Text style={styles.loginButtonText}>Create Account</Text>
                                    <ArrowRight size={20} color={Colors.white} />
                                </>
                            )}
                        </TouchableOpacity>



                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => router.push('/login')}>
                                <Text style={styles.linkText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.deepTeal,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logo: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.orange,
        textAlign: 'center',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: Colors.creamLight,
        textAlign: 'center',
        marginBottom: 48,
    },
    form: {
        backgroundColor: Colors.white,
        padding: 24,
        borderRadius: 24,
        gap: 16,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.charcoal,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.creamLight,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.charcoal,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.orange,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        marginTop: 8,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.creamLight,
    },
    dividerText: {
        fontSize: 14,
        color: Colors.priceNeutral,
        fontWeight: 'bold',
    },
    socialButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.white,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
    },
    footerText: {
        fontSize: 14,
        color: Colors.priceNeutral,
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.orange,
    },
});
