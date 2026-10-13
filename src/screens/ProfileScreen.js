import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACCOUNT_ROWS = [
  { key: 'EditProfile', icon: 'person-outline', color: '#D85A30', label: 'Edit profile' },
  { key: 'Notifications', icon: 'notifications-outline', color: '#534AB7', label: 'Notifications' },
  { key: 'PaymentMethods', icon: 'card-outline', color: '#1D9E75', label: 'Payment methods' },
];

const APP_ROWS = [
  { key: 'HelpSupport', icon: 'help-circle-outline', color: '#3B6FB5', label: 'Help & support' },
  { key: 'About', icon: 'information-circle-outline', color: '#888780', label: 'About SalonGo' },
];

export default function ProfileScreen({ user, role, bookingsCount = 0, onLogout, navigation }) {
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = role === 'owner' ? 'Salon owner' : 'Customer';

  const handlePress = (row) => {
    navigation.navigate(row.key);
  };

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#D85A30', '#A6499B', '#534AB7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Your name'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{roleLabel}</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statValue}>{bookingsCount}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.group}>
          {ACCOUNT_ROWS.map((row, i) => (
            <TouchableOpacity
              key={row.key}
              style={[styles.row, i < ACCOUNT_ROWS.length - 1 && styles.rowDivider]}
              onPress={() => handlePress(row)}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${row.color}1A` }]}>
                <Ionicons name={row.icon} size={18} color={row.color} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C9C7C0" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.group}>
          {APP_ROWS.map((row, i) => (
            <TouchableOpacity
              key={row.key}
              style={[styles.row, i < APP_ROWS.length - 1 && styles.rowDivider]}
              onPress={() => handlePress(row)}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${row.color}1A` }]}>
                <Ionicons name={row.icon} size={18} color={row.color} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C9C7C0" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#D85A30" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F3' },
  header: {
    paddingTop: 64,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 20,
  },
  roleBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsRow: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  body: { paddingHorizontal: 20, paddingTop: 28 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888780', marginBottom: 10, marginTop: 8 },
  group: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F1EEE8' },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: { flex: 1, fontSize: 15, color: '#2C3E50', fontWeight: '500' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginBottom: 40 },
  logoutText: { color: '#D85A30', fontSize: 15, fontWeight: '600', marginLeft: 6 },
});