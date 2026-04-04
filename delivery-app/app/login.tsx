import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebaseConfig';
import Colors from '../constants/colors';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is a delivery partner
            const partnerDoc = await getDoc(doc(db, 'partners', user.uid));
            
            if (!partnerDoc.exists()) {
                await signOut(auth);
                Alert.alert('Access Denied', 'Only registered delivery partners can access this app.');
                return;
            }

            router.replace('/orders');
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Meat UP</Text>
                <Text style={styles.subtitle}>Delivery Partner App</Text>

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
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter password"
                        placeholderTextColor={Colors.priceNeutral}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.loginButtonText}>Login</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.signupLink}
                    onPress={() => router.push('/signup')}
                    disabled={loading}
                >
                    <Text style={styles.signupLinkText}>
                        Don't have an account? <Text style={styles.signupLinkBold}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.deepTeal,
        justifyContent: 'center',
        padding: 20
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
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.cream,
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: 4
    },
    subtitle: {
        fontSize: 16,
        color: Colors.creamLight,
        textAlign: 'center',
        marginBottom: 32,
        opacity: 0.8
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: Colors.cream,
        marginBottom: 8,
        fontWeight: '600',
        marginLeft: 4
    },
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderColor: Colors.tealBlue,
        padding: 16,
        borderRadius: 16,
        color: Colors.cream,
        fontSize: 16
    },
    loginButton: {
        backgroundColor: Colors.orange,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: Colors.orange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 0.5
    },
    signupLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    signupLinkText: {
        color: Colors.creamLight,
        fontSize: 14,
        opacity: 0.9
    },
    signupLinkBold: {
        color: Colors.cream,
        fontWeight: 'bold'
    }
});
