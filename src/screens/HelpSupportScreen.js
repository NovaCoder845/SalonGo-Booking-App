import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Change this one line when SalonGo has its own email address
const CONTACT_EMAIL = 'gobinkeertika@gmail.com';

const TEXTS = {
  en: {
    title: 'Help & support',
    faq_label: 'Frequently asked',
    contact_label: 'Contact us',
    email_us: 'Email us',
    faqs: [
      {
        q: 'How do I book an appointment?',
        a: 'Open a salon from the Home tab, choose a service, pick a date and an open time, then confirm. You will see a confirmation screen, and you can add the appointment to your phone calendar.',
      },
      {
        q: 'How do I cancel an appointment?',
        a: 'Go to the Appointments tab, find your upcoming booking and tap Cancel. The time becomes free again for other customers.',
      },
      {
        q: 'Will I get a reminder?',
        a: 'Yes. SalonGo sends a notification 1 day and 1 hour before your appointment. You can turn this on or off in Profile → Notifications.',
      },
      {
        q: 'How do I find the salon?',
        a: 'Open the salon page and tap Directions. It opens Google Maps with the route to the salon.',
      },
      {
        q: 'How do I leave a review?',
        a: 'After the salon marks your appointment as done, it moves to the Past tab in Appointments. Tap it to give a star rating and a comment.',
      },
      {
        q: 'How do I pay?',
        a: 'You pay at the salon after your appointment. Online payment is not available yet.',
      },
      {
        q: 'I own a salon. How do I set up?',
        a: 'In My salon, add your salon name, pick your address from the suggestions and add your services. Then set your open times in Manage slots and add photos of your work in Portfolio.',
      },
    ],
  },
  fr: {
    title: 'Aide et assistance',
    faq_label: 'Questions fréquentes',
    contact_label: 'Nous contacter',
    email_us: 'Écrivez-nous',
    faqs: [
      {
        q: 'Comment réserver un rendez-vous ?',
        a: "Ouvrez un salon depuis l'onglet Accueil, choisissez un service, une date et une heure disponible, puis confirmez. Un écran de confirmation s'affiche et vous pouvez ajouter le rendez-vous au calendrier de votre téléphone.",
      },
      {
        q: 'Comment annuler un rendez-vous ?',
        a: "Allez dans l'onglet Rendez-vous, trouvez votre réservation à venir et touchez Annuler. L'horaire redevient disponible pour les autres clients.",
      },
      {
        q: 'Vais-je recevoir un rappel ?',
        a: 'Oui. SalonGo envoie une notification 1 jour et 1 heure avant votre rendez-vous. Vous pouvez l’activer ou la désactiver dans Profil → Notifications.',
      },
      {
        q: 'Comment trouver le salon ?',
        a: "Ouvrez la page du salon et touchez Itinéraire. Google Maps s'ouvre avec le trajet jusqu'au salon.",
      },
      {
        q: 'Comment laisser un avis ?',
        a: "Une fois que le salon a marqué votre rendez-vous comme terminé, il passe dans l'onglet Passés de Rendez-vous. Touchez-le pour donner une note en étoiles et un commentaire.",
      },
      {
        q: 'Comment payer ?',
        a: "Vous payez au salon après votre rendez-vous. Le paiement en ligne n'est pas encore disponible.",
      },
      {
        q: "Je possède un salon. Comment le configurer ?",
        a: "Dans Mon salon, ajoutez le nom de votre salon, choisissez votre adresse parmi les suggestions et ajoutez vos services. Définissez ensuite vos horaires dans Gérer les créneaux et ajoutez des photos de votre travail dans Portfolio.",
      },
    ],
  },
};

export default function HelpSupportScreen({ navigation }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const [openIndex, setOpenIndex] = useState(null);

  const sendEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=SalonGo%20support`).catch((e) =>
      console.log('Email error', e)
    );
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#2C3E50" />
      </TouchableOpacity>
      <Text style={styles.title}>{L.title}</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionLabel}>{L.faq_label}</Text>
        <View style={styles.group}>
          {L.faqs.map((item, i) => (
            <View key={i} style={[styles.faqItem, i < L.faqs.length - 1 && styles.rowDivider]}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <Text style={styles.faqQ}>{item.q}</Text>
                <Ionicons
                  name={openIndex === i ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#888780"
                />
              </TouchableOpacity>
              {openIndex === i && <Text style={styles.faqA}>{item.a}</Text>}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{L.contact_label}</Text>
        <TouchableOpacity style={styles.contactCard} onPress={sendEmail}>
          <View style={styles.contactIcon}>
            <Ionicons name="mail-outline" size={20} color="#534AB7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>{L.email_us}</Text>
            <Text style={styles.contactEmail}>{CONTACT_EMAIL}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C9C7C0" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  back: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#2C3E50', marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888780', marginBottom: 10 },
  group: { backgroundColor: '#FFF8F3', borderRadius: 16, marginBottom: 24 },
  faqItem: { padding: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F1EEE8' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '600', color: '#2C3E50', marginRight: 10 },
  faqA: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 20 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F5FD',
    borderRadius: 16,
    padding: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactTitle: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  contactEmail: { fontSize: 13, color: '#534AB7', marginTop: 2 },
});