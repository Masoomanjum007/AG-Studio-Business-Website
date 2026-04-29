import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyArsu6k_zFFoXBCy3oCdi21MF-j3pZBHg0",
  authDomain: "ag-studio-c8d03.firebaseapp.com",
  projectId: "ag-studio-c8d03",
  storageBucket: "ag-studio-c8d03.firebasestorage.app",
  messagingSenderId: "449205566213",
  appId: "1:449205566213:web:f268cde759f4e5509e156c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
