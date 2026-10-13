import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { auth, db } from '../firebaseConfig';

import LoginScreen from '../screens/LoginScreen';
import PermissionsScreen from '../screens/PermissionsScreen';

import AboutScreen from '../screens/AboutScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SignupScreen from '../screens/SignupScreen';

import AppointmentsScreen from '../screens/customer/AppointmentsScreen';
import BookingScreen from '../screens/customer/BookingScreen';
import ConfirmationScreen from '../screens/customer/ConfirmationScreen';
import SalonDetailScreen from '../screens/customer/SalonDetailScreen';
import SalonListScreen from '../screens/customer/SalonListScreen';

import IncomingBookingsScreen from '../screens/owner/IncomingBookingsScreen';
import ManageSlotsScreen from '../screens/owner/ManageSlotsScreen';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import PortfolioUploadScreen from '../screens/owner/PortfolioUploadScreen';

const AuthStack = createNativeStackNavigator();
const CustomerStack = createNativeStackNavigator();
const OwnerStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const CUSTOMER_TAB_ICONS = { Home: 'home', Appointments: 'calendar', Profile: 'person-circle' };
const OWNER_TAB_ICONS = { Home: 'home', Bookings: 'calendar', Profile: 'person-circle' };

function CustomerHomeStack() {
  return (
    <CustomerStack.Navigator>
      <CustomerStack.Screen name="SalonList" component={SalonListScreen} options={{ title: 'Salons near you' }} />
      <CustomerStack.Screen name="SalonDetail" component={SalonDetailScreen} options={{ title: 'Salon' }} />
      <CustomerStack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book appointment' }} />
      <CustomerStack.Screen name="Confirmation" component={ConfirmationScreen} options={{ title: 'Confirmed' }} />
    </CustomerStack.Navigator>
  );
}

function ProfileStackScreen({ role, onLogout, profile, onSaveProfile, bookingsCount }) {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome">
        {({ navigation }) => (
          <ProfileScreen
            navigation={navigation}
            onLogout={onLogout}
            user={profile}
            role={role}
            bookingsCount={bookingsCount}
          />
        )}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="EditProfile">
        {({ navigation }) => (
          <EditProfileScreen navigation={navigation} user={profile} role={role} onSave={onSaveProfile} />
        )}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <ProfileStack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <ProfileStack.Screen name="About" component={AboutScreen} />
    </ProfileStack.Navigator>
  );
}

function CustomerTabs({ onLogout, profile, onSaveProfile, bookings }) {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#D85A30',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size, focused }) => {
          const name = CUSTOMER_TAB_ICONS[route.name] || 'ellipse';
          return <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" component={CustomerHomeStack} options={{ headerShown: false }} />
      <Tabs.Screen name="Appointments">
        {() => <AppointmentsScreen bookings={bookings} />}
      </Tabs.Screen>
      <Tabs.Screen name="Profile" options={{ headerShown: false }}>
        {() => (
          <ProfileStackScreen
            role="customer"
            onLogout={onLogout}
            profile={profile}
            onSaveProfile={onSaveProfile}
            bookingsCount={bookings.length}
          />
        )}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

function OwnerHomeStack() {
  return (
    <OwnerStack.Navigator>
      <OwnerStack.Screen name="Dashboard" component={OwnerDashboardScreen} options={{ title: 'Dashboard' }} />
      <OwnerStack.Screen name="ManageSlots" component={ManageSlotsScreen} options={{ title: 'Manage slots' }} />
      <OwnerStack.Screen name="Portfolio" component={PortfolioUploadScreen} options={{ title: 'Portfolio photos' }} />
    </OwnerStack.Navigator>
  );
}

function OwnerTabs({ onLogout, profile, onSaveProfile }) {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#534AB7',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size, focused }) => {
          const name = OWNER_TAB_ICONS[route.name] || 'ellipse';
          return <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" component={OwnerHomeStack} options={{ headerShown: false }} />
      <Tabs.Screen name="Bookings" component={IncomingBookingsScreen} />
      <Tabs.Screen name="Profile" options={{ headerShown: false }}>
        {() => (
          <ProfileStackScreen role="owner" onLogout={onLogout} profile={profile} onSaveProfile={onSaveProfile} />
        )}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [permissionsAsked, setPermissionsAsked] = useState(false);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setFirebaseUser(user);
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);
            setRole(data.role);
          }
        } else {
          setFirebaseUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (e) {
        console.error('Failed to load user profile', e);
        Alert.alert(
          'Connection problem',
          'Could not reach the server. Pull down to refresh, or try again shortly.',
        );
      } finally {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Live-updating list of this customer's bookings from Firestore. No
  // orderBy here on purpose (avoids needing a composite index) — sorted
  // client-side instead.
  useEffect(() => {
    if (!firebaseUser || role !== 'customer') {
      setBookings([]);
      return;
    }
    const q = query(collection(db, 'bookings'), where('customerId', '==', firebaseUser.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setBookings(list);
    });
    return unsubscribe;
  }, [firebaseUser, role]);

  const handleLogout = () => signOut(auth);

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#D85A30" />
      </View>
    );
  }

  if (firebaseUser && !permissionsAsked) {
    return <PermissionsScreen onDone={() => setPermissionsAsked(true)} />;
  }

  if (firebaseUser && role === 'customer') {
    return (
      <CustomerTabs onLogout={handleLogout} profile={profile} onSaveProfile={setProfile} bookings={bookings} />
    );
  }
  if (firebaseUser && role === 'owner') {
    return <OwnerTabs onLogout={handleLogout} profile={profile} onSaveProfile={setProfile} />;
  }

  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Log in' }} />
      <AuthStack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create account' }} />
    </AuthStack.Navigator>
  );
}