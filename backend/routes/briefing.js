const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getMorningBriefingData } = require('../services/mockDataLoader');

const router = express.Router();

const ALLOWED_FAIL_VALUES = ['gmail', 'calendar', 'slack'];

// GET /api/briefing
// GET /api/briefing?fail=slack   -> lets you demo the partial-failure UI state
router.get('/', requireAuth, (req, res) => {
  const { fail } = req.query;

  if (fail !== undefined && !ALLOWED_FAIL_VALUES.includes(fail)) {
    return res.status(400).json({
      error: `fail must be one of: ${ALLOWED_FAIL_VALUES.join(', ')}`
    });
  }

  try {
    const briefing = getMorningBriefingData({ failSource: fail });
    res.json({ generatedAt: new Date().toISOString(), ...briefing });
  } catch (err) {
    // Even the assembly step itself is guarded, so a bug in mock data
    // never becomes a raw 500 with a stack trace shown to the user.
    console.error('Error building briefing:', err);
    res.status(500).json({ error: "Couldn't generate the briefing right now. Try again." });
  }
});

module.exports = router;
