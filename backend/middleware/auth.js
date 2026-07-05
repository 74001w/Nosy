const jwt = require('jsonwebtoken');

// Every route that touches briefing data goes through this, so a user
// can only ever see their own briefing, never someone else's, even
// though there are only two demo accounts right now.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Server is missing JWT_SECRET, check backend .env.' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session, please log in again.' });
  }
}

module.exports = { requireAuth };
