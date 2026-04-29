import { logoutUser, requireAuth } from "../services/auth.js";
import { setButtonLoading, showToast } from "../components/ui.js";

const welcomeName = document.getElementById("welcomeName");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

document.body.classList.add("page-enter");

requireAuth({
  onAuthenticated: (user) => {
    const nameFromEmail = user.email ? user.email.split("@")[0] : "User";
    welcomeName.textContent = `Welcome, ${nameFromEmail}`;
    userEmail.textContent = user.email || "No email found";
  },
  onUnauthenticated: () => {
    window.location.replace("../auth/signin.html");
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    setButtonLoading(logoutBtn, true, "Logging out...");
    await logoutUser();
    showToast("Logged out successfully", "info");
    window.location.href = "../auth/signin.html";
  } catch (error) {
    showToast("Unable to logout. Try again.", "error");
  } finally {
    setButtonLoading(logoutBtn, false);
  }
});
