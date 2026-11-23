import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import KeyboardScreen from '../components/KeyboardScreen';
import { auth, db } from '../firebaseConfig';
import s from '../styles';

// Turn Firebase's technical codes into sentences a person understands
function friendlyAuthMessage(e) {
  switch (e?.code) {
    case 'auth/email-already-in-use':
      return 'This email already has an account. Try logging in instead.';
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'No internet connection. Check your connection and try again.';
    default:
      return e?.message || 'Something went wrong. Please try again.';
  }
}

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing info', 'Please fill in your name, email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);

    let createdUser = null;
    try {
      // 1. Create the login account
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      createdUser = result.user;

      // 2. Save the profile (name and role)
      await setDoc(doc(db, 'users', createdUser.uid), {
        name: name.trim(),
        email: email.trim(),
        role,
      });
      // AppNavigator's auth listener takes it from here.
    } catch (e) {
      // If the account was created but the profile could not be saved, remove the
      // half-made account so the user can simply try again.
      if (createdUser) {
        try {
          await createdUser.delete();
        } catch (deleteError) {
          console.log('Could not remove half-created account', deleteError);
        }
        Alert.alert(
          'Could not finish signing up',
          'Your profile could not be saved, so the account was not created. Please check your connection and try again.'
        );
      } else {
        Alert.alert('Could not create account', friendlyAuthMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.screen}>
      <KeyboardScreen contentContainerStyle={{ justifyContent: 'center' }}>
        <View style={s.logoContainer}>
          <View style={s.logoCircle}>
            <Ionicons name="cut" size={36} color="#fff" />
          </View>
          <Text style={s.logoText}>SalonGo</Text>
        </View>

        <Text style={s.title}>Create your account</Text>
        <Text style={s.subtitle}>Are you booking, or running a salon?</Text>

        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
          <TouchableOpacity
            style={[s.button, { flex: 1, backgroundColor: role === 'customer' ? '#D85A30' : '#eee' }]}
            onPress={() => setRole('customer')}
          >
            <Text style={[s.buttonText, { color: role === 'customer' ? '#fff' : '#333' }]}>Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.button, { flex: 1, backgroundColor: role === 'owner' ? '#534AB7' : '#eee' }]}
            onPress={() => setRole('owner')}
          >
            <Text style={[s.buttonText, { color: role === 'owner' ? '#fff' : '#333' }]}>Salon owner</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} />
        <TextInput
          style={s.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput style={s.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

        <TouchableOpacity style={s.button} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Create account</Text>}
        </TouchableOpacity>
      </KeyboardScreen>
    </View>
  );
}