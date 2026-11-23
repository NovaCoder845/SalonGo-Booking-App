# SalonGo

**A salon booking app for Mauritius.** Customers find a salon, book a time and get a reminder. Salon owners manage their salon, services, open times and bookings from the same app. Available in **English and French**.

Built with **React Native (Expo)** and **Firebase**.

---

## Features

### For customers
- Browse salons **sorted by distance** from your location, and search by salon name or area
- Salon page with **address and Google Maps directions**, a **Call** button, services with prices, a **portfolio** of photos, and **reviews**
- **Book** a service: choose a date and one of the times the owner has opened. A time that is already booked cannot be booked twice
- **Booking confirmation** with **reminders** (1 day and 1 hour before) and **Add to calendar**
- **My appointments**: upcoming and past, **cancel** an upcoming booking, remove old ones from the list
- **Leave a review** (stars and comment) after the salon marks the visit as done
- Profile with photo, **notification settings**, help and about screens
- **English / French** language switch

### For salon owners
- **Dashboard**: bookings today and next appointment
- **My salon**: name, phone number, address (search with suggestions, or use current location), area
- **Services**: add and remove services with a duration and a free-text price (for example `500` or `From Rs 500`)
- **Manage slots**: choose which times customers can book (open all / close all)
- **Incoming bookings**: upcoming and history, **cancel** a booking (the time becomes free again) or **mark it as done**
- **Portfolio photos** (up to 8)

---

## Tech stack

| Part | Technology |
|---|---|
| App | React Native with Expo (SDK 57), React Navigation |
| Login and database | Firebase Authentication and Cloud Firestore (real-time updates) |
| Languages | react-i18next (English / French) |
| Address search | OpenStreetMap (free, no API key) |
| Location | expo-location |
| Reminders | expo-notifications (local notifications) |
| Calendar | expo-calendar |
| Photos | expo-image-picker, stored as small base64 images in Firestore (no paid storage used) |

---

## Roles and data

There are two roles, chosen at sign-up: **Customer** and **Salon owner**.

Main Firestore collections:

- `users` – profile and role
- `salons` – one salon per owner (document id = owner id): name, area, address, coordinates, phone, open times, photo
- `services` – services of a salon (name, duration, price)
- `slots` – one document per booked time, so the same time cannot be booked twice
- `bookings` – customer bookings (status: `confirmed`, `completed`, `cancelled`)
- `portfolio` – salon photos
- `reviews` – one review per completed booking

Firestore security rules make sure that customers only manage their own bookings and that only a salon's owner can change that salon, its services and its photos.

---

## Run the project

**You need:** Node.js, an Android phone (or emulator) and a Firebase project.

```bash
# 1. Install the packages
npm install

# 2. Add your Firebase settings in src/firebaseConfig.js
#    (Firebase console -> Project settings -> Your apps -> Web app)

# 3. Start the app
npx expo start
```

The app uses native modules (location, notifications, calendar), so it runs in a **development build**, not in Expo Go.

### Build an Android APK

```bash
npx expo prebuild --platform android --clean
# create android/local.properties with:  sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk
cd android
./gradlew assembleRelease
# the APK is in android/app/build/outputs/apk/release/app-release.apk
```

---

## Project structure

```
src/
  navigation/AppNavigator.js     tabs, stacks and role-based navigation
  screens/                       login, sign-up, profile, help, about, ...
    customer/                    salon list, salon page, booking, appointments
    owner/                       dashboard, my salon, slots, bookings, portfolio
  i18n/                          English and French texts
  utils/                         reminders, time slots, address search, images
  firebaseConfig.js              Firebase setup
```

---

## Future improvements

Possible future improvements include:

- Online payment integration
- Push notifications for salon owners
- Different opening hours for each day of the week
- Advanced booking analytics
- More detailed salon availability management
- Improved review and rating features

---

## Author

Made by **Keertika Deepti Gobin**, as a mobile application development project.

Contact: gobinkeertika@gmail.com
