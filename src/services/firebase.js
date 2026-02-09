import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore, collection } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    // @ai-guard: DO NOT HARDCODE. Use environment variables for security.
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a Firestore instance
const db = getFirestore(app);

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
