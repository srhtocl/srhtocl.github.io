importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Using older version (v8) script syntax for SW compatibility or check modern SW syntax.
// Actually, for SW we often use the 'compat' libraries or just standard JS.
// Firebase v9 Modular SDK in Window, but SW often uses v8 compat naming "firebase.initializeApp" unless using "firebase/messaging/sw" with bundler.
// Since this is a static file in public, we use CDN links which support `firebase` global.

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

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
