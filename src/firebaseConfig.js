import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuCtyW2bR18TXcZEe7tAy_nEyU16E567o",
  authDomain: "salongo-c7da4.firebaseapp.com",
  projectId: "salongo-c7da4",
  storageBucket: "salongo-c7da4.firebasestorage.app",
  messagingSenderId: "729912616597",
  appId: "1:729912616597:web:7ac7715684206439c61d9c",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});