const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./config/database');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const matchRoutes = require('./routes/matches');
const messageRoutes = require('./routes/messages');
const { requireAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'dating-web-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRoutes);
app.use('/', profileRoutes);
app.use('/', matchRoutes);
app.use('/', messageRoutes);

app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/swiper');
  res.redirect('/login');
});

app.get('/logout', requireAuth, (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) return next(new Error('Authentication required'));
  socket.userId = userId;
  next();
});

io.on('connection', (socket) => {
  socket.on('join-chat', (matchId) => {
    socket.join(`chat-${matchId}`);
  });

  socket.on('send-message', ({ matchId, message }) => {
    const match = db.get(
      'SELECT * FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [matchId, socket.userId, socket.userId]
    );

    if (!match) return;

    db.run(
      'INSERT INTO messages (match_id, sender_id, message) VALUES (?, ?, ?)',
      matchId, socket.userId, message
    );

    const msgData = {
      sender_id: socket.userId,
      message,
      created_at: new Date().toISOString()
    };

    io.to(`chat-${matchId}`).emit('new-message', msgData);
  });
});

async function start() {
  await db.getDb();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
