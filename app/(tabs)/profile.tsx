import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coins, TrendingUp, TrendingDown, Mail, Phone, MapPin, Edit2, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, LogIn } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, walletHistory, updateUserProfile } = useApp();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(user.name);
  const [editPhone, setEditPhone] = React.useState(user.phone);
  const [editAddress, setEditAddress] = React.useState(user.address || '');

  React.useEffect(() => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditAddress(user.address || '');
  }, [user]);

  const isGuest = user.id === '1' || !user.email;

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleSaveProfile = async () => {
    await updateUserProfile({
      name: editName,
      phone: editPhone,
      address: editAddress
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top }]}>
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.backButton}>
              <ChevronLeft size={28} color={Colors.cream} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 28 }} />
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.editContent}>


            <View style={styles.formGroup}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputField}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.priceNeutral}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputField}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    keyboardType="phone-pad"
                    placeholder="Enter phone number"
                    placeholderTextColor={Colors.priceNeutral}
                  />
                  <Phone size={20} color={Colors.extrared} style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputField}
                    value={editAddress}
                    onChangeText={setEditAddress}
                    multiline
                    placeholder="Enter your address"
                    placeholderTextColor={Colors.priceNeutral}
                  />
                  <MapPin size={20} color={Colors.extrared} style={styles.inputIcon} />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveActionButton} onPress={handleSaveProfile}>
              <Text style={styles.saveActionButtonText}>SAVE CHANGES</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {!isGuest && (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={24} color={Colors.cream} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.editButtonAbsolute}
            onPress={() => setIsEditing(true)}
          >
            <Edit2 size={20} color={Colors.deepTeal} />
          </TouchableOpacity>



          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{user.name}</Text>

            <View style={styles.infoRow}>
              <Mail size={16} color={Colors.extrared} />
              <Text style={styles.infoText}>{user.email}</Text>
            </View>

            {user.phone ? (
              <View style={styles.infoRow}>
                <Phone size={16} color={Colors.extrared} />
                <Text style={styles.infoText}>{user.phone}</Text>
              </View>
            ) : null}

            {user.address ? (
              <View style={styles.infoRow}>
                <MapPin size={16} color={Colors.extrared} />
                <Text style={styles.infoText}>{user.address}</Text>
              </View>
            ) : null}
          </View>

          {isGuest && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>Sign In / Sign Up</Text>
              <LogIn size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.coinIcon}>
              <Coins size={32} color={Colors.orange} />
            </View>
            <Text style={styles.walletTitle}>Chicken Points</Text>
          </View>
          <Text style={styles.walletBalance}>{user.wallet_points}</Text>
          <Text style={styles.walletSubtext}>1 Point = ₹1</Text>
          <View style={styles.walletInfo}>
            <Text style={styles.walletInfoText}>• Earn 1 point per kg purchased</Text>
            <Text style={styles.walletInfoText}>• Redeem anytime at checkout</Text>
            <Text style={styles.walletInfoText}>• Points credited after delivery</Text>
          </View>
        </View>

        {walletHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Transaction History</Text>
            {walletHistory.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        transaction.type === 'earned'
                          ? Colors.priceUp + '20'
                          : Colors.priceDown + '20',
                    },
                  ]}
                >
                  {transaction.type === 'earned' ? (
                    <TrendingUp size={20} color={Colors.priceUp} />
                  ) : (
                    <TrendingDown size={20} color={Colors.priceDown} />
                  )}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === 'earned'
                          ? Colors.priceUp
                          : Colors.priceDown,
                    },
                  ]}
                >
                  {transaction.type === 'earned' ? '+' : '-'}
                  {transaction.amount}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: Colors.white,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  userInfoContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.creamLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 200,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    color: Colors.charcoal,
    fontWeight: '500' as const,
  },
  editButtonAbsolute: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
    zIndex: 1,
    backgroundColor: Colors.creamLight,
    borderRadius: 12,
  },

  walletCard: {
    backgroundColor: Colors.orange,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  walletBalance: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  walletSubtext: {
    fontSize: 16,
    color: Colors.creamLight,
    marginBottom: 20,
  },
  walletInfo: {
    backgroundColor: Colors.white + '20',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  walletInfoText: {
    fontSize: 14,
    color: Colors.white,
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: Colors.extrared,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutButton: {
    padding: 8,
  },
  loginButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  loginButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  editContent: {
    padding: 24,
    alignItems: 'center',
  },
  formGroup: {
    width: '100%',
    gap: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.charcoal,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.creamLight,
    paddingHorizontal: 16,
    height: 56, // Fixed height for standard inputs
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: Colors.charcoal,
    paddingVertical: 10,
  },
  inputIcon: {
    marginLeft: 10,
  },
  saveActionButton: {
    backgroundColor: Colors.charcoal,
    borderRadius: 12,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveActionButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
});
