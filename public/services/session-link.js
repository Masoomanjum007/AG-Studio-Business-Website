import { watchAuthState } from "./auth.js";

const accountLink = document.getElementById("accountLink");

if (accountLink) {
  watchAuthState((user) => {
    if (user) {
      accountLink.href = "./dashboard/dashboard.html";
      accountLink.textContent = "Dashboard";
      return;
    }

    accountLink.href = "./auth/signin.html";
    accountLink.textContent = "Sign In";
  });
}
