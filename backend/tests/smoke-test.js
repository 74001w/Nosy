// Basic smoke test for the Nosy backend foundation.
// Run with: npm test   (server must already be running: npm run dev)
// This is intentionally simple: it checks that the main flows work end
// to end, not a full unit test suite, appropriate for this MVP stage.

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
    passed++;
  } else {
    console.log(`FAIL: ${label}`);
    failed++;
  }
}

async function run() {
  // 1. Health check
  const health = await fetch(`${BASE_URL}/api/health`).then((r) => r.json());
  check('health check responds ok', health.status === 'ok');

  // 2. Login with bad input is rejected
  const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '', password: '' })
  });
  check('empty login credentials rejected with 400', badLogin.status === 400);

  // 3. Login with wrong password is rejected
  const wrongLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex@demo.test', password: 'wrong-password' })
  });
  check('wrong password rejected with 401', wrongLogin.status === 401);

  // 4. Login with correct demo credentials succeeds
  const login = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex@demo.test', password: 'demo1234' })
  }).then((r) => r.json());
  check('demo login returns a token', typeof login.token === 'string' && login.token.length > 0);

  // 5. Briefing endpoint rejects requests with no token
  const noAuth = await fetch(`${BASE_URL}/api/briefing`);
  check('briefing without token rejected with 401', noAuth.status === 401);

  // 6. Briefing endpoint works with a valid token and has all 5 sections
  const briefing = await fetch(`${BASE_URL}/api/briefing`, {
    headers: { Authorization: `Bearer ${login.token}` }
  }).then((r) => r.json());
  check('briefing has urgent section', Array.isArray(briefing.urgent));
  check('briefing has upcomingEvents section', Array.isArray(briefing.upcomingEvents));
  check('briefing has slackHighlights section', Array.isArray(briefing.slackHighlights));
  check('briefing has otherEmails section', Array.isArray(briefing.otherEmails));
  check('briefing has suggestedActions section', Array.isArray(briefing.suggestedActions));

  // 7. Simulated source failure returns a friendly message, not a crash
  const failedBriefing = await fetch(`${BASE_URL}/api/briefing?fail=slack`, {
    headers: { Authorization: `Bearer ${login.token}` }
  }).then((r) => r.json());
  check(
    'simulated Slack failure returns friendly message',
    failedBriefing.sourceErrors && failedBriefing.sourceErrors.slack === 'Slack unavailable right now.'
  );

  // 8. Invalid fail value is rejected, not silently ignored
  const badFail = await fetch(`${BASE_URL}/api/briefing?fail=nonsense`, {
    headers: { Authorization: `Bearer ${login.token}` }
  });
  check('invalid fail query param rejected with 400', badFail.status === 400);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
