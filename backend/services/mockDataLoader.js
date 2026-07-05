const fs = require('fs');
const path = require('path');
const { isEmailUrgent, isEventUrgent, isSlackMessageUrgent } = require('./prioritization');
const { buildSuggestedActions } = require('./suggestedActions');

const MOCK_DIR = path.join(__dirname, '..', 'data', 'mock');

function loadJson(filename) {
  const raw = fs.readFileSync(path.join(MOCK_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

// Mock timestamps are stored as "OFFSET_MINUTES:-90" so the demo data always
// looks fresh relative to whenever the briefing is actually generated,
// instead of going stale the day after this project is built.
function resolveOffset(offsetString, nowMs) {
  const match = /OFFSET_MINUTES:(-?\d+)/.exec(offsetString);
  if (!match) return offsetString;
  const minutes = parseInt(match[1], 10);
  return new Date(nowMs + minutes * 60 * 1000).toISOString();
}

// Simulates a source failure so the friendly-fallback-message behavior
// (required by the PRD) can actually be tested end to end.
// Toggle via query param, e.g. GET /api/briefing?fail=slack
function getMorningBriefingData({ failSource } = {}) {
  const nowMs = Date.now();
  const twelveHoursMs = 12 * 60 * 60 * 1000;

  const result = {
    urgent: [],
    upcomingEvents: [],
    slackHighlights: [],
    otherEmails: [],
    suggestedActions: [],
    sourceErrors: {}
  };

  // ---- Gmail ----
  if (failSource === 'gmail') {
    result.sourceErrors.gmail = 'Gmail unavailable right now.';
  } else {
    const rawEmails = loadJson('gmail.json').map((e) => ({
      ...e,
      receivedAt: resolveOffset(e.receivedAt, nowMs)
    }));
    const recentEmails = rawEmails.filter(
      (e) => nowMs - new Date(e.receivedAt).getTime() <= twelveHoursMs
    );
    for (const email of recentEmails) {
      if (isEmailUrgent(email)) {
        result.urgent.push({ type: 'email', ...email });
      } else {
        result.otherEmails.push({ type: 'email', ...email });
      }
    }
  }

  // ---- Calendar ----
  if (failSource === 'calendar') {
    result.sourceErrors.calendar = 'Calendar unavailable right now.';
  } else {
    const events = loadJson('calendar.json');
    for (const event of events) {
      const entry = {
        type: 'event',
        title: event.title,
        start: new Date(nowMs + event.startOffsetMinutes * 60 * 1000).toISOString(),
        end: new Date(nowMs + event.endOffsetMinutes * 60 * 1000).toISOString(),
        location: event.location,
        attendees: event.attendees
      };
      if (isEventUrgent(event, nowMs)) {
        result.urgent.push(entry);
      } else {
        result.upcomingEvents.push(entry);
      }
    }
  }

  // ---- Slack ----
  if (failSource === 'slack') {
    result.sourceErrors.slack = 'Slack unavailable right now.';
  } else {
    const conversations = loadJson('slack.json');
    for (const convo of conversations) {
      for (const message of convo.messages) {
        const entry = {
          type: 'slack',
          conversation: convo.conversationName,
          author: message.author,
          text: message.text
        };
        if (isSlackMessageUrgent(message)) {
          result.urgent.push(entry);
        } else {
          result.slackHighlights.push(entry);
        }
      }
    }
  }

  // ---- Suggested actions ----
  // Only built from sources that didn't fail, consistent with the PRD's
  // partial-failure behavior (show what you can, don't block on one source).
  const emailsForActions = failSource === 'gmail' ? [] : loadJson('gmail.json');
  const eventsForActions = failSource === 'calendar' ? [] : loadJson('calendar.json');
  const conversationsForActions = failSource === 'slack' ? [] : loadJson('slack.json');

  result.suggestedActions = buildSuggestedActions({
    emails: emailsForActions,
    events: eventsForActions,
    conversations: conversationsForActions,
    nowMs
  });

  return result;
}

module.exports = { getMorningBriefingData };
