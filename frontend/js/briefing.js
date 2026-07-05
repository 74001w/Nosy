const token = sessionStorage.getItem("nosy_token");
const userName = sessionStorage.getItem("nosy_user_name");

// Auth guard: no token, no briefing page. Sends them back to log in
// instead of showing a broken/empty screen.
if (!token) {
  window.location.href = "index.html";
}

document.getElementById("user-name").textContent = userName ? `Hi, ${userName}` : "";

const initialState = document.getElementById("initial-state");
const loadingState = document.getElementById("loading-state");
const resultsState = document.getElementById("results-state");
const loadingMessageEl = document.getElementById("loading-message");
const errorBannersEl = document.getElementById("error-banners");

const generateBtn = document.getElementById("generate-btn");
const refreshBtn = document.getElementById("refresh-btn");
const logoutBtn = document.getElementById("logout-btn");

const LOADING_MESSAGES = [
  "Snooping through Slack...",
  "Untangling your inbox...",
  "Judging your calendar...",
  "Counting unread emails...",
  "Deciding what's actually urgent...",
  "Poking around your DMs..."
];

let loadingInterval = null;

function showState(state) {
  initialState.classList.add("hidden");
  loadingState.classList.add("hidden");
  resultsState.classList.add("hidden");
  state.classList.remove("hidden");
}

function startLoadingMessages() {
  let i = 0;
  loadingMessageEl.textContent = LOADING_MESSAGES[0];
  loadingInterval = setInterval(() => {
    i = (i + 1) % LOADING_MESSAGES.length;
    loadingMessageEl.textContent = LOADING_MESSAGES[i];
  }, 1500);
}

function stopLoadingMessages() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

function renderEmpty(container, message) {
  const p = document.createElement("p");
  p.className = "empty-text";
  p.textContent = message;
  container.appendChild(p);
}

function renderSourceError(message) {
  const p = document.createElement("p");
  p.className = "source-error";
  p.textContent = message;
  errorBannersEl.appendChild(p);
}

function renderItem(container, text, styleClass) {
  const div = document.createElement("div");
  div.className = `item ${styleClass}`;
  div.textContent = text;
  container.appendChild(div);
}

function describeItem(entry) {
  if (entry.type === "email") return `${entry.senderName || entry.sender}: ${entry.subject}`;
  if (entry.type === "event") return `${entry.title}`;
  if (entry.type === "slack") return `${entry.author} in ${entry.conversation}: ${entry.text}`;
  return JSON.stringify(entry);
}

function renderBriefing(data) {
  errorBannersEl.innerHTML = "";

  const urgentList = document.getElementById("urgent-list");
  const upcomingList = document.getElementById("upcoming-list");
  const slackList = document.getElementById("slack-list");
  const otherList = document.getElementById("other-list");
  const actionsList = document.getElementById("actions-list");

  [urgentList, upcomingList, slackList, otherList, actionsList].forEach((el) => (el.innerHTML = ""));

  // Source errors, shown as friendly notices rather than failing everything.
  if (data.sourceErrors) {
    Object.values(data.sourceErrors).forEach((msg) => renderSourceError(msg));
  }

  if (data.urgent && data.urgent.length > 0) {
    data.urgent.forEach((entry) => renderItem(urgentList, describeItem(entry), "urgent-item"));
  } else {
    renderEmpty(urgentList, "Nothing urgent right now.");
  }

  if (data.upcomingEvents && data.upcomingEvents.length > 0) {
    data.upcomingEvents.forEach((entry) => renderItem(upcomingList, describeItem(entry), "upcoming-item"));
  } else if (!data.sourceErrors || !data.sourceErrors.calendar) {
    renderEmpty(upcomingList, "Nothing else on your calendar.");
  }

  if (data.slackHighlights && data.slackHighlights.length > 0) {
    data.slackHighlights.forEach((entry) => renderItem(slackList, describeItem(entry), "quiet-item"));
  } else if (!data.sourceErrors || !data.sourceErrors.slack) {
    renderEmpty(slackList, "No other Slack activity.");
  }

  if (data.otherEmails && data.otherEmails.length > 0) {
    data.otherEmails.forEach((entry) => renderItem(otherList, describeItem(entry), "quiet-item"));
  } else if (!data.sourceErrors || !data.sourceErrors.gmail) {
    renderEmpty(otherList, "No other emails.");
  }

  if (data.suggestedActions && data.suggestedActions.length > 0) {
    data.suggestedActions.forEach((action) => renderItem(actionsList, action.text, "quiet-item"));
  } else {
    renderEmpty(actionsList, "Nothing needs a follow-up right now.");
  }
}

async function generateBriefing() {
  showState(loadingState);
  startLoadingMessages();

  try {
    const response = await fetch(`${NOSY_API_BASE_URL}/api/briefing`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    stopLoadingMessages();

    if (!response.ok) {
      showState(initialState);
      alert(data.error || "Couldn't generate the briefing right now.");
      return;
    }

    renderBriefing(data);
    showState(resultsState);
  } catch (err) {
    stopLoadingMessages();
    showState(initialState);
    alert("Couldn't reach the server. Is the backend running?");
  }
}

generateBtn.addEventListener("click", generateBriefing);
refreshBtn.addEventListener("click", generateBriefing);

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("nosy_token");
  sessionStorage.removeItem("nosy_user_name");
  window.location.href = "index.html";
});
