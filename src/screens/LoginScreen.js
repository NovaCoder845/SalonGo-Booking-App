import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import KeyboardScreen from '../components/KeyboardScreen';
import { auth } from '../firebaseConfig';
import { changeLanguage } from '../i18n';
import s from '../styles';

export default function LoginScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Turn Firebase's technical codes into a sentence a person understands.
  // (defaultValue = the English text used until the key is added to the language files)
  const friendlyError = (e) => {
    switch (e?.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return t('login_wrong_credentials', { defaultValue: 'Wrong email or password.' });
      case 'auth/invalid-email':
        return t('login_invalid_email', { defaultValue: 'That email address does not look right.' });
      case 'auth/network-request-failed':
        return t('login_no_internet', { defaultValue: 'No internet connection. Please try again.' });
      case 'auth/too-many-requests':
        return t('login_too_many', { defaultValue: 'Too many attempts. Please wait a moment and try again.' });
      default:
        return e?.message || '';
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('missing_info_title'), t('missing_info_login'));
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Nothing else to do here — AppNavigator is listening for this
      // sign-in and will switch screens automatically.
    } catch (e) {
      Alert.alert(t('login_error_title'), friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.screen}>
      <KeyboardScreen contentContainerStyle={{ justifyContent: 'center' }}>
        <TouchableOpacity
          style={{ alignSelf: 'flex-end', padding: 8 }}
          onPress={() => changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
        >
          <Text style={{ fontWeight: '600', color: '#D85A30' }}>
            {i18n.language === 'en' ? 'FR' : 'EN'}
          </Text>
        </TouchableOpacity>

        <View style={s.logoContainer}>
          <View style={s.logoCircle}>
            <Ionicons name="cut" size={36} color="#fff" />
          </View>
          <Text style={s.logoText}>{t('app_name')}</Text>
        </View>

        <Text style={s.title}>{t('welcome_title')}</Text>
        <Text style={s.subtitle}>{t('login_subtitle')}</Text>

        <TextInput
          style={s.input}
          placeholder={t('email')}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          placeholder={t('password')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{t('log_in')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={s.linkText}>{t('no_account')}</Text>
        </TouchableOpacity>
      </KeyboardScreen>
    </View>
  );
}