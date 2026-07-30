const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/matches', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const matches = db.all(
    `SELECT m.id as match_id,
            CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END as matched_user_id,
            u.name, u.age, p.photo
     FROM matches m
     JOIN users u ON u.id = CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END
     JOIN profiles p ON p.user_id = u.id
     WHERE m.user1_id = ? OR m.user2_id = ?
     ORDER BY m.created_at DESC`,
    [userId, userId, userId, userId]
  );

  res.render('matches', { matches });
});

module.exports = router;
