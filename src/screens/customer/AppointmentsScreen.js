import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import s from '../../styles';
import { cancelBookingReminders } from '../../utils/reminders';

// English and French texts of this screen
const TEXTS = {
  en: {
    title: 'My appointments',
    upcoming_count: (n) => `${n} upcoming`,
    tab_upcoming: 'Upcoming',
    tab_past: 'Past',
    empty_upcoming: 'No upcoming appointments',
    empty_past: 'No past appointments yet',
    completed: 'Completed',
    cancelled: 'Cancelled',
    past: 'Past',
    cancel: 'Cancel',
    review: 'Review',
    reviewed: 'Reviewed',
    // cancel pop-up
    cancel_title: 'Cancel appointment',
    cancel_message: (service, salon) => `Cancel ${service} at ${salon}?`,
    keep_it: 'Keep it',
    could_not_cancel: 'Could not cancel',
    // remove pop-up
    remove_title: 'Remove from list',
    remove_message: (service, salon) => `Remove ${service} at ${salon} from your list?`,
    remove: 'Remove',
    could_not_remove: 'Could not remove',
    // review
    choose_rating: 'Choose a rating',
    choose_rating_msg: 'Tap the stars to rate your visit.',
    thank_you: 'Thank you!',
    thank_you_msg: 'Your review has been posted.',
    could_not_post: 'Could not post review',
    rate_title: 'Rate your visit',
    rate_subtitle: (service, salon) => `${service} at ${salon}`,
    comment_ph: 'Tell others about your visit (optional)',
    post_review: 'Post review',
    not_now: 'Not now',
  },
  fr: {
    title: 'Mes rendez-vous',
    upcoming_count: (n) => `${n} à venir`,
    tab_upcoming: 'À venir',
    tab_past: 'Passés',
    empty_upcoming: 'Aucun rendez-vous à venir',
    empty_past: 'Aucun rendez-vous passé',
    completed: 'Terminé',
    cancelled: 'Annulé',
    past: 'Passé',
    cancel: 'Annuler',
    review: 'Avis',
    reviewed: 'Avis donné',
    // cancel pop-up
    cancel_title: 'Annuler le rendez-vous',
    cancel_message: (service, salon) => `Annuler « ${service} » chez ${salon} ?`,
    keep_it: 'Le garder',
    could_not_cancel: 'Annulation impossible',
    // remove pop-up
    remove_title: 'Retirer de la liste',
    remove_message: (service, salon) => `Retirer « ${service} » chez ${salon} de votre liste ?`,
    remove: 'Retirer',
    could_not_remove: 'Suppression impossible',
    // review
    choose_rating: 'Choisissez une note',
    choose_rating_msg: 'Touchez les étoiles pour noter votre visite.',
    thank_you: 'Merci !',
    thank_you_msg: 'Votre avis a été publié.',
    could_not_post: "Impossible de publier l'avis",
    rate_title: 'Notez votre visite',
    rate_subtitle: (service, salon) => `${service} chez ${salon}`,
    comment_ph: 'Parlez de votre visite aux autres (facultatif)',
    post_review: "Publier l'avis",
    not_now: 'Pas maintenant',
  },
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AppointmentsScreen({ bookings = [] }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const uid = auth.currentUser?.uid;
  const [tab, setTab] = useState('Upcoming'); // inside the code the tab names stay in English
  const [cancellingId, setCancellingId] = useState(null);

  // Reviews
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Which of my bookings already have a review
  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('customerId', '==', uid));
    const unsub = onSnapshot(
      q,
      (snap) => setReviewedIds(new Set(snap.docs.map((d) => d.id))),
      (err) => console.log('Reviews error', err)
    );
    return unsub;
  }, [uid]);

  // If a booking was cancelled (for example by the salon), remove its reminders from this phone.
  // We remember which ones were already cleaned so the work is done only once.
  const cleanedReminders = useRef(new Set());
  useEffect(() => {
    bookings.forEach((b) => {
      if (b.status === 'cancelled' && b.salonId && b.date && b.time && !cleanedReminders.current.has(b.id)) {
        cleanedReminders.current.add(b.id);
        cancelBookingReminders(b.salonId, b.date, b.time);
      }
    });
  }, [bookings]);

  const today = todayIso();
  const sortKey = (b) => `${b.date || ''} ${b.time || ''}`;

  // Bookings the customer removed from the list are hidden (the salon keeps its own record)
  const visible = bookings.filter((b) => !b.hiddenByCustomer);

  // Upcoming = still confirmed and today or later. Everything else is "Past".
  const isUpcoming = (b) => b.status === 'confirmed' && b.date && b.date >= today;

  const upcoming = visible.filter(isUpcoming).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const past = visible.filter((b) => !isUpcoming(b)).sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

  const list = tab === 'Upcoming' ? upcoming : past;

  const cancelBooking = (booking) => {
    Alert.alert(L.cancel_title, L.cancel_message(booking.service, booking.salon), [
      { text: L.keep_it, style: 'cancel' },
      {
        text: L.cancel_title,
        style: 'destructive',
        onPress: async () => {
          setCancellingId(booking.id);
          try {
            const batch = writeBatch(db);
            batch.update(doc(db, 'bookings', booking.id), { status: 'cancelled' });

            // Free the time slot so someone else can book it
            if (booking.salonId && booking.date && booking.time) {
              batch.delete(doc(db, 'slots', `${booking.salonId}_${booking.date}_${booking.time}`));
            }
            await batch.commit();

            // Also remove the reminder notifications for this appointment
            if (booking.salonId && booking.date && booking.time) {
              await cancelBookingReminders(booking.salonId, booking.date, booking.time);
            }
          } catch (e) {
            console.log('Cancel error', e);
            Alert.alert(L.could_not_cancel, e.message);
          }
          setCancellingId(null);
        },
      },
    ]);
  };

  // Remove a past booking from my list (the bin icon)
  const removeFromList = (booking) => {
    Alert.alert(L.remove_title, L.remove_message(booking.service, booking.salon), [
      { text: L.cancel, style: 'cancel' },
      {
        text: L.remove,
        style: 'destructive',
        onPress: () =>
          updateDoc(doc(db, 'bookings', booking.id), { hiddenByCustomer: true }).catch((e) => {
            console.log('Remove error', e);
            Alert.alert(L.could_not_remove, e.message);
          }),
      },
    ]);
  };

  const openReview = (booking) => {
    setReviewTarget(booking);
    setRating(0);
    setComment('');
  };

  const submitReview = async () => {
    if (!rating) {
      Alert.alert(L.choose_rating, L.choose_rating_msg);
      return;
    }
    setSubmitting(true);
    try {
      // Use the name from my profile
      const profileSnap = await getDoc(doc(db, 'users', uid));
      const customerName = profileSnap.exists() ? profileSnap.data().name || 'Customer' : 'Customer';

      // The review's id is the booking's id, so each visit can be reviewed only once
      await setDoc(doc(db, 'reviews', reviewTarget.id), {
        salonId: reviewTarget.salonId,
        salonName: reviewTarget.salon,
        bookingId: reviewTarget.id,
        customerId: uid,
        customerName,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      setReviewTarget(null);
      Alert.alert(L.thank_you, L.thank_you_msg);
    } catch (e) {
      console.log('Review error', e);
      Alert.alert(L.could_not_post, e.message);
    }
    setSubmitting(false);
  };

  const statusLabel = (b) => {
    if (b.status === 'completed') return { text: L.completed, color: '#1D9E75' };
    if (b.status === 'cancelled') return { text: L.cancelled, color: '#C0392B' };
    return { text: L.past, color: '#888780' };
  };

  return (
    <View style={s.screen}>
      <Text style={s.title}>{L.title}</Text>
      <Text style={s.subtitle}>{L.upcoming_count(upcoming.length)}</Text>

      <View style={styles.tabRow}>
        {['Upcoming', 'Past'].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabPill, tab === t && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'Upcoming' ? L.tab_upcoming : L.tab_past}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={32} color="#C9C7C0" />
            <Text style={styles.emptyText}>{tab === 'Upcoming' ? L.empty_upcoming : L.empty_past}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const upcomingItem = isUpcoming(item);
          const status = statusLabel(item);
          const canReview = item.status === 'completed' && item.salonId;
          const reviewed = reviewedIds.has(item.id);
          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>
                  {item.service} — {item.salon}
                </Text>
                <Text style={s.cardSubtitle}>{item.when}</Text>
                {!upcomingItem && <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>}
              </View>

              {upcomingItem && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => cancelBooking(item)}
                  disabled={cancellingId === item.id}
                >
                  <Text style={styles.cancelText}>{cancellingId === item.id ? '...' : L.cancel}</Text>
                </TouchableOpacity>
              )}

              {canReview && !reviewed && (
                <TouchableOpacity style={styles.reviewButton} onPress={() => openReview(item)}>
                  <Ionicons name="star-outline" size={14} color="#D85A30" style={{ marginRight: 4 }} />
                  <Text style={styles.reviewText}>{L.review}</Text>
                </TouchableOpacity>
              )}
              {canReview && reviewed && (
                <View style={styles.reviewedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#1D9E75" style={{ marginRight: 4 }} />
                  <Text style={styles.reviewedText}>{L.reviewed}</Text>
                </View>
              )}

              {/* Bin: only for past bookings */}
              {!upcomingItem && (
                <TouchableOpacity
                  style={styles.binButton}
                  onPress={() => removeFromList(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#B9B6AE" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Review pop-up (lifts above the keyboard) */}
      <Modal
        visible={!!reviewTarget}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setReviewTarget(null)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{L.rate_title}</Text>
            <Text style={styles.modalSubtitle}>{L.rate_subtitle(reviewTarget?.service, reviewTarget?.salon)}</Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Ionicons
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color="#D85A30"
                    style={{ marginHorizontal: 3 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder={L.comment_ph}
              multiline
              maxLength={300}
            />

            <TouchableOpacity style={[s.button, submitting && { opacity: 0.6 }]} onPress={submitReview} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{L.post_review}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReviewTarget(null)} disabled={submitting}>
              <Text style={s.linkText}>{L.not_now}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  tabPillActive: {
    backgroundColor: '#D85A30',
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  binButton: {
    marginLeft: 12,
    padding: 4,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#C0392B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: '#C0392B',
    fontWeight: '600',
    fontSize: 13,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reviewText: {
    color: '#D85A30',
    fontWeight: '600',
    fontSize: 13,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewedText: {
    color: '#1D9E75',
    fontWeight: '600',
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888780',
    fontSize: 14,
    marginTop: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#888780',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 14,
  },
});