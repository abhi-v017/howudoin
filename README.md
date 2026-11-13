# 🚀 howudoin - Realtime Chat Application

A high-performance, privacy-focused open-source chat application built with **Node.js, Express.js, TypeScript, PostgreSQL (SQL), Redis, Socket.io, WebRTC**, and Docker.

---

## 🌟 Key Features

- **🔒 Anonymous & Private Authentication**:
  - Zero emails, zero phone numbers required.
  - Automatically generates a unique anonymous Discriminator Tag (e.g. `Shadow#4829`) and UUID.
  - User connection discovery by unique ID or `username#tag`.
  - Secure bcrypt password hashing and JWT authentication.
- **💬 Realtime Messaging**:
  - 1-on-1 direct conversations and group chats.
  - Sub-millisecond latency powered by Socket.io and Redis pub/sub.
  - Realtime typing indicators, read receipts, and user presence tracking.
- **📹 WebRTC Voice & Video Calls**:
  - Full signaling mechanism (`call:initiate`, `call:accept`, `call:reject`, `call:signal`, `call:end`) over WebSockets.
  - Supports 1-on-1 audio/video calls and group rooms with ICE/SDP negotiation.
- **📁 Media Sharing with Configurable Limits**:
  - Safe file upload pipeline supporting images, voice notes/audio, video, documents, and archives.
  - Built-in HTTP Range header streaming support for video and audio scrubbing.
- **🎨 Theme Switching**:
  - Persisted user theme preferences (`dark`, `light`, `cyberpunk`, `midnight`, `emerald`).
- **🛠️ Built-in Diagnostics & Testing Dashboard**:
  - Live HTTP response time / latency meter.
  - Real-time DB & Redis connectivity monitor.
  - Interactive WebSocket playground to test messaging, presence, and WebRTC signaling directly in your browser.

---

## 🏗️ Clean Project Architecture (Designed for Solo Developer Management)

```
chatApp/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Documented PostgreSQL database schema
│   ├── src/
│   │   ├── config/               # Env vars, Prisma client, Redis client
│   │   ├── controllers/          # HTTP request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── conversation.controller.ts
│   │   │   ├── message.controller.ts
│   │   │   ├── media.controller.ts
│   │   │   └── system.controller.ts
│   │   ├── middlewares/          # Auth guard, Zod validator, Multer upload, Error handler
│   │   ├── routes/               # Modular Express API endpoints (/api/v1/*)
│   │   ├── schema/               # Zod validation schemas
│   │   ├── services/             # Core business logic & database queries
│   │   ├── sockets/              # Socket.io server, presence, chat, and WebRTC handlers
│   │   ├── types/                # TypeScript interfaces and contracts
│   │   ├── utils/                # Logger, JWT, Tag generator, Response helpers
│   │   ├── app.ts                # Express app setup and middleware chain
│   │   └── server.ts             # Server entrypoint (HTTP + WebSockets)
│   ├── public/                   # Diagnostic & Live Testing Dashboard (HTML, JS, CSS)
│   ├── uploads/                  # User uploaded media storage
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml            # Multi-container orchestration (Postgres + Redis + Backend)
└── README.md
```

---

## ⚡ Quick Start

### Option 1: Run with Docker Compose (Recommended)

Make sure Docker Desktop is running, then run:

```bash
docker compose up --build
```

Services started:
- **Backend API & WebSockets**: `http://localhost:5000`
- **Interactive Diagnostics Playground**: `http://localhost:5000/`
- **PostgreSQL**: `localhost:5433` (mapped from container 5432)
- **Redis**: `localhost:6379`

---

### Option 2: Run for Local Development

1. **Start PostgreSQL and Redis** (e.g. via Docker):
   ```bash
   docker compose up -d postgres redis
   ```

2. **Navigate to backend and install dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Initialize the Database Schema**:
   ```bash
   npx prisma db push
   ```
   *(Optional: Run `npx prisma studio` to view your database in a browser GUI)*

4. **Start the Backend Server**:
   ```bash
   npm run dev
   ```

5. **Start the Next.js Frontend Server**:
   Open a new terminal:
   ```bash
   cd frontend
   npm run dev
   ```
   Visit **`http://localhost:3000`** to experience the sleek glassmorphic chat application!

6. **Run the Backend Verification Suite**:
   ```bash
   cd backend
   npm test
   ```

---

## 🛠️ Testing Dashboard

Visit **`http://localhost:5000/`** in your browser.

- **Latency Meter**: Displays live roundtrip response time (ms) to the API.
- **Service Indicators**: Live status of API, PostgreSQL, Redis, and WebSocket connections.
- **Quick Anonymous User Generation**: Click "Generate Random Anonymous User" to obtain an identity (e.g. `Shadow#4829`) and JWT token.
- **Multi-Tab Chat Testing**: Open `http://localhost:5000/` in two separate browser tabs to test realtime messaging, typing indicators, and WebRTC call ringing between two anonymous users!

---

## 📡 API Reference Overview (`/api/v1`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register anonymous user (`username`, `password`) | No |
| `POST` | `/api/v1/auth/login` | Login with `username` / `username#tag` and `password` | No |
| `GET` | `/api/v1/auth/me` | Fetch current user profile | Yes |
| `GET` | `/api/v1/users/search?query=...` | Search users by name or `username#tag` | Yes |
| `PATCH` | `/api/v1/users/profile` | Update bio, avatar, or theme | Yes |
| `GET` | `/api/v1/conversations` | List user's conversations with latest message | Yes |
| `POST` | `/api/v1/conversations/direct` | Start or get 1-on-1 direct conversation | Yes |
| `POST` | `/api/v1/conversations/group` | Create group chat | Yes |
| `POST` | `/api/v1/messages` | Send a message (text or media) | Yes |
| `GET` | `/api/v1/messages/:conversationId` | Get cursor-paginated messages | Yes |
| `POST` | `/api/v1/media/upload` | Upload image, audio, video, or document | Yes |
| `GET` | `/api/v1/media/:filename` | Stream media (supports Range requests) | No |
| `GET` | `/api/v1/system/ping` | Latency ping endpoint | No |
| `GET` | `/api/v1/system/health` | Service health & latency stats | No |

---

## 🔌 WebSocket Events Contract

### Chat Events:
- `conversation:join` (`conversationId`): Join a chat room.
- `conversation:leave` (`conversationId`): Leave a chat room.
- `message:send` (`{ conversationId, content, type, mediaUrl }`): Send a message.
- `message:new`: Broadcasted to conversation members.
- `typing:start` / `typing:stop`: Broadcasted typing indicators.
- `message:read`: Broadcasted read receipts.

### WebRTC Signaling Events:
- `call:initiate` (`{ conversationId, receiverId, callType }`): Initiates call.
- `call:incoming`: Delivers incoming call to receiver.
- `call:accept` / `call:reject`: Answers or declines call.
- `call:signal` (`{ targetUserId, signal }`): Exchanges SDP offer, answer, and ICE candidates.
- `call:end`: Terminates active call.
