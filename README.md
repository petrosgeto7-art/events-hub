# 🎓 EventHub DBU

> **AI-Powered Campus Event Management & Ticketing Platform for Debre Birhan University**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-green?style=flat&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-teal?style=flat&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

---

## ✨ Features

- 🎟️ **Smart QR Ticketing & Verification**: Generate secure dynamic QR code tickets with real-time camera and file upload scanning.
- 💳 **Chapa Payment Integration**: Seamless payment processing for paid events and university workshops.
- 📜 **Automated Certificates**: Automatic issuance and download of verified participation certificates upon attendance.
- 📊 **Real-time Analytics**: Organizers and administrators get live insights on ticket sales, attendance rates, and feedback.
- 🔔 **Multi-channel Notifications**: Instant updates via WebSockets and Firebase Cloud Messaging.
- 🌐 **Bilingual Support**: Full English and Amharic language localization.

---

## 🏗️ Architecture

```
event-hub-dbu/
├── backend/                  # Node.js + Express + Prisma + PostgreSQL + Socket.io
│   ├── src/
│   │   ├── modules/          # Auth, Events, Registrations, Attendance, Payments, etc.
│   │   ├── middleware/       # RBAC, Rate Limiting, Error Handling
│   │   ├── config/           # Firebase, Database, Environment
│   │   └── cron/             # Auto-certificate issuance cron jobs
├── frontend/                 # Next.js 16 (App Router) + Tailwind CSS + Framer Motion
│   ├── src/
│   │   ├── app/              # App Router Pages (Student, Organizer, Admin portals)
│   │   ├── components/       # UI & Layout components
│   │   └── stores/           # Zustand state management
└── docker-compose.yml        # Local PostgreSQL database setup
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- PostgreSQL or Docker
- npm or yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/petrosgeto7-art/events-hub.git
cd event-hub-dbu
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment
Create `.env` in `backend/` and `.env.local` in `frontend/` based on `.env.example`.

### 3. Run Development Environment
```bash
# From the root directory:
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **Health Endpoint**: http://localhost:4000/api/health

---

## 📄 License
MIT License © EventHub DBU
