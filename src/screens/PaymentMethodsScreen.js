import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PaymentMethodsScreen({ navigation }) {
  const [methods, setMethods] = useState([]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [last4, setLast4] = useState('');

  const handleAdd = () => {
    if (!label.trim() || last4.trim().length !== 4) return;
    setMethods((prev) => [...prev, { id: Date.now().toString(), label: label.trim(), last4: last4.trim() }]);
    setLabel('');
    setLast4('');
    setAdding(false);
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#2C3E50" />
      </TouchableOpacity>
      <Text style={styles.title}>Payment methods</Text>

      {methods.length === 0 && !adding && (
        <View style={styles.empty}>
          <Ionicons name="card-outline" size={40} color="#C9C7C0" />
          <Text style={styles.emptyText}>No payment methods yet</Text>
        </View>
      )}

      <FlatList
        data={methods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Ionicons name="card" size={22} color="#1D9E75" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardSub}>•••• {item.last4}</Text>
            </View>
          </View>
        )}
      />

      {adding ? (
        <View style={{ marginTop: 10 }}>
          <TextInput style={styles.input} placeholder="Card nickname (e.g. Visa)" value={label} onChangeText={setLabel} />
          <TextInput
            style={styles.input}
            placeholder="Last 4 digits"
            value={last4}
            onChangeText={setLast4}
            keyboardType="number-pad"
            maxLength={4}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
            <Text style={styles.saveText}>Save card</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAdding(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setAdding(true)}>
          <Ionicons name="add" size={18} color="#D85A30" />
          <Text style={styles.addText}>Add payment method</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.note}>
        This stores a card nickname and last 4 digits locally for demo purposes only — it isn't connected to a real payment processor yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  back: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#2C3E50', marginBottom: 20 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#888780', fontSize: 14, marginTop: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardLabel: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  cardSub: { fontSize: 13, color: '#888780', marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
  },
  addText: { color: '#D85A30', fontWeight: '600', marginLeft: 6 },
  saveButton: {
    backgroundColor: '#D85A30',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelText: { color: '#888780', textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  note: { fontSize: 12, color: '#C9C7C0', marginTop: 20, lineHeight: 18 },
});