const toastsRootId = "toast-root";

function ensureToastsRoot() {
  let root = document.getElementById(toastsRootId);
  if (!root) {
    root = document.createElement("div");
    root.id = toastsRootId;
    root.className = "toast-root";
    document.body.appendChild(root);
  }
  return root;
}

export function showToast(message, type = "info", duration = 3200) {
  const root = ensureToastsRoot();
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = message;

  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("toast--visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("toast--visible");
    window.setTimeout(() => toast.remove(), 260);
  }, duration);
}

export function setButtonLoading(button, isLoading, loadingText = "Processing...") {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent.trim();
    }
    button.disabled = true;
    button.classList.add("is-loading");
    button.textContent = loadingText;
    return;
  }

  button.disabled = false;
  button.classList.remove("is-loading");
  if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
}

export function setFieldError(field, message = "") {
  if (!field) return;

  const fieldWrap = field.closest(".form-field");
  if (!fieldWrap) return;

  const errorEl = fieldWrap.querySelector(".field-error");
  if (!errorEl) return;

  field.classList.toggle("has-error", Boolean(message));
  errorEl.textContent = message;
}

export function clearAllFieldErrors(form) {
  if (!form) return;
  const fields = form.querySelectorAll("input");
  fields.forEach((field) => setFieldError(field, ""));
}
