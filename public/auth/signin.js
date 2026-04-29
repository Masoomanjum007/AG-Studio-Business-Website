import { getAuthErrorMessage, signInWithEmail, watchAuthState } from "../services/auth.js";
import { clearAllFieldErrors, setButtonLoading, setFieldError, showToast } from "../components/ui.js";

const signinForm = document.getElementById("signinForm");
const signinBtn = document.getElementById("signinBtn");
const signinAlert = document.getElementById("signinAlert");
const emailInput = document.getElementById("signinEmail");
const passwordInput = document.getElementById("signinPassword");

document.body.classList.add("page-enter");

watchAuthState((user) => {
  if (user) {
    window.location.replace("../dashboard/dashboard.html");
  }
});

function validateForm(email, password) {
  let valid = true;
  clearAllFieldErrors(signinForm);
  signinAlert.textContent = "";
  signinAlert.className = "alert";

  if (!email || !email.includes("@")) {
    setFieldError(emailInput, "Enter a valid email.");
    valid = false;
  }

  if (!password) {
    setFieldError(passwordInput, "Password is required.");
    valid = false;
  }

  return valid;
}

signinForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!validateForm(email, password)) return;

  try {
    setButtonLoading(signinBtn, true, "Signing in...");
    await signInWithEmail(email, password);

    signinAlert.textContent = "Sign in successful. Redirecting...";
    signinAlert.classList.add("alert--success");
    showToast("Signed in successfully", "success");

    window.setTimeout(() => {
      window.location.href = "../dashboard/dashboard.html";
    }, 700);
  } catch (error) {
    const message = getAuthErrorMessage(error.code);
    signinAlert.textContent = message;
    signinAlert.classList.add("alert--error");
    showToast(message, "error");
  } finally {
    setButtonLoading(signinBtn, false);
  }
});
