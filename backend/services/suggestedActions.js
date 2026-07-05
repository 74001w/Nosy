// Suggested Actions Logic
// Per the PRD: pulls from all three sources (not just URGENT items),
// non-urgent items can still generate an action, each suggestion is
// specific (names who/what plus the concrete next step), and there is
// no fixed count, including zero.
//
// This is a rule-based foundation for MVP. The AI/agent step (Sprint 1+)
// will eventually replace/enhance this with model-generated suggestions;
// this module gives the data layer something concrete and testable to
// build against in the meantime.

function buildActionsFromEmails(emails) {
  const actions = [];
  for (const email of emails) {
    const text = `${email.subject} ${email.preview}`.toLowerCase();
    const needsReply =
      text.includes('deadline') ||
      text.includes('action required') ||
      text.includes('can you') ||
      text.includes('please');
    if (needsReply) {
      actions.push({
        source: 'email',
        text: `Reply to ${email.senderName} about "${email.subject}"`
      });
    }
  }
  return actions;
}

function buildActionsFromEvents(events, nowMs) {
  const actions = [];
  for (const event of events) {
    const startMs = nowMs + event.startOffsetMinutes * 60 * 1000;
    const hoursUntil = (startMs - nowMs) / (60 * 60 * 1000);
    // Anything happening today or tomorrow can generate a prep action,
    // not just urgent (within 2 hour) events.
    if (hoursUntil >= 0 && hoursUntil <= 36) {
      actions.push({
        source: 'calendar',
        text: `Prep for "${event.title}"`
      });
    }
  }
  return actions;
}

function buildActionsFromSlack(conversations) {
  const actions = [];
  for (const convo of conversations) {
    for (const message of convo.messages) {
      const text = message.text.toLowerCase();
      if (text.includes('can you') || text.includes('review') || text.includes('?')) {
        actions.push({
          source: 'slack',
          text: `Respond to ${message.author} in ${convo.conversationName}`
        });
      }
    }
  }
  return actions;
}

function buildSuggestedActions({ emails, events, conversations, nowMs }) {
  return [
    ...buildActionsFromEmails(emails),
    ...buildActionsFromEvents(events, nowMs),
    ...buildActionsFromSlack(conversations)
  ];
}

module.exports = { buildSuggestedActions };
