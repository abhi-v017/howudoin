# howudoin — Private Realtime Messaging & Calls

A modern, high-performance, privacy-first web messaging platform built with **Next.js 14, Node.js, Express, TypeScript, PostgreSQL, Socket.io, and WebRTC**. Designed with a pitch-black OLED glassmorphic aesthetic, zero personal data tracking, and authenticated AES-256-GCM encryption at rest.

---

## Features

- **Private & Frictionless Auth**: Sign in with Google or Email/Password. No personal Google profile photos or metadata are ever stored.
- **Privacy-First Avatars**: Curated collection of 16 SVG avatars across 4 categories (Cyber Bots, Personas, Identicons, Abstract) plus custom seed generation.
- **Realtime Chat**: Instant 1-on-1 and group messaging powered by WebSockets (Socket.io), typing indicators, online presence, and message history.
- **WebRTC Voice & Video**: Peer-to-peer audio and video calls with DTLS-SRTP encryption and floating call overlays.
- **Encrypted Message Storage**: Messages stored in PostgreSQL are automatically encrypted with AES-256-GCM (`enc:v1:<iv>:<tag>:<ciphertext>`).
- **Profile & Contact Details**: Interactive contact info modal showing user bio, handle, and unique ID with 1-click copy.
- **Mobile & Android Optimized**: Dynamic viewport height (`100dvh`), notch padding, touch-safe targets, and PWA manifest for home-screen installation.
- **Zero Technical Jargon**: Clean, friendly UI free of developer terms for an effortless user experience.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Socket.io, Prisma ORM, Zod, Multer, Helmet |
| **Database** | PostgreSQL (Neon.tech Serverless / Docker) |
| **Cache & Realtime** | Redis (optional for horizontal scaling; runs standalone in-memory by default) |
| **Security** | AES-256-GCM message encryption, bcrypt password hashing, JWT auth, DTLS-SRTP WebRTC |
| **Hosting** | Vercel (Frontend), Render (Backend), Neon (Database) |

---

## Project Structure

```text
chatApp/
├── frontend/                     # Next.js 14 App Router client
│   ├── public/                   # PWA manifest.json, icons, logos
│   ├── src/
│   │   ├── app/                  # globals.css, layout.tsx, page.tsx
│   │   ├── components/
│   │   │   ├── auth/             # Google & Email AuthModal
│   │   │   ├── chat/             # ChatStage, MessageBubble, MessageInput, UserProfileModal
│   │   │   ├── settings/         # SettingsModal (username, bio, avatar, theme)
│   │   │   ├── sidebar/          # ConversationList, UserProfileDock, NewChatModal
│   │   │   ├── ui/               # Logo, LogoLoader, ThemeSelector
│   │   │   └── webrtc/           # CallOverlay, IncomingCallBanner
│   │   ├── constants/            # Curated preset avatars
│   │   ├── context/              # AuthContext, SocketContext, CallContext
│   │   ├── lib/                  # API client and utility helpers
│   │   └── types/                # TypeScript interfaces
│   └── package.json
│
├── backend/                      # Node.js + Express + Socket.io server
│   ├── prisma/
│   │   └── schema.prisma         # PostgreSQL data models
│   ├── src/
│   │   ├── config/               # Database, Redis, and Environment configs
│   │   ├── controllers/          # Auth, Conversation, Message, User, System controllers
│   │   ├── middlewares/          # AuthGuard, Zod validation, Multer, Error handlers
│   │   ├── routes/               # Modular REST endpoints (/api/v1/*)
│   │   ├── schema/               # Zod request schemas
│   │   ├── services/             # Business logic & Prisma queries
│   │   ├── sockets/              # Chat, presence, and WebRTC socket events
│   │   └── utils/                # AES-256-GCM crypto, JWT, logger, tag generator
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml            # Local container setup (PostgreSQL + Redis + App)
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Docker Desktop)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/abhi-v017/howudoin.git
   cd howudoin
   ```

2. **Start Database & Services** (via Docker):
   ```bash
   docker compose up -d postgres redis
   ```

3. **Configure & Start the Backend**:
   ```bash
   cd backend
   npm install
   ```
   Create `backend/.env`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://chatapp_user:chatapp_password@localhost:5433/chatapp_db?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   MESSAGE_ENCRYPTION_KEY="your-32-char-aes-encryption-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   NODE_ENV="development"
   ```
   Push schema and run:
   ```bash
   npx prisma db push
   npm run dev
   ```

4. **Configure & Start the Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```
   Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
   ```
   Start the dev server:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` in your browser.

---

## Production Deployment (100% Free)

### 1. Database — [Neon.tech](https://neon.tech)
1. Create a free project on Neon and copy your connection string:
   ```text
   postgresql://<user>:<password>@<ep-name>.neon.tech/neondb?sslmode=require
   ```

### 2. Backend — [Render.com](https://render.com)
1. Create a new **Web Service** connected to your repository.
2. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install --include=dev && npm run build && npx prisma db push`
   - **Start Command**: `npm start`
3. Environment Variables:
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
   - `JWT_SECRET`: *(32-char random string)*
   - `MESSAGE_ENCRYPTION_KEY`: *(32-char random string)*
   - `GOOGLE_CLIENT_ID`: *(Your Google OAuth client ID)*
   - `NODE_ENV`: `production`

### 3. Keep Backend Awake 24/7 (Prevent Render Sleep)
Render free services spin down after 15 minutes of inactivity. The backend includes a lightweight 2-byte keep-alive endpoint: `GET /ping`.
- Set up a free monitor on **[UptimeRobot](https://uptimerobot.com)**:
  - **Monitor Type**: `HTTP(s)`
  - **URL**: `https://<your-render-app>.onrender.com/ping`
  - **Interval**: `Every 10 minutes`

### 4. Frontend — [Vercel](https://vercel.com)
1. Import your repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://<your-render-app>.onrender.com/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL`: `https://<your-render-app>.onrender.com`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: `your-google-client-id`
4. Click **Deploy**.

---

## Android App Setup (PWA & APK)

- **Direct Install (No App Store needed)**: Open your live site in Chrome on Android &rarr; tap the three dots &rarr; tap **"Install app"**. It installs as a full-screen, standalone app on your home screen.
- **Generate Standalone APK**: Paste your live Vercel URL into **[PWABuilder](https://www.pwabuilder.com)** and click **"Package for Android"** to download an installable `.apk` file ready to share with friends.

---

## Security Specifications

- **Messages**: Encrypted at rest using **AES-256-GCM** with authenticated verification tags.
- **Passwords**: Salted and hashed with **bcrypt** (10 rounds).
- **Calls**: Peer-to-peer WebRTC voice/video with standard **DTLS-SRTP** encryption.
- **Privacy**: No personal photos or real names are fetched or stored from third-party OAuth providers.

---

## License

This project is open-source and available under the [MIT License](LICENSE).
