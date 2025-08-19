
// firebase.config.js
// This file is used to configure the Firebase SDK for the application.
// In a real production environment, use a more secure method for managing these keys.

// TODO: Replace the placeholder values below with your own Firebase project's configuration.
// You can find this in your Firebase project settings under "General".
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};

// Make the config available globally for the firebaseService to use.
window.firebaseConfig = firebaseConfig;
