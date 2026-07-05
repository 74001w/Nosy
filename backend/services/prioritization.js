// Prioritization Logic
// Implements the rules from the PRD exactly:
// - urgency keywords in subject/preview or message text
// - calendar event starting within the next 2 hours
// - sender on the VIP list (empty for MVP, see PRD note)

const URGENCY_KEYWORDS = [
  'asap',
  'deadline',
  'action required',
  'urgent',
  'due today'
];

// MVP note: intentionally empty. Filled in later, after the agent has run
// against real data at least once, per the PRD's Prioritization Logic section.
const VIP_SENDERS = [];

function containsUrgencyKeyword(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return URGENCY_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isFromVipSender(senderEmail) {
  if (!senderEmail) return false;
  return VIP_SENDERS.includes(senderEmail.toLowerCase());
}

function isEmailUrgent(email) {
  const combinedText = `${email.subject || ''} ${email.preview || ''}`;
  return containsUrgencyKeyword(combinedText) || isFromVipSender(email.sender);
}

function isEventUrgent(event, nowMs) {
  const startMs = nowMs + event.startOffsetMinutes * 60 * 1000;
  const twoHoursMs = 2 * 60 * 60 * 1000;
  return startMs - nowMs <= twoHoursMs && startMs - nowMs >= 0;
}

function isSlackMessageUrgent(message) {
  return containsUrgencyKeyword(message.text);
}

module.exports = {
  URGENCY_KEYWORDS,
  VIP_SENDERS,
  isEmailUrgent,
  isEventUrgent,
  isSlackMessageUrgent
};
