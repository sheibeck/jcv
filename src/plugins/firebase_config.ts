import type { FirebaseOptions } from 'firebase/app' 
 
const firebaseConfig = { 
  apiKey: import.meta.env.VUE_APP_FIREBASE_APIKEY, 
  authDomain: import.meta.env.VUE_APP_FIREBASE_AUTHDOMAIN, 
  projectId: import.meta.env.VUE_APP_FIREBASE_PROJECTID, 
  storageBucket: import.meta.env.VUE_APP_FIREBASE_STORAGEBUCKET, 
  messagingSenderId: import.meta.env.VUE_APP_FIREBASE_MESSAGINGSENDERID, 
  appId: import.meta.env.VUE_APP_FIREBASE_APPID, 
  measurementId: import.meta.env.VUE_APP_MEASUREMENTID 
} as FirebaseOptions 
 
 
export{ 
  firebaseConfig 
}

