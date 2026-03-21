# Restaurant QR Code Menu SaaS

A SaaS platform for restaurants to create digital QR code menus.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Firebase project
- Cashfree account (test mode)
- Cloudinary account

### Setup

1. **Clone and install dependencies:**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. **Configure environment variables:**

```bash
# Server - copy and edit .env
cd server
cp .env.example .env
# Edit .env with your credentials

# Client - copy and edit .env.local
cd ../client
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials
```

3. **Start development servers:**

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

4. **Open in browser:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health

## 📁 Project Structure

```
├── client/                  # Next.js frontend
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   ├── context/        # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities & API
│   └── .env.local
│
├── server/                  # Express backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── .env
│
└── prd.md                  # Product requirements
```

## 🔑 Environment Variables

### Server (.env)

| Variable                | Description                     |
| ----------------------- | ------------------------------- |
| `MONGODB_URI`           | MongoDB connection string       |
| `FIREBASE_PROJECT_ID`   | Firebase project ID             |
| `FIREBASE_PRIVATE_KEY`  | Firebase admin private key      |
| `FIREBASE_CLIENT_EMAIL` | Firebase admin email            |
| `CASHFREE_CLIENT_ID`    | Cashfree client ID              |
| `CASHFREE_CLIENT_SECRET`| Cashfree client secret          |
| `CASHFREE_ENV`          | TEST or PRODUCTION              |
| `CLOUDINARY_*`          | Cloudinary credentials          |
| `CLIENT_URL`            | Frontend URL                    |

### Client (.env.local)

| Variable                             | Description            |
| ------------------------------------ | ---------------------- |
| `NEXT_PUBLIC_FIREBASE_*`             | Firebase client config |
| `NEXT_PUBLIC_API_URL`                | Backend API URL        |

## 🧪 Testing

```bash
# Test API health
curl http://localhost:5000/api/health
```

## 📦 Deployment

### Frontend (Vercel)

```bash
cd client
npx vercel
```

### Backend (Railway/Render)

Deploy the `server` folder with environment variables configured.

## 📄 License

MIT
