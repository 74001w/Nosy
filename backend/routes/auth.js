const express = require('express');
const jwt = require('jsonwebtoken');
const { findUserByCredentials } = require('../config/demoUsers');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  // Input validation: reject unexpected/missing input before it goes
  // anywhere near auth logic.
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (email.trim().length === 0 || password.trim().length === 0) {
    return res.status(400).json({ error: 'Email and password cannot be empty.' });
  }

  const user = findUserByCredentials(email, password);
  if (!user) {
    return res.status(401).json({ error: "That email or password doesn't match a demo account." });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fails loudly instead of silently signing tokens with an empty secret.
    return res.status(500).json({ error: 'Server is missing JWT_SECRET, check backend .env.' });
  }

  const token = jwt.sign(
    { userId: user.id, name: user.name, email: user.email },
    secret,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

module.exports = router;
