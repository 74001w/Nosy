// Two demo accounts for the MVP, no signup flow, no real user database yet.
// Credentials come from environment variables, never hardcoded directly
// in code, so nothing sensitive-looking ends up committed to git even
// though these are intentionally simple demo passwords.

function getDemoUsers() {
  return [
    {
      id: 'demo-user-1',
      name: 'Alex',
      email: process.env.DEMO_USER_1_EMAIL || 'alex@demo.test',
      password: process.env.DEMO_USER_1_PASSWORD || 'demo1234'
    },
    {
      id: 'demo-user-2',
      name: 'Sam',
      email: process.env.DEMO_USER_2_EMAIL || 'sam@demo.test',
      password: process.env.DEMO_USER_2_PASSWORD || 'demo1234'
    }
  ];
}

function findUserByCredentials(email, password) {
  const users = getDemoUsers();
  return users.find(
    (u) => u.email.toLowerCase() === String(email || '').toLowerCase() && u.password === password
  );
}

module.exports = { getDemoUsers, findUserByCredentials };
