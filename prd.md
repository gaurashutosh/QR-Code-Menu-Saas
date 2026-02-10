# Product Requirements Document (PRD)

## Product Name

**Restaurant QR Code Menu SaaS**

---

## 1. Overview

### 1.1 Purpose

This document defines the requirements for a SaaS-based Restaurant QR Code Menu system. The goal is to provide restaurants with a digital, easy-to-manage menu accessible via QR codes, while enabling the platform owner (developer) to monetize the service through subscriptions.

### 1.2 Problem Statement

Traditional physical menus are expensive to print, difficult to update, unhygienic, and inefficient. Restaurants need a simple digital solution to display menus that can be updated instantly without reprinting.

### 1.3 Solution

A centralized platform where restaurant owners can create accounts, manage menus, and generate QR codes. Customers scan the QR code to view the menu instantly without installing any app or logging in.

---

## 2. Target Users

| User Type         | Description                        |
| ----------------- | ---------------------------------- |
| Restaurant Owners | Manage menus and subscriptions     |
| Customers         | View restaurant menus via QR code  |
| Admin / Developer | Monitor platform usage and revenue |

---

## 3. User Roles & Permissions

| Role             | Permissions                                            |
| ---------------- | ------------------------------------------------------ |
| Customer         | View menu only (read-only, no authentication required) |
| Restaurant Owner | Manage menu, QR code, subscription, restaurant profile |
| Admin            | View analytics, manage restaurants, platform settings  |

---

## 4. Features & Requirements

### 4.1 Authentication

- Restaurant owners can sign up and log in
- Secure authentication handled via third-party auth provider (e.g., Firebase Auth, Auth0)
- Password reset functionality
- OAuth support (Google, Email/Password)
- Customers do not require login

---

### 4.2 Restaurant Owner Dashboard

**Features:**

- Create and update restaurant profile (name, address, phone, opening hours)
- Upload restaurant logo
- Customize menu theme/colors
- Add, edit, and delete menu items
- Upload menu item images
- Organize menu by categories
- Set price and availability
- Veg / Non-Veg indicator
- Enable / disable menu items
- Bulk import/export menu items (CSV)
- Preview customer-facing menu
- View subscription status
- Download QR code in multiple formats

---

### 4.3 Menu Management

**Menu Item Fields:**

| Field        | Type    | Required | Description                                 |
| ------------ | ------- | -------- | ------------------------------------------- |
| Name         | String  | Yes      | Item name                                   |
| Description  | String  | No       | Brief description of the item               |
| Category     | String  | Yes      | Menu category (e.g., Starters, Main Course) |
| Price        | Number  | Yes      | Item price in INR                           |
| Variants     | Array   | No       | Size/portion variants with different prices |
| Image URL    | String  | No       | Image of the item                           |
| Is Veg       | Boolean | Yes      | Vegetarian indicator                        |
| Is Available | Boolean | Yes      | Current availability status                 |
| Sort Order   | Number  | No       | Display order within category               |
| Tags         | Array   | No       | Special tags (Bestseller, Spicy, New)       |

**Requirements:**

- Menu updates should reflect instantly
- QR code should not change on menu updates
- Support for daily specials/featured items
- Category-level enable/disable

---

### 4.4 QR Code System

- Unique QR code per restaurant
- QR opens a public menu URL (e.g., `/menu/:slug` or `/menu/:id`)
- QR code remains static unless regenerated
- Option to regenerate QR code (with warning about URL change)
- Download QR in PNG, PDF formats
- QR code with restaurant logo overlay (branded QR)
- Table-specific QR codes (future scope)

---

### 4.5 Customer Menu View

**Design Requirements:**

- Mobile-first responsive design
- No authentication required
- Fast loading (< 3 seconds on 3G)
- PWA support for offline viewing

**Features:**

- Menu search functionality
- Filter by category, veg/non-veg
- Language support (English + Hindi, configurable)
- Display out-of-stock items as disabled or hidden (configurable)
- Restaurant info header (logo, name, address, hours)
- Share menu link

**URL Structure:**

```
/menu/:restaurantSlug  (e.g., /menu/tasty-bites-mumbai)
```

---

### 4.6 Subscription & Payments

**Plan Structure:**

| Plan          | Duration | Price  | Features                                         |
| ------------- | -------- | ------ | ------------------------------------------------ |
| Free Trial    | 7 Days   | ₹0     | All features, limited to trial period            |
| Basic Monthly | 30 Days  | ₹199   | 50 menu items, basic analytics                   |
| Pro Monthly   | 30 Days  | ₹299   | Unlimited items, full analytics, custom branding |
| Basic Yearly  | 365 Days | ₹1,999 | Basic features, 2 months free                    |
| Pro Yearly    | 365 Days | ₹2,999 | Pro features, 2 months free                      |

