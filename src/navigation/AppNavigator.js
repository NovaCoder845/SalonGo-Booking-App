import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, View } from 'react-native';

import { auth, db } from '../firebaseConfig';

import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
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
import MySalonScreen from '../screens/owner/MySalonScreen';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import PortfolioUploadScreen from '../screens/owner/PortfolioUploadScreen';

const AuthStack = createNativeStackNavigator();
const CustomerStack = createNativeStackNavigator();
const OwnerStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const CUSTOMER_TAB_ICONS = { Home: 'home', Appointments: 'calendar', Profile: 'person-circle' };
const OWNER_TAB_ICONS = { Home: 'home', Bookings: 'calendar', Profile: 'person-circle' };

const ONBOARDING_KEY = 'salongo_onboarding_seen';

// English and French texts (screen titles, tab names, alerts).
// The names used inside the code (Home, Appointments, Bookings, Profile...) never change.
const TEXTS = {
  en: {
    tab_home: 'Home',
    tab_appointments: 'Appointments',
    tab_bookings: 'Bookings',
    tab_profile: 'Profile',
    salons_near_you: 'Salons near you',
    salon: 'Salon',
    book_appointment: 'Book appointment',
    confirmed: 'Confirmed',
    dashboard: 'Dashboard',
    my_salon: 'My salon',
    manage_slots: 'Manage slots',
    portfolio: 'Portfolio photos',
    login: 'Log in',
    signup: 'Create account',
    profile_not_found: 'Profile not found',
    profile_not_found_msg: 'We could not find your account details. Please sign up again or contact support.',
    connection_problem: 'Connection problem',
    connection_problem_msg: 'Could not reach the server. Pull down to refresh, or try again shortly.',
  },
  fr: {
    tab_home: 'Accueil',
    tab_appointments: 'Rendez-vous',
    tab_bookings: 'Réservations',
    tab_profile: 'Profil',
    salons_near_you: 'Salons près de vous',
    salon: 'Salon',
    book_appointment: 'Réserver un rendez-vous',
    confirmed: 'Confirmé',
    dashboard: 'Tableau de bord',
    my_salon: 'Mon salon',
    manage_slots: 'Gérer les créneaux',
    portfolio: 'Photos du portfolio',
    login: 'Se connecter',
    signup: 'Créer un compte',
    profile_not_found: 'Profil introuvable',
    profile_not_found_msg: 'Nous n’avons pas trouvé les détails de votre compte. Inscrivez-vous à nouveau ou contactez le support.',
    connection_problem: 'Problème de connexion',
    connection_problem_msg: 'Impossible de joindre le serveur. Tirez pour actualiser, ou réessayez dans un instant.',
  },
};

const pick = (lng) => TEXTS[(lng || 'en').startsWith('fr') ? 'fr' : 'en'];

// Gives each component the texts in the current language (and refreshes when the language changes)
function useL() {
  const { i18n } = useTranslation();
  return pick(i18n.language);
}

