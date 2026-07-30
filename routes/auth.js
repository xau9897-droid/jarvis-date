const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { requireAuth, redirectIfAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/login', redirectIfAuth, (req, res) => {
  res.render('login', { error: null });
});

router.get('/signup', redirectIfAuth, (req, res) => {
  res.render('signup', { error: null });
});

router.post('/signup', redirectIfAuth, (req, res) => {
  const { name, email, password, age, gender } = req.body;

  const existing = db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.render('signup', { error: 'Email already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.run(
    'INSERT INTO users (name, email, password, age, gender) VALUES (?, ?, ?, ?, ?)',
    name, email, hashedPassword, age, gender
  );

  db.run(
    'INSERT INTO profiles (user_id, age, gender) VALUES (?, ?, ?)',
    result.lastInsertRowid, age, gender
  );

  req.session.userId = result.lastInsertRowid;
  req.session.name = name;
  res.redirect('/swiper');
});

router.post('/login', redirectIfAuth, (req, res) => {
  const { email, password } = req.body;
  const user = db.get('SELECT * FROM users WHERE email = ?', [email]);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('login', { error: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  req.session.name = user.name;
  res.redirect('/swiper');
});

router.get('/logout', requireAuth, (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
