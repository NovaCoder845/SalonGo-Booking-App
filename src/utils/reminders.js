import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show the notification even if the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'reminders';
const ENABLED_KEY = 'salongo_reminders_enabled';

// Is the "Booking reminders" switch on? (on by default)
export async function getRemindersEnabled() {
  try {
    const value = await AsyncStorage.getItem(ENABLED_KEY);
    return value !== 'no';
  } catch (e) {
    return true;
  }
}

// Turn reminders on or off. Turning them off also cancels the ones already scheduled.
export async function setRemindersEnabled(enabled) {
  try {
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'yes' : 'no');
    if (!enabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  } catch (e) {
    console.log('Reminder setting error', e);
  }
}

// Each booking gets two reminder names, so we can cancel them later
export function reminderIds(salonId, dateIso, time) {
  const base = `${salonId}_${dateIso}_${String(time).replace(':', '')}`;
  return { day: `${base}_24h`, hour: `${base}_1h` };
}

async function ensureReady() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Appointment reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  return status === 'granted';
}

// Schedules "tomorrow" and "in 1 hour" reminders. Returns how many were scheduled.
export async function scheduleBookingReminders({ salonId, salonName, serviceName, dateIso, time }) {
  try {
    if (!(await getRemindersEnabled())) return 0; // the customer turned reminders off
    if (!(await ensureReady())) return 0;

    const [year, month, day] = dateIso.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const ids = reminderIds(salonId, dateIso, time);

    const plan = [
      { id: ids.day, before: 24 * 60 * 60 * 1000, body: `Tomorrow at ${time}: ${serviceName} at ${salonName}.` },
      { id: ids.hour, before: 60 * 60 * 1000, body: `In 1 hour (${time}): ${serviceName} at ${salonName}.` },
    ];

    let count = 0;
    for (const item of plan) {
      const when = new Date(start.getTime() - item.before);
      if (when.getTime() <= Date.now() + 5000) continue; // already in the past
      await Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: { title: 'SalonGo appointment reminder', body: item.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID },
      });
      count += 1;
    }
    return count;
  } catch (e) {
    console.log('Reminder error', e);
    return 0;
  }
}

// Cancels both reminders of a booking
export async function cancelBookingReminders(salonId, dateIso, time) {
  try {
    const ids = reminderIds(salonId, dateIso, time);
    await Notifications.cancelScheduledNotificationAsync(ids.day);
    await Notifications.cancelScheduledNotificationAsync(ids.hour);
  } catch (e) {
    console.log('Cancel reminder error', e);
  }
}