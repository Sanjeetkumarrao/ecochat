# EchoChat 

A full-stack real-time chat application built with the MERN stack + Socket.io.

## Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Bcryptjs, Socket.io, Cloudinary, Multer  
**Frontend:** React 18, Vite, Tailwind CSS, Axios, React Router v6, Socket.io-client

---

## Features

- JWT Auth with access + refresh token system
- One-to-one private messaging (DM)
- Group chat rooms
- Online / Offline status indicator
- Message read receipts (single & double tick)
- Typing indicators
- File & image sharing via Cloudinary
- In-app notifications
- User search
- Chat history with pagination
- Profile settings

---

## Project Structure

```
ecochat/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── sockets/      ← Socket.io logic
│   │   └── utils/
│   ├── index.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/   ← Sidebar
    │   │   └── chat/
    │   ├── context/      ← AuthContext + SocketContext
    │   ├── layouts/      ← ChatLayout
    │   ├── pages/        ← ChatWindow, GroupChatWindow, Settings...
    │   ├── routes/
    │   └── services/
    └── package.json
```

### 2. Configure environment variables

PORT=8000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ecochat

ACCESS_TOKEN_SECRET=your_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_secret_here
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

### 3. Run the app

```bash
npm run dev

# Frontend 
npm run dev
```

| Resource      | Endpoint               |
|---------------|------------------------|
| Auth / Users  | `/api/v1/users`        |
| Messages      | `/api/v1/messages`     |
| Groups        | `/api/v1/groups`       |
| Notifications | `/api/v1/notifications`|

## Socket Events

| Event                  | Direction       | Description              |
|------------------------|-----------------|--------------------------|
| `message:send`         | Client → Server | Send DM                  |
| `message:receive`      | Server → Client | Receive DM               |
| `group:join`           | Client → Server | Join group room          |
| `group:message`        | Client → Server | Send group message       |
| `group:message:receive`| Server → Client | Receive group message    |
| `typing:start`         | Client → Server | Started typing           |
| `typing:stop`          | Client → Server | Stopped typing           |
| `message:read`         | Client → Server | Mark message read        |
| `user:status`          | Server → Client | Online/offline broadcast |

---

## Deployment

- **Backend:** Render / Railway
- **Frontend:** Netlify / Vercel
- **Database:** MongoDB Atlas
- **Media:** Cloudinary

---

Built by Sanjeet 🚀
