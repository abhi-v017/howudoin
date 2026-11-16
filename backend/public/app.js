// ChatApp Diagnostics & Testing Dashboard

const state = {
  token: localStorage.getItem('chatapp_test_token') || null,
  user: JSON.parse(localStorage.getItem('chatapp_test_user') || 'null'),
  socket: null,
  activeConversation: null,
  activeCall: null,
  theme: localStorage.getItem('chatapp_theme') || 'dark',
};

// Apply saved theme
document.documentElement.setAttribute('data-theme', state.theme);

// DOM Elements
const apiLatencyEl = document.getElementById('api-latency');
const valApiEl = document.getElementById('val-api');
const valUptimeEl = document.getElementById('val-uptime');
const valDbEl = document.getElementById('val-db');
const valDbLatencyEl = document.getElementById('val-db-latency');
const valRedisEl = document.getElementById('val-redis');
const valRedisLatencyEl = document.getElementById('val-redis-latency');
const valWsEl = document.getElementById('val-ws');
const valWsUsersEl = document.getElementById('val-ws-users');

const indApi = document.getElementById('ind-api');
const indDb = document.getElementById('ind-db');
const indRedis = document.getElementById('ind-redis');
const indWs = document.getElementById('ind-ws');

const eventLogsEl = document.getElementById('event-logs');

// Helper Logger
function log(msg, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString();
  entry.textContent = `[${time}] ${msg}`;
  eventLogsEl.appendChild(entry);
  eventLogsEl.scrollTop = eventLogsEl.scrollHeight;
}

document.getElementById('btn-clear-logs').addEventListener('click', () => {
  eventLogsEl.innerHTML = '';
});

// Theme Switcher
document.getElementById('theme-toggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('chatapp_theme', state.theme);
  log(`Switched UI theme to ${state.theme}`, 'info');
});

// 1. Diagnostics & Latency Ping
async function checkPingAndHealth() {
  const start = performance.now();
  try {
    const pingRes = await fetch('/api/v1/system/ping');
    const latency = Math.round(performance.now() - start);

    if (pingRes.ok) {
      apiLatencyEl.textContent = `${latency} ms`;
      indApi.className = 'indicator ok';
      valApiEl.textContent = 'Operational';

      if (latency < 30) {
        apiLatencyEl.style.color = 'var(--success)';
      } else if (latency < 100) {
        apiLatencyEl.style.color = 'var(--warning)';
      } else {
        apiLatencyEl.style.color = 'var(--danger)';
      }
    } else {
      indApi.className = 'indicator err';
      valApiEl.textContent = 'Degraded';
    }
  } catch (e) {
    indApi.className = 'indicator err';
    valApiEl.textContent = 'Offline';
    apiLatencyEl.textContent = 'N/A';
  }

  // Check detailed health
  try {
    const healthRes = await fetch('/api/v1/system/health');
    const health = await healthRes.json();

    if (health.success && health.data) {
      const data = health.data;
      valUptimeEl.textContent = `Uptime: ${data.uptimeSec}s | Node: ${data.system.nodeVersion}`;

      // DB Status
      if (data.database.status === 'connected') {
        indDb.className = 'indicator ok';
        valDbEl.textContent = 'Connected';
        valDbLatencyEl.textContent = `DB Latency: ${data.database.latencyMs} ms`;
      } else {
        indDb.className = 'indicator warn';
        valDbEl.textContent = 'Disconnected';
        valDbLatencyEl.textContent = data.database.error ? data.database.error.slice(0, 35) + '...' : 'Check Docker';
      }

      // Redis Status
      if (data.redis.status === 'connected') {
        indRedis.className = 'indicator ok';
        valRedisEl.textContent = 'Connected';
        valRedisLatencyEl.textContent = `Redis Latency: ${data.redis.latencyMs} ms`;
      } else {
        indRedis.className = 'indicator warn';
        valRedisEl.textContent = 'Standby (Offline)';
        valRedisLatencyEl.textContent = 'In-memory fallback active';
      }

      // Socket Stats
      if (data.sockets) {
        valWsUsersEl.textContent = `Active: ${data.sockets.totalConnections} conns (${data.sockets.distinctUsers} users)`;
      }
    }
  } catch (e) {}
}

