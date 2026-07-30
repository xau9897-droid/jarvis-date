const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/chat/:matchId', requireAuth, (req, res) => {
  const { matchId } = req.params;

  const match = db.get(
    `SELECT * FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
    [matchId, req.session.userId, req.session.userId]
  );

  if (!match) return res.redirect('/matches');

  const otherUserId = match.user1_id === req.session.userId ? match.user2_id : match.user1_id;
  const otherUser = db.get(
    'SELECT name, photo FROM users JOIN profiles ON users.id = profiles.user_id WHERE users.id = ?',
    [otherUserId]
  );

  const messages = db.all(
    'SELECT * FROM messages WHERE match_id = ? ORDER BY created_at ASC',
    [matchId]
  );

  res.render('chat', { matchId, otherUser, messages: JSON.stringify(messages), userId: req.session.userId });
});

module.exports = router;
