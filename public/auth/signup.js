import { getAuthErrorMessage, signUpWithEmail, watchAuthState } from "../services/auth.js";
import { clearAllFieldErrors, setButtonLoading, setFieldError, showToast } from "../components/ui.js";

const signupForm = document.getElementById("signupForm");
const signupBtn = document.getElementById("signupBtn");
const signupAlert = document.getElementById("signupAlert");
const emailInput = document.getElementById("signupEmail");
const passwordInput = document.getElementById("signupPassword");

document.body.classList.add("page-enter");

if (window.location.protocol === "file:") {
  signupAlert.textContent = "Run this app on localhost (not file://) for Firebase Authentication to work.";
  signupAlert.classList.add("alert--error");
}

watchAuthState((user) => {
  if (user) {
    window.location.replace("../dashboard/dashboard.html");
  }
});

function validateForm(email, password) {
  let valid = true;
  clearAllFieldErrors(signupForm);
  signupAlert.textContent = "";
  signupAlert.className = "alert";

  if (!email || !email.includes("@")) {
    setFieldError(emailInput, "Enter a valid email.");
    valid = false;
  }

  if (!password) {
    setFieldError(passwordInput, "Password is required.");
    valid = false;
  } else if (password.length < 6) {
    setFieldError(passwordInput, "Password must be at least 6 characters.");
    valid = false;
  }

  return valid;
}

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!validateForm(email, password)) return;

  try {
    setButtonLoading(signupBtn, true, "Creating account...");
    await signUpWithEmail(email, password);

    signupAlert.textContent = "You are successfully registered";
    signupAlert.classList.add("alert--success");
    showToast("You are successfully registered", "success");

    window.setTimeout(() => {
      window.location.href = "../dashboard/dashboard.html";
    }, 800);
  } catch (error) {
    const message = getAuthErrorMessage(error.code);
    signupAlert.textContent = message;
    signupAlert.classList.add("alert--error");
    showToast(message, "error");

    if (error.code === "auth/invalid-email") {
      setFieldError(emailInput, message);
    }
    if (error.code === "auth/weak-password") {
      setFieldError(passwordInput, message);
    }
  } finally {
    setButtonLoading(signupBtn, false);
  }
});
