const preloader = document.getElementById("preloader");
const preloaderBar = document.querySelector(".preloader__bar-fill");
const preloaderCounter = document.querySelector(".preloader__counter");
const main = document.getElementById("main");

function finishPreloader() {
  if (preloaderBar) preloaderBar.style.width = "100%";
  if (preloaderCounter) preloaderCounter.textContent = "100%";
  if (main) main.classList.add("page-loaded");
  if (preloader) {
    preloader.style.transition = "opacity 0.45s ease";
    preloader.style.opacity = "0";
    window.setTimeout(() => preloader.remove(), 500);
  }
}

window.addEventListener("load", () => {
  let progress = 0;
  const step = window.setInterval(() => {
    progress += 10;
    if (preloaderBar) preloaderBar.style.width = `${progress}%`;
    if (preloaderCounter) preloaderCounter.textContent = `${progress}%`;
    if (progress >= 100) {
      window.clearInterval(step);
      finishPreloader();
    }
  }, 35);
});

// Theme toggle with persistence.
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;
const savedTheme = localStorage.getItem("ag-theme");
if (savedTheme) root.setAttribute("data-theme", savedTheme);

themeToggle?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") === "light" ? "dark" : "light";
  root.setAttribute("data-theme", current);
  localStorage.setItem("ag-theme", current);
});

// Sticky nav + progress bar + back to top.
const navbar = document.getElementById("navbar");
const backToTop = document.getElementById("backToTop");
const progressBar = document.querySelector(".scroll-progress__bar");

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  navbar?.classList.toggle("scrolled", y > 20);
  backToTop?.classList.toggle("visible", y > 300);

  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const ratio = max > 0 ? y / max : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${ratio})`;
});

backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Mobile menu.
const navBurger = document.getElementById("navBurger");
const mobileMenu = document.getElementById("mobileMenu");

navBurger?.addEventListener("click", () => {
  navBurger.classList.toggle("active");
  mobileMenu?.classList.toggle("active");
  const expanded = navBurger.classList.contains("active");
  navBurger.setAttribute("aria-expanded", String(expanded));
});

document.querySelectorAll(".mobile-menu__link").forEach((link) => {
  link.addEventListener("click", () => {
    navBurger?.classList.remove("active");
    mobileMenu?.classList.remove("active");
    navBurger?.setAttribute("aria-expanded", "false");
  });
});

// Section reveal.
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.delay || 0);
      window.setTimeout(() => entry.target.classList.add("is-visible"), delay * 1000);
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll("[data-animate]").forEach((el) => revealObserver.observe(el));

// Stats count-up animation.
const counters = document.querySelectorAll("[data-count]");
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      const duration = 1000;
      const start = performance.now();

      const tick = (time) => {
        const progress = Math.min((time - start) / duration, 1);
        el.textContent = String(Math.floor(target * progress));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.6 }
);

counters.forEach((el) => counterObserver.observe(el));

// Project filter.
const filterButtons = document.querySelectorAll(".projects__filter");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.filter;
    filterButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");

    projectCards.forEach((card) => {
      const category = card.getAttribute("data-category");
      const show = selected === "all" || selected === category;
      card.classList.toggle("hidden", !show);
    });
  });
});

// Pricing toggle.
const pricingToggle = document.getElementById("pricingToggle");
const pricingLabels = document.querySelectorAll(".pricing__toggle-label");
const pricingAmounts = document.querySelectorAll(".pricing-card__amount");

pricingToggle?.addEventListener("click", () => {
  pricingToggle.classList.toggle("active");
  const yearly = pricingToggle.classList.contains("active");
  pricingLabels.forEach((label, index) => {
    if (index === 0) label.toggleAttribute("data-active", !yearly);
    if (index === 1) label.toggleAttribute("data-active", yearly);
  });
  pricingAmounts.forEach((amount) => {
    amount.textContent = yearly ? amount.dataset.yearly : amount.dataset.monthly;
  });
});

// Video modal.
const playBtn = document.getElementById("playBtn");
const videoModal = document.getElementById("videoModal");
const videoClose = document.getElementById("videoClose");
const videoFrame = document.getElementById("videoFrame");
const videoOverlay = document.querySelector(".video-modal__overlay");
const videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1";

function closeVideo() {
  videoModal?.classList.remove("active");
  if (videoFrame) videoFrame.src = "";
}

playBtn?.addEventListener("click", () => {
  videoModal?.classList.add("active");
  if (videoFrame) videoFrame.src = videoUrl;
});

videoClose?.addEventListener("click", closeVideo);
videoOverlay?.addEventListener("click", closeVideo);

// Contact form demo feedback.
const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contactStatus");
const contactSubmitBtn = document.getElementById("contactSubmitBtn");

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactStatus || !contactSubmitBtn) return;
  contactSubmitBtn.setAttribute("disabled", "true");
  contactStatus.className = "contact__status";
  contactStatus.textContent = "Sending...";

  window.setTimeout(() => {
    contactStatus.classList.add("success");
    contactStatus.textContent = "Message sent successfully.";
    contactForm.reset();
    contactSubmitBtn.removeAttribute("disabled");
  }, 900);
});
