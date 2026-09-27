import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { initializeFirestore, collection, setLogLevel } from "firebase/firestore";

// GEÇİCİ TEŞHİS: canlıda "client is offline" hatasının gerçek nedenini görmek için.
setLogLevel("debug");
import { getMessaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";

// CI secret'ları girilirken sona kopyalanan görünmez satır sonu (\n) karakterleri
// Firebase config'i bozup canlıda "client is offline" hatasına yol açtığı için
// her değer trim() ile temizleniyor.
const trim = (value) => (typeof value === "string" ? value.trim() : value);

const firebaseConfig = {
    // @ai-guard: DO NOT HARDCODE. Use environment variables for security.
    apiKey: trim(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: trim(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    databaseURL: trim(import.meta.env.VITE_FIREBASE_DATABASE_URL),
    projectId: trim(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: trim(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: trim(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: trim(import.meta.env.VITE_FIREBASE_APP_ID),
    measurementId: trim(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// GitHub Pages gibi Firebase Hosting dışındaki barındırmalarda, Firestore'un
// varsayılan WebChannel/streaming bağlantısı bazı CDN/ağlarda kurulamayıp
// "client is offline" hatasına yol açabiliyor (bilinen bir Firestore Web SDK
// sınırlaması). Long-polling'e otomatik geçişi zorlayarak bunu önlüyoruz.
const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
});

// Get an Auth instance
const auth = getAuth(app);

// Get a reference to the message collection
const collectionRef = collection(db, "chats");

// Get a reference to the message collection
const postCollectionRef = collection(db, "post");

// Get a reference to the categories collection
const categoryCollectionRef = collection(db, "categories");

// Initialize Messaging
const messaging = getMessaging(app);

// Initialize Storage
const storage = getStorage(app);

export {
    app, // firebase app
    auth, // firebase auth
    db, // firestore database
    messaging, // firebase messaging
    storage, // firebase storage
    collectionRef, // message collection references
    postCollectionRef, // post collection references
    categoryCollectionRef // category collection references
};
