import { FlatList, Text, View } from 'react-native';
import s from '../../styles';

// Later: query Firestore "bookings" where customerId == current user,
// split into upcoming vs past based on date, allow cancel on upcoming ones.

export default function AppointmentsScreen({ bookings = [] }) {
  return (
    <View style={s.screen}>
      <Text style={s.title}>My appointments</Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.cardTitle}>{item.service} — {item.salon}</Text>
            <Text style={s.cardSubtitle}>{item.when}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.subtitle}>No appointments yet.</Text>}
      />
    </View>
  );
}