**Requirements:**

- Subscription-based access for restaurants
- Monthly and yearly plans
- Free trial (7 days, no card required)
- Automatic subscription expiry handling
- Menu shows "Subscription Expired" message on non-payment
- Grace period of 3 days after expiry
- Payment reminders via email (7 days before, 3 days before, on expiry)
- Payment gateway integration (Razorpay recommended for India)

---

### 4.7 Admin Dashboard

**Admin Features:**

| Feature               | Description                                   |
| --------------------- | --------------------------------------------- |
| Restaurant Management | List, search, view details of all restaurants |
| Subscription Overview | Active vs inactive, expiring soon             |
| Revenue Analytics     | Daily, monthly, yearly revenue                |
| Menu Scan Statistics  | Total scans, scans per restaurant             |
| User Management       | View registered users                         |
| System Health         | API performance, error logs                   |

---

## 5. API Design

### 5.1 Authentication APIs

```
POST   /api/auth/signup          # Register new restaurant owner
POST   /api/auth/login           # Login
POST   /api/auth/logout          # Logout
POST   /api/auth/forgot-password # Request password reset
POST   /api/auth/reset-password  # Reset password with token
GET    /api/auth/me              # Get current user
```

### 5.2 Restaurant APIs

```
POST   /api/restaurants          # Create restaurant
GET    /api/restaurants/:id      # Get restaurant details
PUT    /api/restaurants/:id      # Update restaurant
DELETE /api/restaurants/:id      # Delete restaurant (soft delete)
POST   /api/restaurants/:id/logo # Upload restaurant logo
```

### 5.3 Menu APIs

```
POST   /api/menu                    # Create menu item
GET    /api/menu/:restaurantId      # Get all menu items for restaurant
GET    /api/menu/item/:menuId       # Get single menu item
PUT    /api/menu/:menuId            # Update menu item
DELETE /api/menu/:menuId            # Delete menu item
POST   /api/menu/:menuId/image      # Upload menu item image
PATCH  /api/menu/:menuId/toggle     # Toggle availability
POST   /api/menu/bulk-import        # Import menu from CSV
GET    /api/menu/bulk-export        # Export menu to CSV
```

### 5.4 Category APIs

```
GET    /api/categories/:restaurantId    # Get categories for restaurant
POST   /api/categories                  # Create category
PUT    /api/categories/:categoryId      # Update category
DELETE /api/categories/:categoryId      # Delete category
PATCH  /api/categories/reorder          # Reorder categories
```

### 5.5 QR Code APIs

```
GET    /api/qr/:restaurantId         # Get QR code for restaurant
POST   /api/qr/regenerate            # Regenerate QR code (new URL)
GET    /api/qr/:restaurantId/download # Download QR code as image
```

### 5.6 Public Menu APIs (No Auth Required)

```
GET    /api/public/menu/:slug       # Get public menu by restaurant slug
GET    /api/public/restaurant/:slug # Get public restaurant info
POST   /api/public/menu/:slug/scan  # Record menu scan (analytics)
```

### 5.7 Subscription APIs

```
POST   /api/subscription/create        # Create subscription order
POST   /api/subscription/verify        # Verify payment
POST   /api/subscription/webhook       # Payment gateway webhook
GET    /api/subscription/status        # Get subscription status
GET    /api/subscription/history       # Get payment history
POST   /api/subscription/cancel        # Cancel subscription
```

### 5.8 Admin APIs

```
GET    /api/admin/stats                # Dashboard statistics
GET    /api/admin/restaurants          # List all restaurants
GET    /api/admin/restaurants/:id      # Restaurant details (admin view)
PATCH  /api/admin/restaurants/:id      # Update restaurant (admin)
GET    /api/admin/subscriptions        # List all subscriptions
GET    /api/admin/revenue              # Revenue analytics
GET    /api/admin/scans                # Scan analytics
```

---

## 6. Database Models

### 6.1 User

```javascript
User {
  _id: ObjectId
  email: String (unique, required)
  password: String (hashed, optional for OAuth)
  authProvider: String (local, google)
  authProviderId: String
  role: String (owner, admin)
  isEmailVerified: Boolean
  createdAt: Date
  updatedAt: Date
}
```

### 6.2 Restaurant

```javascript
Restaurant {
  _id: ObjectId
  ownerId: ObjectId (ref: User)
  name: String (required)
  slug: String (unique, auto-generated)
  description: String
  address: String
  phone: String
  email: String
  logoUrl: String
  themeColor: String (hex code)
  openingHours: {
    monday: { open: String, close: String, closed: Boolean }
    // ... other days
  }
  socialLinks: {
    instagram: String
    facebook: String
  }
  isActive: Boolean (default: true)
  qrCodeUrl: String
  menuViewCount: Number
  createdAt: Date
  updatedAt: Date
}
```

