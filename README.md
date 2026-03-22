# 🍽️ Restaurant QR Code Menu SaaS

A premium, full-stack SaaS platform empowering restaurants to create stunning, interactive digital menus accessible via instant QR codes. Built for performance, responsiveness, and a high-end customer experience.

## ✨ Key Features

### 💎 SaaS Subscription Lifecycle
- **7-Day Auto-Trial:** Instant access for new restaurants with automated trial period tracking.
- **Smart Enforcement:** Automated dashboard warning banners and public menu locking upon expiry.
- **Billing Integration:** Seamless, non-recurring payment processing via Cashfree.
- **Automated CRM:** Lifecycle email notifications (Activation, Reminders, Expiry) powered by Nodemailer and Daily Cron jobs.

### 📱 Premium Mobile-First Experience
- **Native-App Feel:** A reconstructed dashboard featuring a sleek **Mobile Bottom Navigation** and glassy drawers.
- **Responsive Stats:** High-impact analytics and management grids optimized for every screen size.
- **Sticky Operations:** Category-based sticky headers for effortless management of large menus.

### 🍱 Immersive Diner Interface
- **High-End Visuals:** Immersive restaurant headers with support for logos and branding.
- **Touch-Optimized:** Large touch targets, intuitive category sliders, and a frictionless feedback system.
- **Accessibility:** Full safe-area support for modern mobile browsers.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project (Auth)
- Cashfree account
- Cloudinary account (Image hosting)

### 🛠️ Setup

1. **Clone and Install:**
```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

2. **Environment Configuration:**
```bash
# Server
cp server/.env.example server/.env
# Client
cp client/.env.example client/.env.local
```

3. **Development Mode:**
```bash
# Terminal 1 (Backend)
cd server && npm run dev

# Terminal 2 (Frontend)
cd client && npm run dev
```

## 📁 Architecture

```
├── client/                  # Next.js (Tailwind + Lucide)
│   └── src/app/menu/[slug] # High-end Public Menu
├── server/                  # Node.js + Express
│   ├── cron/               # Daily Expiry & Email Jobs
│   └── services/           # Email & Payment Logic
└── prd.md                  # Product Specification
```

## 📦 Deployment

- **Frontend:** Vercel (Auto-deploy via GitHub)
- **Backend:** Render / Railway (Configure with `npm start`)

## 📄 License
MIT
