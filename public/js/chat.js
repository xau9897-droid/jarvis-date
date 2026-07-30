const socket = io({ auth: { userId } });
const messagesContainer = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

socket.emit('join-chat', matchId);

messages.forEach(msg => appendMessage(msg));

function appendMessage(msg) {
  const div = document.createElement('div');
  const isSent = msg.sender_id == userId;
  div.className = `message ${isSent ? 'sent' : 'received'}`;
  const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  div.innerHTML = `${msg.message}<div class="time">${time}</div>`;
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  socket.emit('send-message', { matchId, message });
  messageInput.value = '';
}

socket.on('new-message', (msg) => {
  appendMessage(msg);
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
