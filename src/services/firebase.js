import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore, collection } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
	apiKey: "AIzaSyDR5xawb8aPCfHKWsO6uPBcOWIykKJGc-4",
	authDomain: "srhtocl-4b648.firebaseapp.com",
	databaseURL: "https://srhtocl-4b648-default-rtdb.firebaseio.com",
	projectId: "srhtocl-4b648",
	storageBucket: "srhtocl-4b648.appspot.com",
	messagingSenderId: "534732316547",
	appId: "1:534732316547:web:8e718044490a9b1793a0b6",
	measurementId: "G-TZZCX1VMP7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a Firestore instance
const db = getFirestore(app);

// Get an Auth instance
const auth = getAuth(app);

// Get a reference to the message collection
const collectionRef = collection(db, "srhtocl");

// Get a reference to the message collection
const postCollectionRef = collection(db, "post");

// Initialize Messaging
const messaging = getMessaging(app);

export {
	app, // firebase app
	auth, // firebase auth
	db, // firestore database
	messaging, // firebase messaging
	collectionRef, // message collection references
	postCollectionRef // post collection references
};