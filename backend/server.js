require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const briefingRoutes = require('./routes/briefing');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Simple health check, useful for confirming the backend is even running
// before debugging anything else.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Nosy backend', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/briefing', briefingRoutes);

// Catch-all for unknown routes, so a typo'd URL returns a clean JSON
// error instead of an HTML 404 page.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Last-resort error handler, so an unexpected crash in any route still
// returns a friendly JSON response instead of taking the server down
// or leaking a stack trace to the client.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Nosy backend running on http://localhost:${PORT}`);
});
