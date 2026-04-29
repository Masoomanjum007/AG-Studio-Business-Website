import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { auth } from "./firebase.js";

let persistenceReady;

async function ensurePersistence() {
  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence);
  }
  return persistenceReady;
}

export async function signUpWithEmail(email, password) {
  await ensurePersistence();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithEmail(email, password) {
  await ensurePersistence();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getAuthErrorMessage(errorCode = "") {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
      return "Password is required.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function requireAuth({ onAuthenticated, onUnauthenticated }) {
  return watchAuthState((user) => {
    if (user) {
      onAuthenticated(user);
    } else {
      onUnauthenticated();
    }
  });
}