### 6.3 Category

```javascript
Category {
  _id: ObjectId
  restaurantId: ObjectId (ref: Restaurant)
  name: String (required)
  description: String
  sortOrder: Number
  isActive: Boolean
  createdAt: Date
  updatedAt: Date
}
```

### 6.4 MenuItem

```javascript
MenuItem {
  _id: ObjectId
  restaurantId: ObjectId (ref: Restaurant)
  categoryId: ObjectId (ref: Category)
  name: String (required)
  description: String
  price: Number (required)
  variants: [{
    name: String (e.g., "Half", "Full", "Small")
    price: Number
  }]
  imageUrl: String
  isVeg: Boolean (required)
  isAvailable: Boolean (default: true)
  isFeatured: Boolean (default: false)
  tags: [String]
  sortOrder: Number
  createdAt: Date
  updatedAt: Date
}
```

### 6.5 Subscription

```javascript
Subscription {
  _id: ObjectId
  restaurantId: ObjectId (ref: Restaurant)
  userId: ObjectId (ref: User)
  plan: String (trial, basic_monthly, pro_monthly, basic_yearly, pro_yearly)
  status: String (active, expired, cancelled, pending)
  paymentGatewayCustomerId: String
  paymentGatewaySubscriptionId: String
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEndsAt: Date
  cancelledAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### 6.6 Payment

```javascript
Payment {
  _id: ObjectId
  subscriptionId: ObjectId (ref: Subscription)
  restaurantId: ObjectId (ref: Restaurant)
  amount: Number
  currency: String (INR)
  status: String (pending, success, failed, refunded)
  paymentGatewayOrderId: String
  paymentGatewayPaymentId: String
  paymentMethod: String
  receiptUrl: String
  createdAt: Date
}
```

### 6.7 MenuScan (Analytics)

```javascript
MenuScan {
  _id: ObjectId
  restaurantId: ObjectId (ref: Restaurant)
  timestamp: Date
  userAgent: String
  ipAddress: String (hashed for privacy)
  referrer: String
}
```

---

## 7. Non-Functional Requirements

| Requirement             | Target                                            |
| ----------------------- | ------------------------------------------------- |
| **Availability**        | 99.9% uptime for public menu                      |
| **Performance**         | Menu load time < 3 seconds on 3G                  |
| **Scalability**         | Support 10,000+ restaurants                       |
| **Security**            | HTTPS, rate limiting, input validation            |
| **Data Protection**     | Encrypted passwords, GDPR-compliant data handling |
| **Mobile Optimization** | Mobile-first design, touch-friendly               |
| **SEO**                 | Public menus should be indexable                  |
| **Caching**             | CDN for images, Redis for API caching             |

---

## 8. Tech Stack

| Layer              | Technology            | Notes                                           |
| ------------------ | --------------------- | ----------------------------------------------- |
| **Frontend**       | Next.js 14+           | React with App Router, SSR for SEO              |
| **Styling**        | Tailwind CSS          | Responsive, utility-first                       |
| **Backend**        | Node.js + Express     | REST API                                        |
| **Database**       | MongoDB Atlas         | Cloud-hosted, auto-scaling                      |
| **ODM**            | Mongoose              | Schema validation                               |
| **Authentication** | Firebase Auth         | Google OAuth, Email/Password, secure & reliable |
| **File Storage**   | Cloudinary            | Image uploads, free tier (25GB)                 |
| **Payments**       | Stripe                | Global payment gateway, excellent test mode     |
| **Email**          | Nodemailer + SendGrid | Transactional emails                            |
| **QR Generation**  | qrcode.js             | Client/server-side QR                           |
| **Hosting**        | Vercel (Frontend)     | Free tier available                             |
| **API Hosting**    | Railway / Render      | Free/low-cost tier                              |
| **Caching**        | Redis (Upstash)       | API response caching                            |

---

## 9. Security Considerations

- **Authentication**: JWT tokens with short expiry, refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **API Security**: Rate limiting, CORS configuration
- **Input Validation**: Sanitize all inputs (XSS, SQL injection prevention)
- **File Uploads**: Validate file types, size limits, virus scanning
- **Sensitive Data**: Hash passwords, encrypt PII
- **HTTPS**: Enforce HTTPS in production
- **Environment Variables**: Never commit secrets to version control

---

## 10. Cost & Monetization

### 10.1 Developer Costs (Estimated Monthly)

| Service        | Cost       | Notes                      |
| -------------- | ---------- | -------------------------- |
| MongoDB Atlas  | ₹0         | Free tier (512MB)          |
| Vercel         | ₹0         | Free tier                  |
| Railway/Render | ₹0-500     | Free tier initially        |
| Cloudinary     | ₹0         | Free tier (25GB)           |
| Razorpay       | 2% per txn | No monthly fee             |
| SendGrid       | ₹0         | Free tier (100 emails/day) |
| Domain         | ₹800/year  | .com domain                |

**Minimum initial cost:** ₹0–₹2,000 per month

### 10.2 Revenue Projections

| Milestone              | Monthly Revenue |
| ---------------------- | --------------- |
| 50 restaurants (Basic) | ₹9,950          |
| 100 restaurants (Mix)  | ₹24,900         |
| 500 restaurants (Mix)  | ₹1,24,500       |

---

## 11. Pricing for Restaurants

| Plan          | Price       | Best For                |
| ------------- | ----------- | ----------------------- |
| Free Trial    | 7 Days Free | New users               |
| Basic Monthly | ₹199/month  | Small restaurants       |
| Pro Monthly   | ₹299/month  | Established restaurants |
| Basic Yearly  | ₹1,999/year | Cost-conscious          |
| Pro Yearly    | ₹2,999/year | Best value              |

---

## 12. MVP Scope

### Included (Phase 1 - MVP)

- [x] User authentication (signup/login)
- [x] Restaurant profile management
- [x] Menu CRUD (Create, Read, Update, Delete)
- [x] Category management
- [x] Veg/Non-veg indicators
- [x] QR code generation
- [x] Public menu view (mobile-responsive)
- [x] Basic subscription handling
- [x] Payment integration (Razorpay)
- [x] Admin dashboard (basic stats)

### Phase 2 (Post-MVP)

- [ ] Menu item images
- [ ] Restaurant logo & branding
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Bulk import/export
- [ ] Daily specials feature
- [ ] Email notifications

### Future Scope (Phase 3+)

- [ ] Online ordering
- [ ] Table reservations
- [ ] Delivery integration
- [ ] Multi-location support
- [ ] White-label solution
- [ ] Mobile app (React Native)

---

## 13. Success Metrics

| Metric                 | Target (6 months) |
| ---------------------- | ----------------- |
| Registered restaurants | 100+              |
| Paid subscribers       | 30% conversion    |
| Daily QR scans         | 1,000+            |
| Menu load time         | < 3 seconds       |
| Uptime                 | 99.9%             |
| Customer satisfaction  | 4.5+ rating       |

---

## 14. Risks & Constraints

| Risk                       | Mitigation                                       |
| -------------------------- | ------------------------------------------------ |
| Payment gateway dependency | Backup gateway integration                       |
| SMS cost scaling           | Prioritize email, use SMS sparingly              |
| Competition                | Focus on UX and local market                     |
| Internet dependency        | PWA with offline viewing                         |
| Image storage costs        | Optimize images, enforce size limits             |
| Free tier abuse            | Limit trial features, require email verification |

---

## 15. Development Timeline (Estimated)

| Phase                  | Duration | Deliverables               |
| ---------------------- | -------- | -------------------------- |
| Phase 1: Setup & Auth  | Week 1-2 | Project setup, auth system |
| Phase 2: Core Features | Week 3-4 | Restaurant, menu, QR       |
| Phase 3: Payments      | Week 5   | Subscription, Razorpay     |
| Phase 4: Public Menu   | Week 6   | Customer-facing menu       |
| Phase 5: Admin         | Week 7   | Admin dashboard            |
| Phase 6: Polish        | Week 8   | Testing, bug fixes, deploy |

**Total: ~8 weeks for MVP**

---

## 16. Folder Structure (Recommended)

```
restaurant-qr-menu/
├── client/                    # Next.js frontend
│   ├── app/
│   │   ├── (auth)/           # Auth pages (login, signup)
│   │   ├── (dashboard)/      # Restaurant owner dashboard
│   │   ├── (admin)/          # Admin pages
│   │   ├── menu/[slug]/      # Public menu page
│   │   └── layout.js
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── styles/
├── server/                    # Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── index.js
├── shared/                    # Shared types/constants
└── docs/
```

---

## 17. Conclusion

This product focuses on solving a real-world restaurant problem with a simple, scalable, and monetizable SaaS solution. The MVP scope is achievable within 8 weeks and suitable for both academic evaluation and real-world deployment.

**Key Differentiators:**

- Mobile-first, fast-loading menu
- Simple setup for restaurant owners
- Affordable pricing for Indian market
- Scalable architecture

---

_Document Version: 1.0_  
_Last Updated: February 2026_
