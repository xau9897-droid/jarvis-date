const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/swiper', requireAuth, (req, res) => {
  const likedIds = db.all(
    'SELECT swiped_id FROM swipes WHERE swiper_id = ?',
    [req.session.userId]
  ).map(s => s.swiped_id);

  likedIds.push(req.session.userId);

  let profiles;
  if (likedIds.length > 0) {
    const placeholders = likedIds.map(() => '?').join(',');
    profiles = db.all(
      `SELECT u.id, u.name, u.age, u.gender, p.bio, p.photo, p.location
       FROM users u JOIN profiles p ON u.id = p.user_id
       WHERE u.id NOT IN (${placeholders})
       ORDER BY RANDOM() LIMIT 20`,
      likedIds
    );
  } else {
    profiles = db.all(
      `SELECT u.id, u.name, u.age, u.gender, p.bio, p.photo, p.location
       FROM users u JOIN profiles p ON u.id = p.user_id
       ORDER BY RANDOM() LIMIT 20`
    );
  }

  res.render('swiper', { profiles: JSON.stringify(profiles) });
});

router.post('/swipe', requireAuth, (req, res) => {
  const { swiped_id, direction } = req.body;

  if (req.session.userId === swiped_id) {
    return res.status(400).json({ error: 'Cannot swipe on yourself' });
  }

  db.run(
    'INSERT OR IGNORE INTO swipes (swiper_id, swiped_id, direction) VALUES (?, ?, ?)',
    req.session.userId, swiped_id, direction
  );

  let matched = false;
  if (direction === 'like') {
    const reciprocal = db.get(
      'SELECT id FROM swipes WHERE swiper_id = ? AND swiped_id = ? AND direction = ?',
      [swiped_id, req.session.userId, 'like']
    );

    if (reciprocal) {
      db.run(
        'INSERT OR IGNORE INTO matches (user1_id, user2_id) VALUES (?, ?)',
        Math.min(req.session.userId, swiped_id),
        Math.max(req.session.userId, swiped_id)
      );
      matched = true;
    }
  }

  res.json({ matched });
});

router.get('/profile/edit', requireAuth, (req, res) => {
  const profile = db.get(
    `SELECT u.name, u.email, p.age, p.gender, p.interested_in, p.bio, p.photo, p.location
     FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.id = ?`,
    [req.session.userId]
  );

  res.render('edit-profile', { profile, error: null });
});

router.post('/profile/edit', requireAuth, upload.single('photo'), (req, res) => {
  const { name, age, gender, interested_in, bio, location } = req.body;
  let photo = req.body.current_photo;

  if (req.file) {
    photo = 'uploads/' + req.file.filename;
  }

  db.run('UPDATE users SET name = ?, age = ?, gender = ? WHERE id = ?',
    name, age, gender, req.session.userId);

  db.run(
    'UPDATE profiles SET age = ?, gender = ?, interested_in = ?, bio = ?, photo = ?, location = ? WHERE user_id = ?',
    age, gender, interested_in, bio, photo, location, req.session.userId
  );

  req.session.name = name;
  res.redirect('/swiper');
});

module.exports = router;
