import React, { useState, useRef, useEffect } from 'react';
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
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, User, Mail, MapPin, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { ApplicationVerifier } from 'firebase/auth';
import { auth, firebaseConfig } from '@/config/firebaseConfig';
import Colors from '@/constants/colors';
import { UserService } from '@/services/UserService';
import { useAuth } from '@/contexts/AuthContext';
import StatusBanner from '@/components/StatusBanner';
import OTPInput from '@/components/OTPInput';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithPhone, confirmCode } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Steps: 1 = Phone Number Input, 2 = OTP Input, 3 = Register Profile (New User Details)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [tempUid, setTempUid] = useState('');

  // Profile Form (Step 3)
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Optional email address
  const [houseDetails, setHouseDetails] = useState('');
  const [landmark, setLandmark] = useState('');
  const [place, setPlace] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Kerala');
  const [pincode, setPincode] = useState('');

  // Native reCAPTCHA WebView state
  const [recaptchaVisible, setRecaptchaVisible] = useState(false);
  const resolveTokenRef = useRef<((token: string) => void) | null>(null);
  const rejectTokenRef = useRef<((error: Error) => void) | null>(null);

  // Web reCAPTCHA Verifier Reference
  const webRecaptchaVerifierRef = useRef<any>(null);

  // Status Banner State
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerType, setBannerType] = useState<'success' | 'error'>('success');
  const [bannerMessage, setBannerMessage] = useState('');

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBannerType(type);
    setBannerMessage(message);
    setBannerVisible(true);
  };

  // Web Platform Check: Initialize RecaptchaVerifier on DOM container
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const { RecaptchaVerifier } = require('firebase/auth');
        webRecaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            console.log('[WebRecaptcha] Solved successfully');
          },
          'expired-callback': () => {
            console.log('[WebRecaptcha] Expired');
          }
        });
        webRecaptchaVerifierRef.current.render().catch((err: any) => {
          console.error('[WebRecaptcha] Rendering failed:', err);
        });
      } catch (e) {
        console.error('[WebRecaptcha] Initialization failed:', e);
      }
    }
  }, []);

  const handleSendOtp = async () => {
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      showBanner('error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setIsLoading(true);
    const formattedPhone = `+91${phoneNumber}`;

    try {
      let appVerifier: any;

      if (Platform.OS === 'web') {
        if (!webRecaptchaVerifierRef.current) {
          throw new Error('reCAPTCHA not initialized yet.');
        }
        appVerifier = webRecaptchaVerifierRef.current;
      } else {
        // Native: Trigger inline WebView reCAPTCHA
        const token = await new Promise<string>((resolve, reject) => {
          resolveTokenRef.current = resolve;
          rejectTokenRef.current = reject;
          setRecaptchaVisible(true);
        });

        appVerifier = {
          type: 'recaptcha',
          verify: async () => token,
          _reset: () => { },
        };
      }

      await signInWithPhone(formattedPhone, appVerifier);
      showBanner('success', 'Verification code sent successfully!');
      setStep(2);
    } catch (e: any) {
      console.error("[PhoneLogin] Error sending OTP:", e);
      showBanner('error', e.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
      setRecaptchaVisible(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || !/^\d{6}$/.test(otpCode)) {
      showBanner('error', 'Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await confirmCode(otpCode);
      setTempUid(user.uid);

      // Check if user profile already exists in Firestore
      const profile = await UserService.getUser(user.uid);

      if (profile) {
        showBanner('success', 'Logged in successfully!');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500);
      } else {
        // New user: transition to profile form (Step 3)
        showBanner('success', 'Phone verified! Please complete your profile.');
        setTimeout(() => {
          setStep(3);
        }, 1500);
      }
    } catch (e: any) {
      console.error("[PhoneLogin] OTP verification failed:", e);
      showBanner('error', 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (uid: string, data: any) => {
    return await UserService.createUser(uid, data);
  };

  const handleCreateAccount = async () => {
    if (!name.trim() || name.trim().length < 2) {
      showBanner('error', 'Please enter a valid name (at least 2 characters).');
      return;
    }
    
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showBanner('error', 'Please enter a valid email address.');
      return;
    }
    
    if (!houseDetails.trim() || !landmark.trim() || !place.trim() || !city.trim() || !pincode.trim()) {
      showBanner('error', 'Please fill in all address fields.');
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      showBanner('error', 'Please enter a valid 6-digit pincode.');
      return;
    }

    setIsLoading(true);
    const formattedAddress = `${houseDetails}, ${landmark}, ${place}, ${city}, ${state} - ${pincode}`;

    try {
      await createProfile(tempUid, {
        name,
        email: email.trim(), // Optional Email address
        phone: `+91${phoneNumber}`,
        address: formattedAddress,
        wallet_points: 0, // Initializing with 0 points
        is_first_order_completed: false // Initializing with false
      });

      showBanner('success', 'Account created successfully! Welcome to MeatUp!');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
    } catch (e: any) {
      console.error("[PhoneLogin] Profile creation failed:", e);
      showBanner('error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecaptchaMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'success') {
        if (resolveTokenRef.current) {
          resolveTokenRef.current(data.token);
        }
      } else if (data.type === 'expired') {
        if (rejectTokenRef.current) {
          rejectTokenRef.current(new Error('reCAPTCHA expired. Please solve again.'));
        }
      } else if (data.type === 'error') {
        if (rejectTokenRef.current) {
          rejectTokenRef.current(new Error(data.error || 'reCAPTCHA error occurred.'));
        }
      }
    } catch (e) {
      if (rejectTokenRef.current) {
        rejectTokenRef.current(new Error('Failed to parse reCAPTCHA response.'));
      }
    }
  };

  // HTML content loaded by the WebView to render reCAPTCHA
  const recaptchaHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: transparent !important;
          }
          #recaptcha-container {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .loading {
            position: absolute;
            font-size: 14px;
            color: #666;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="loading" id="loading-text">Loading security check...</div>
        <div id="recaptcha-container"></div>
        <script>
          try {
            const config = ${JSON.stringify(firebaseConfig)};
            firebase.initializeApp(config);
            
            const verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
              size: 'normal',
              callback: function(token) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', token: token }));
              },
              'expired-callback': function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expired' }));
              },
              error: function(err) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: err.toString() }));
              }
            });
            
            verifier.render().then(function() {
              document.getElementById('loading-text').style.display = 'none';
            }).catch(function(err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: 'Render Error: ' + err.toString() }));
            });
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: 'Init Error: ' + e.toString() }));
          }
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBanner
        visible={bannerVisible}
        type={bannerType}
        message={bannerMessage}
        onClose={() => setBannerVisible(false)}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {step === 2 && (
            <TouchableOpacity
              onPress={() => {
                setStep(1);
                setOtpCode('');
                setRecaptchaVisible(false);
              }}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>
          )}

          <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          <Text style={styles.tagline}>Fresh Meat, Delivered.</Text>

          <View style={styles.form}>
            {step === 1 && (
              <>
                <Text style={styles.header}>Verify Mobile</Text>
                <Text style={styles.subHeader}>We'll send you an OTP to verify your account.</Text>

                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Phone size={20} color={Colors.extrared} />
                    <TextInput
                      style={styles.input}
                      placeholder="10-Digit Mobile Number"
                      placeholderTextColor={Colors.extrared}
                      value={phoneNumber}
                      onChangeText={(val) => setPhoneNumber(val.replace(/[^0-9]/g, ''))}
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={!isLoading && !recaptchaVisible}
                    />
                  </View>
                </View>

                {Platform.OS === 'web' && (
                  <View nativeID="recaptcha-container" style={{ marginVertical: 12, alignSelf: 'center' }} />
                )}

                {Platform.OS !== 'web' && recaptchaVisible && (
                  <View style={styles.webviewContainer}>
                    <WebView
                      originWhitelist={['*']}
                      source={{ html: recaptchaHtml, baseUrl: `https://${firebaseConfig.authDomain}` }}
                      onMessage={handleRecaptchaMessage}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      style={{ flex: 1, backgroundColor: 'transparent' }}
                    />
                  </View>
                )}

                {!recaptchaVisible && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <>
                        <Text style={styles.actionButtonText}>Send OTP</Text>
                        <ArrowRight size={20} color={Colors.white} />
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.header}>Enter OTP</Text>
                <Text style={styles.subHeader}>Please enter the 6-digit OTP code sent to +91 {phoneNumber}</Text>

                <OTPInput
                  value={otpCode}
                  onChange={setOtpCode}
                  editable={!isLoading}
                />

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.actionButtonText}>Verify OTP</Text>
                      <ArrowRight size={20} color={Colors.white} />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={() => {
                      setStep(1);
                      setOtpCode('');
                      setRecaptchaVisible(false);
                    }}
                    style={styles.footerLink}
                  >
                    <Text style={styles.linkText}>Edit Mobile Number</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.header}>Complete Profile</Text>
                <Text style={styles.subHeader}>Please provide your details to complete account creation.</Text>

                <View style={styles.inputContainer}>
                  <User size={20} color={Colors.extrared} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={Colors.extrared}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Mail size={20} color={Colors.extrared} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address (Optional)"
                    placeholderTextColor={Colors.extrared}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                  />
                </View>

                <Text style={styles.sectionHeader}>Delivery Address</Text>

                <View style={styles.inputContainer}>
                  <MapPin size={20} color={Colors.extrared} />
                  <TextInput
                    style={styles.input}
                    placeholder="House No. & Name"
                    placeholderTextColor={Colors.extrared}
                    value={houseDetails}
                    onChangeText={setHouseDetails}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MapPin size={20} color={Colors.extrared} />
                  <TextInput
                    style={styles.input}
                    placeholder="Landmark"
                    placeholderTextColor={Colors.extrared}
                    value={landmark}
                    onChangeText={setLandmark}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.rowContainer}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Place/Area"
                      placeholderTextColor={Colors.extrared}
                      value={place}
                      onChangeText={setPlace}
                      editable={!isLoading}
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="City"
                      placeholderTextColor={Colors.extrared}
                      value={city}
                      onChangeText={setCity}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View style={styles.rowContainer}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="State"
                      placeholderTextColor={Colors.extrared}
                      value={state}
                      onChangeText={setState}
                      editable={!isLoading}
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Pincode"
                      placeholderTextColor={Colors.extrared}
                      value={pincode}
                      onChangeText={(val) => setPincode(val.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      maxLength={6}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCreateAccount}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.actionButtonText}>Create Account</Text>
                      <ArrowRight size={20} color={Colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  backButton: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: 180,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 36,
  },
  tagline: {
    fontSize: 16,
    color: Colors.creamLight,
    textAlign: 'center',
    marginBottom: 36,
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
  },
  subHeader: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.charcoal,
    marginTop: 8,
    marginBottom: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeContainer: {
    backgroundColor: Colors.creamLight,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.creamLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.charcoal,
  },
  webviewContainer: {
    height: 600,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: Colors.white,
    marginVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.orange,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerLink: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.orange,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
});