function CustomerHomeStack() {
  const L = useL();
  return (
    <CustomerStack.Navigator>
      <CustomerStack.Screen name="SalonList" component={SalonListScreen} options={{ title: L.salons_near_you }} />
      <CustomerStack.Screen name="SalonDetail" component={SalonDetailScreen} options={{ title: L.salon }} />
      <CustomerStack.Screen name="Booking" component={BookingScreen} options={{ title: L.book_appointment }} />
      <CustomerStack.Screen name="Confirmation" component={ConfirmationScreen} options={{ title: L.confirmed }} />
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
  const L = useL();
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
      <Tabs.Screen
        name="Home"
        component={CustomerHomeStack}
        options={{ headerShown: false, tabBarLabel: L.tab_home }}
      />
      <Tabs.Screen name="Appointments" options={{ title: L.tab_appointments, tabBarLabel: L.tab_appointments }}>
        {() => <AppointmentsScreen bookings={bookings} />}
      </Tabs.Screen>
      <Tabs.Screen name="Profile" options={{ headerShown: false, tabBarLabel: L.tab_profile }}>
        {() => (
          <ProfileStackScreen
            role="customer"
            onLogout={onLogout}
            profile={profile}
            onSaveProfile={onSaveProfile}
            bookingsCount={bookings.filter((b) => b.status !== 'cancelled').length}
          />
        )}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

function OwnerHomeStack() {
  const L = useL();
  return (
    <OwnerStack.Navigator>
      <OwnerStack.Screen name="Dashboard" component={OwnerDashboardScreen} options={{ title: L.dashboard }} />
      <OwnerStack.Screen name="MySalon" component={MySalonScreen} options={{ title: L.my_salon }} />
      <OwnerStack.Screen name="ManageSlots" component={ManageSlotsScreen} options={{ title: L.manage_slots }} />
      <OwnerStack.Screen name="Portfolio" component={PortfolioUploadScreen} options={{ title: L.portfolio }} />
    </OwnerStack.Navigator>
  );
}

function OwnerTabs({ onLogout, profile, onSaveProfile, bookingsCount }) {
  const L = useL();
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
      <Tabs.Screen
        name="Home"
        component={OwnerHomeStack}
        options={{ headerShown: false, tabBarLabel: L.tab_home }}
      />
      <Tabs.Screen
        name="Bookings"
        component={IncomingBookingsScreen}
        options={{ title: L.tab_bookings, tabBarLabel: L.tab_bookings }}
      />
      <Tabs.Screen name="Profile" options={{ headerShown: false, tabBarLabel: L.tab_profile }}>
        {() => (
          <ProfileStackScreen
            role="owner"
            onLogout={onLogout}
            profile={profile}
            onSaveProfile={onSaveProfile}
            bookingsCount={bookingsCount}
          />
        )}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

// Read the user's profile. A brand-new signup may still be saving its profile,
// so try a few times before giving up.
async function loadProfile(uid) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return null;
}

export default function AppNavigator() {
  const { i18n } = useTranslation();
  const L = pick(i18n.language);

  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [permissionsAsked, setPermissionsAsked] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [ownerBookingsCount, setOwnerBookingsCount] = useState(0);
  const [onboardingSeen, setOnboardingSeen] = useState(null); // null = still checking

  // Has this phone already seen the welcome slides?
  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingSeen(value === 'yes');
      } catch (e) {
        setOnboardingSeen(true); // if storage fails, don't block the app
      }
    })();
  }, []);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'yes');
    } catch (e) {
      console.log('Could not save onboarding flag', e);
    }
    setOnboardingSeen(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setFirebaseUser(user);
          const data = await loadProfile(user.uid);
          if (data) {
            setProfile(data);
            setRole(data.role);
          } else {
            const T = pick(i18n.language);
            Alert.alert(T.profile_not_found, T.profile_not_found_msg);
            await signOut(auth);
          }
        } else {
          setFirebaseUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (e) {
        console.error('Failed to load user profile', e);
        const T = pick(i18n.language);
        Alert.alert(T.connection_problem, T.connection_problem_msg);
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

  // Owner: how many bookings have come in for my salon (not counting cancelled ones)
  useEffect(() => {
    if (!firebaseUser || role !== 'owner') {
      setOwnerBookingsCount(0);
      return;
    }
    const q = query(collection(db, 'bookings'), where('salonOwnerId', '==', firebaseUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => setOwnerBookingsCount(snap.docs.filter((d) => d.data().status !== 'cancelled').length),
      (err) => console.log('Owner bookings count error', err)
    );
    return unsubscribe;
  }, [firebaseUser, role]);

  const handleLogout = () => signOut(auth);

  if (authLoading || onboardingSeen === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#D85A30" />
      </View>
    );
  }

  // First time on this phone, and not logged in: show the welcome slides
  if (!firebaseUser && !onboardingSeen) {
    return <OnboardingScreen onDone={finishOnboarding} />;
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
    return (
      <OwnerTabs
        onLogout={handleLogout}
        profile={profile}
        onSaveProfile={setProfile}
        bookingsCount={ownerBookingsCount}
      />
    );
  }

  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: L.login }} />
      <AuthStack.Screen name="Signup" component={SignupScreen} options={{ title: L.signup }} />
    </AuthStack.Navigator>
  );
}