// Start ping timer every 3.5s
checkPingAndHealth();
setInterval(checkPingAndHealth, 3500);

// 2. Auth & User Profile Management
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabBtns.forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

function renderUserCard() {
  const box = document.getElementById('active-user-box');
  if (state.user && state.token) {
    box.style.display = 'block';
    const cleanUsername = state.user.username || state.user.displayName?.split('#')[0] || 'User';
    const shortId = state.user.uniqueId || state.user.id;

    document.getElementById('user-avatar').src = state.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
    document.getElementById('user-display-name').textContent = cleanUsername;
    document.getElementById('user-id').textContent = `Unique ID: ${shortId}`;
    document.getElementById('user-token').value = state.token;

    // Enable chat input
    document.getElementById('chat-input').disabled = false;
    document.getElementById('btn-send-message').disabled = false;
    document.getElementById('btn-call-voice').disabled = false;
    document.getElementById('btn-call-video').disabled = false;
  } else {
    box.style.display = 'none';
    document.getElementById('chat-input').disabled = true;
    document.getElementById('btn-send-message').disabled = true;
    document.getElementById('btn-call-voice').disabled = true;
    document.getElementById('btn-call-video').disabled = true;
  }
}

document.getElementById('btn-copy-token').addEventListener('click', () => {
  navigator.clipboard.writeText(state.token);
  log('Token copied to clipboard', 'info');
});

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('chatapp_test_token');
  localStorage.removeItem('chatapp_test_user');
  state.token = null;
  state.user = null;
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
  renderUserCard();
  log('User logged out', 'warn');
});

// Register User with Email
document.getElementById('btn-register').addEventListener('click', async () => {
  const email = document.getElementById('reg-email').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!email || !username || !password) return alert('Email, username and password required');

  log(`Attempting registration for ${email}...`, 'info');

  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    state.token = data.data.token;
    state.user = data.data.user;
    localStorage.setItem('chatapp_test_token', state.token);
    localStorage.setItem('chatapp_test_user', JSON.stringify(state.user));

    renderUserCard();
    connectSocket();
    log(`Registered successfully as ${state.user.username} (${state.user.email})`, 'success');
  } catch (err) {
    log(`Register Error: ${err.message}`, 'error');
  }
});

// Manual Login with Email or Username
document.getElementById('btn-login').addEventListener('click', async () => {
  const identifier = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!identifier || !password) return alert('Email/username and password required');

  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    state.token = data.data.token;
    state.user = data.data.user;
    localStorage.setItem('chatapp_test_token', state.token);
    localStorage.setItem('chatapp_test_user', JSON.stringify(state.user));

    renderUserCard();
    connectSocket();
    log(`Logged in as ${state.user.username} (Unique ID: ${state.user.uniqueId || state.user.id})`, 'success');
  } catch (err) {
    log(`Login Error: ${err.message}`, 'error');
  }
});

// Manual Register
document.getElementById('btn-register').addEventListener('click', async () => {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!username || !password) return alert('Username and password required');

  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    state.token = data.data.token;
    state.user = data.data.user;
    localStorage.setItem('chatapp_test_token', state.token);
    localStorage.setItem('chatapp_test_user', JSON.stringify(state.user));

    renderUserCard();
    connectSocket();
    log(`Registered as ${state.user.username} (Unique ID: ${state.user.uniqueId || state.user.id})`, 'success');
  } catch (err) {
    log(`Registration Error: ${err.message}`, 'error');
  }
});

