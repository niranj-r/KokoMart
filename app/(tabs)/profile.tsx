import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Coins, TrendingUp, TrendingDown, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, LogIn } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, walletHistory, updateUserProfile } = useApp();
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {!isGuest && (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={24} color={Colors.cream} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {!isEditing && (
            <TouchableOpacity style={styles.editIcon} onPress={() => setIsEditing(true)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}

          <View style={styles.avatar}>
            <User size={40} color={Colors.white} />
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />

              <Text style={styles.label}>Address</Text>
              <TextInput style={styles.input} value={editAddress} onChangeText={setEditAddress} multiline />

              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {user.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
              {user.address ? <Text style={styles.userAddress}>{user.address}</Text> : null}
            </>
          )}

          {/*<View style={styles.detailsContainer}>
            <Text style={styles.detailText}>ID: {user.id.slice(0, 8)}...</Text>
            <Text style={styles.detailText}>Joined: {new Date(user.created_at).toLocaleDateString()}</Text>
            <Text style={styles.detailText}>First Order: {user.is_first_order_completed ? 'Completed' : 'Pending'}</Text>
          </View>*/}


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
            <Text style={styles.infoText}>• Earn 1 point per kg purchased</Text>
            <Text style={styles.infoText}>• Redeem anytime at checkout</Text>
            <Text style={styles.infoText}>• Points credited after delivery</Text>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.tealBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.priceNeutral,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: Colors.priceNeutral,
    marginBottom: 12,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: Colors.creamLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.priceNeutral,
    fontFamily: 'Activity', // Or system font if custom font not loaded
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
  infoText: {
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
    color: Colors.priceNeutral,
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
  editIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
  },
  editText: {
    color: Colors.deepTeal,
    fontWeight: 'bold',
  },
  editForm: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.priceNeutral,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.creamLight,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.creamLight,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.creamLight,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.deepTeal,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.charcoal,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: Colors.cream,
    fontWeight: 'bold',
  },
  userAddress: {
    fontSize: 14,
    color: Colors.charcoal,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  }
});
