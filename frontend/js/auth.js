const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBanner = document.getElementById("login-error");
const demoAlexBtn = document.getElementById("demo-alex");
const demoSamBtn = document.getElementById("demo-sam");

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
}

function clearError() {
  errorBanner.classList.add("hidden");
  errorBanner.textContent = "";
}

async function attemptLogin(email, password) {
  clearError();

  if (!email || !password) {
    showError("Enter an email and password.");
    return;
  }

  try {
    const response = await fetch(`${NOSY_API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || "Couldn't log in, try again.");
      return;
    }

    // Session token, kept for the length of this browser session only.
    sessionStorage.setItem("nosy_token", data.token);
    sessionStorage.setItem("nosy_user_name", data.user.name);

    window.location.href = "briefing.html";
  } catch (err) {
    showError("Couldn't reach the server. Is the backend running?");
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  attemptLogin(emailInput.value.trim(), passwordInput.value);
});

demoAlexBtn.addEventListener("click", () => {
  attemptLogin("alex@demo.test", "demo1234");
});

demoSamBtn.addEventListener("click", () => {
  attemptLogin("sam@demo.test", "demo1234");
});