// 3. WebSocket Connection & Event Handlers
function connectSocket() {
  if (!state.token) return;

  if (typeof io === 'undefined') {
    log('Waiting for Socket.io library to initialize...', 'warn');
    setTimeout(connectSocket, 1000);
    return;
  }

  if (state.socket) {
    state.socket.disconnect();
  }

  log('Connecting to WebSocket...', 'info');

  state.socket = io({
    auth: { token: state.token },
    transports: ['websocket', 'polling'],
  });

  state.socket.on('connect', () => {
    indWs.className = 'indicator ok';
    valWsEl.textContent = 'Connected';
    log(`WebSocket Connected. Socket ID: ${state.socket.id}`, 'success');

    // If active conversation exists, join its room
    if (state.activeConversation) {
      state.socket.emit('conversation:join', state.activeConversation.id);
    }
  });

  state.socket.on('disconnect', () => {
    indWs.className = 'indicator err';
    valWsEl.textContent = 'Disconnected';
    log('WebSocket Disconnected', 'warn');
  });

  state.socket.on('connect_error', (err) => {
    indWs.className = 'indicator err';
    valWsEl.textContent = 'Error';
    log(`WebSocket Connection Error: ${err.message}`, 'error');
  });

  // Realtime Incoming Message
  state.socket.on('message:new', (message) => {
    log(`[Chat] New message from ${message.sender?.username || 'User'}: ${message.content || '[Media]'}`, 'info');
    if (state.activeConversation && message.conversationId === state.activeConversation.id) {
      appendChatMessage(message);
    }
  });

  // Typing Status
  state.socket.on('typing:status', (data) => {
    if (state.activeConversation && data.conversationId === state.activeConversation.id) {
      const typingBox = document.getElementById('typing-box');
      if (data.isTyping) {
        document.getElementById('typing-text').textContent = `${data.username} is typing...`;
        typingBox.style.display = 'block';
      } else {
        typingBox.style.display = 'none';
      }
    }
  });

  // WebRTC Incoming Call
  state.socket.on('call:incoming', (call) => {
    log(`[WebRTC] Incoming ${call.callType} call from ${call.caller.username}!`, 'warn');
    state.activeCall = call;
    document.getElementById('incoming-call-type').textContent = call.callType;
    document.getElementById('incoming-caller-name').textContent = `Caller: ${call.caller.username}`;
    document.getElementById('incoming-call-box').style.display = 'block';
  });

  state.socket.on('call:accepted', (data) => {
    log(`[WebRTC] Call accepted by ${data.acceptedBy.username}! Call active.`, 'success');
    document.getElementById('call-status-banner').textContent = `Call Active with ${data.acceptedBy.username}`;
    document.getElementById('btn-end-call').style.display = 'inline-block';
  });

  state.socket.on('call:rejected', (data) => {
    log(`[WebRTC] Call declined by ${data.rejectedBy.username}`, 'warn');
    document.getElementById('call-status-banner').textContent = 'Call Declined';
    setTimeout(() => {
      document.getElementById('call-status-banner').textContent = 'Call Status: Idle';
    }, 3000);
  });

  state.socket.on('call:signal', (data) => {
    log(`[WebRTC Signal] Received signal from ${data.senderUsername} (Type: ${data.signal?.type || 'candidate'})`, 'info');
  });

  state.socket.on('call:ended', (data) => {
    log('[WebRTC] Call ended.', 'warn');
    document.getElementById('incoming-call-box').style.display = 'none';
    document.getElementById('btn-end-call').style.display = 'none';
    document.getElementById('call-status-banner').textContent = 'Call Status: Idle';
    state.activeCall = null;
  });
}

document.getElementById('btn-connect-ws').addEventListener('click', connectSocket);

// 4. Conversation & Messaging
document.getElementById('btn-start-direct').addEventListener('click', async () => {
  const recipientInput = document.getElementById('direct-recipient').value.trim();
  if (!recipientInput) return alert('Enter recipient username#tag or UUID');

  let body = {};
  if (recipientInput.includes('#')) {
    const [recipientUsername, recipientTag] = recipientInput.split('#');
    body = { recipientUsername, recipientTag };
  } else {
    body = { recipientId: recipientInput };
  }

  try {
    log(`Initiating 1-on-1 direct conversation with ${recipientInput}...`, 'info');
    const res = await fetch('/api/v1/conversations/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to start conversation');

    setActiveConversation(data.data);
    log('Direct conversation active!', 'success');
  } catch (err) {
    log(`Start Chat Error: ${err.message}`, 'error');
  }
});

// Create Group
document.getElementById('btn-create-group').addEventListener('click', async () => {
  const groupTitle = prompt('Enter Group Name:');
  if (!groupTitle) return;

  try {
    const res = await fetch('/api/v1/conversations/group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({ title: groupTitle }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create group');

    setActiveConversation(data.data);
    log(`Group "${groupTitle}" created!`, 'success');
  } catch (err) {
    log(`Create Group Error: ${err.message}`, 'error');
  }
});

function setActiveConversation(conv) {
  state.activeConversation = conv;
  const title = conv.type === 'DIRECT' ? (conv.displayTitle || 'Direct Chat') : `[Group] ${conv.title}`;
  document.getElementById('active-conv-title').textContent = title;

  // Clear messages container
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';

  // Join socket room
  if (state.socket) {
    state.socket.emit('conversation:join', conv.id);
  }

  // Load existing messages
  loadMessages(conv.id);
}

async function loadMessages(conversationId) {
  try {
    const res = await fetch(`/api/v1/messages/${conversationId}?limit=50`, {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    const data = await res.json();
    if (data.success && data.data.messages) {
      data.data.messages.forEach(appendChatMessage);
    }
  } catch (err) {
    log(`Load Messages Error: ${err.message}`, 'error');
  }
}

function appendChatMessage(msg) {
  const container = document.getElementById('chat-messages');
  const isMine = state.user && msg.senderId === state.user.id;

  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${isMine ? 'msg-outgoing' : 'msg-incoming'}`;

  const header = document.createElement('div');
  header.className = 'msg-header';
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  header.textContent = `${msg.sender?.username || 'User'} • ${time}`;
  bubble.appendChild(header);

  if (msg.content) {
    const content = document.createElement('div');
    content.textContent = msg.content;
    bubble.appendChild(content);
  }

  if (msg.mediaUrl) {
    if (msg.type === 'IMAGE') {
      const img = document.createElement('img');
      img.src = msg.mediaUrl;
      img.className = 'msg-media-preview';
      bubble.appendChild(img);
    } else if (msg.type === 'AUDIO') {
      const audio = document.createElement('audio');
      audio.src = msg.mediaUrl;
      audio.controls = true;
      audio.className = 'msg-media-preview';
      bubble.appendChild(audio);
    } else if (msg.type === 'VIDEO') {
      const video = document.createElement('video');
      video.src = msg.mediaUrl;
      video.controls = true;
      video.className = 'msg-media-preview';
      bubble.appendChild(video);
    } else {
      const docLink = document.createElement('a');
      docLink.href = msg.mediaUrl;
      docLink.target = '_blank';
      docLink.textContent = `📄 Download File (${msg.mediaName || 'Attachment'})`;
      docLink.style.color = '#fff';
      bubble.appendChild(docLink);
    }
  }

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

// Send Message
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const content = input.value.trim();
  if (!content || !state.activeConversation) return;

  input.value = '';

  // Use WebSocket if connected, fallback to REST
  if (state.socket && state.socket.connected) {
    state.socket.emit('message:send', {
      conversationId: state.activeConversation.id,
      content,
      type: 'TEXT',
    });
  } else {
    try {
      const res = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          conversationId: state.activeConversation.id,
          content,
          type: 'TEXT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        appendChatMessage(data.data);
      }
    } catch (err) {
      log(`Send Error: ${err.message}`, 'error');
    }
  }
}

document.getElementById('btn-send-message').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Typing Indicator Emission
let typingTimeout = null;
document.getElementById('chat-input').addEventListener('input', () => {
  if (!state.socket || !state.activeConversation) return;

  state.socket.emit('typing:start', { conversationId: state.activeConversation.id });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    state.socket.emit('typing:stop', { conversationId: state.activeConversation.id });
  }, 1500);
});

// 5. Media Upload
document.getElementById('media-file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !state.activeConversation) return;

  const uploadBox = document.getElementById('upload-status');
  const progressFill = document.getElementById('progress-fill');
  const statusText = document.getElementById('upload-status-text');

  uploadBox.style.display = 'block';
  progressFill.style.width = '20%';
  statusText.textContent = `Uploading ${file.name} (${Math.round(file.size / 1024)} KB)...`;

  const formData = new FormData();
  formData.append('file', file);

  try {
    progressFill.style.width = '60%';
    const res = await fetch('/api/v1/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'File upload failed');

    progressFill.style.width = '100%';
    statusText.textContent = 'Upload complete! Sending message...';

    // Send as message with media
    const media = data.data;
    if (state.socket && state.socket.connected) {
      state.socket.emit('message:send', {
        conversationId: state.activeConversation.id,
        content: '',
        type: media.type,
        mediaUrl: media.mediaUrl,
        mediaName: media.originalName,
        mediaSize: media.size,
        mediaMimeType: media.mimeType,
      });
    }

    setTimeout(() => {
      uploadBox.style.display = 'none';
      progressFill.style.width = '0%';
    }, 1200);

    log(`File "${media.originalName}" uploaded (${media.type})`, 'success');
  } catch (err) {
    statusText.textContent = `Upload Error: ${err.message}`;
    log(`Media Upload Error: ${err.message}`, 'error');
  }
});

// 6. WebRTC Voice / Video Controls
function initiateCall(callType) {
  if (!state.activeConversation || !state.socket) {
    return alert('Please select an active conversation first');
  }

  log(`[WebRTC] Initiating ${callType} call...`, 'info');
  document.getElementById('call-status-banner').textContent = `Calling (${callType})... Ringing...`;
  document.getElementById('btn-end-call').style.display = 'inline-block';

  // In 1-on-1, find receiver
  let receiverId = undefined;
  if (state.activeConversation.type === 'DIRECT' && state.activeConversation.members) {
    const otherMember = state.activeConversation.members.find((m) => m.userId !== state.user.id);
    if (otherMember) receiverId = otherMember.userId;
  }

  state.socket.emit(
    'call:initiate',
    {
      conversationId: state.activeConversation.id,
      receiverId,
      callType,
    },
    (res) => {
      if (res && res.success) {
        state.activeCall = { callId: res.callId, conversationId: state.activeConversation.id };
        log(`[WebRTC] Call Session registered: ${res.callId}`, 'success');
      }
    }
  );
}

document.getElementById('btn-call-voice').addEventListener('click', () => initiateCall('AUDIO'));
document.getElementById('btn-call-video').addEventListener('click', () => initiateCall('VIDEO'));

// Accept Call
document.getElementById('btn-accept-call').addEventListener('click', () => {
  if (!state.activeCall || !state.socket) return;
  state.socket.emit('call:accept', {
    callId: state.activeCall.callId,
    callerId: state.activeCall.caller.id,
  });
  document.getElementById('incoming-call-box').style.display = 'none';
  document.getElementById('call-status-banner').textContent = `Call Active with ${state.activeCall.caller.username}`;
  document.getElementById('btn-end-call').style.display = 'inline-block';
  log('[WebRTC] Accepted call!', 'success');
});

// Reject Call
document.getElementById('btn-reject-call').addEventListener('click', () => {
  if (!state.activeCall || !state.socket) return;
  state.socket.emit('call:reject', {
    callId: state.activeCall.callId,
    callerId: state.activeCall.caller.id,
  });
  document.getElementById('incoming-call-box').style.display = 'none';
  state.activeCall = null;
  log('[WebRTC] Rejected call', 'info');
});

// End Call
document.getElementById('btn-end-call').addEventListener('click', () => {
  if (!state.socket) return;
  state.socket.emit('call:end', {
    callId: state.activeCall?.callId,
    conversationId: state.activeConversation?.id,
  });
  document.getElementById('btn-end-call').style.display = 'none';
  document.getElementById('call-status-banner').textContent = 'Call Status: Idle';
  state.activeCall = null;
  log('[WebRTC] Ended call', 'info');
});

// Initialize on Load
renderUserCard();
if (state.token) {
  connectSocket();
}
