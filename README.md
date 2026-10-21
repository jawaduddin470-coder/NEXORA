# NEXORA — Event Booking System
### *DISCOVER. EXPERIENCE. BELONG.*

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-success?style=flat&logo=vercel)](https://nexora-azure-gamma.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-jawaduddin470--coder%2FNEXORA-181717?style=flat&logo=github)](https://github.com/jawaduddin470-coder/NEXORA)
[![Build Status](https://img.shields.io/badge/Build-Passing%20(0%20errors)-brightgreen?style=flat)](https://github.com/jawaduddin470-coder/NEXORA)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%206-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express%204-000000?style=flat&logo=express)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Database-Cloud%20Firestore-FFA611?style=flat&logo=firebase)](https://firebase.google.com/)

**Live Production Application**: [https://nexora-azure-gamma.vercel.app](https://nexora-azure-gamma.vercel.app)  
**Official GitHub Repository**: [https://github.com/jawaduddin470-coder/NEXORA](https://github.com/jawaduddin470-coder/NEXORA)  

---

## 1. Project Overview & Objectives

**NEXORA** is a modern full-stack event discovery, booking, and administrative management web platform developed for the **SkillOrbit Web Development Capstone Project**. Inspired by industry-leading event ticketing systems, NEXORA bridges the gap between event organizers and attendees by combining real-time seat inventory tracking, atomic booking transactions, interactive 3D digital pass rendering, in-app notifications, and comprehensive administrative analytics.

### Official Capstone Objectives:
- **Upcoming Events Discovery**: Display and filter published events by category, date, and keyword search.
- **User Authentication**: Secure registration, login, logout, password validation, and persistent session management.
- **Ticket Booking Workflow**: Form handling, seat selection, atomic inventory decrementing, and overbooking prevention.
- **Event Management**: Administrative CRUD operations, capacity safeguards, and cloud banner image uploads.
- **Dashboards & Analytics**: Attendee reservation tracking, organizer KPI monitoring, and exportable CSV reports.
- **Notification & Confirmations**: Instant in-app confirmation alerts and interactive 3D attendee ticket passes.

---

## 2. SkillOrbit Modules Compliance

NEXORA delivers all five mandatory modules specified in the official capstone curriculum:

### Module 1: User Authentication System
- **Registration & Login**: Secure account creation with email/password and official "Continue with Google" OAuth.
- **Session Persistence**: Managed via Firebase Client SDK (`onAuthStateChanged`) with automatic session restoration across browser refreshes.
- **Password Validation**: Client-side length enforcement (>= 6 characters), password confirmation match checks, and Firebase Auth security constraints.
- **Role-Based Access Control (RBAC)**: Users are strictly assigned `role: 'user'` on registration. Administrative privileges are enforced on the server using `adminMiddleware` and Firebase ID Token verification (`adminAuth.verifyIdToken`).

### Module 2: Event Management
- **Event Creation & Modification**: Organizers can add, update, and manage events from the Admin Command Center (`/admin/events`).
- **Resilient Image Pipeline**: Client-side canvas compression resizes images to max 1280px (< 250 KB), uploads via `POST /api/upload`, and serves images publicly via `GET /api/images/:id` with immutable caching.
- **Capacity & Deletion Guards**: The backend blocks capacity reductions below already-sold ticket counts and rejects hard deletions of events with existing active bookings.
- **Location & Scheduling**: Captures venue, city, calendar date, start time, and end time.

### Module 3: Ticket Booking System
- **Catalog Browsing**: Real-time listing of active published events with search, category filtering, and seat counters.
- **Seat Selection**: Interactive ticket stepper with live validation against current `availableSeats`.
- **Atomic Transactions**: Server-side `adminDb.runTransaction()` guarantees zero-overbooking even during simultaneous concurrent reservation attempts.
- **Idempotency Protection**: Client checkout session tokens (`idempotencyKey`) prevent duplicate reservations on network retries.
- **Cancellation & Seat Restoration**: Attendees can cancel reservations from their dashboard (`POST /api/bookings/:id/cancel`), automatically restoring seats back to the event inventory.

### Module 4: Dashboard & Booking Analytics
- **Member Dashboard (`/dashboard`)**: Displays personalized greetings, the next upcoming confirmed experience, total passes count, and recommended events.
- **Passes History (`/my-bookings`)**: Filterable reservation logs (All, Upcoming, Past, Cancelled) with pass inspection and cancellation modals.
- **Admin Command Center (`/admin/overview`)**: Live platform metrics including Total Events, Published Events, Total Capacity, Tickets Sold, Overall Capacity Utilization Rate, and Simulated Booking Value.
- **Data Visualizations**: Built with Recharts (Interactive Booking Trends Area Chart, Category Distribution Pie Chart, and Capacity Utilization Bar Chart).
- **System Audit Trail**: Live log of the last 25 platform actions from `activityLogs`.

### Module 5: Notification & Report System
- **Booking Confirmations**: Automatically generated upon reservation completion and rendered as an interactive 3D holographic ticket pass (`/booking-success/:id`).
- **In-App Notifications**: Real-time notification bell with unread badge indicators and "Mark as Read" / "Mark All Read" capabilities.
- **Authoritative CSV Reports**: Dedicated export engine (`GET /api/admin/reports`) generating UTF-8 BOM CSV files for Events, Bookings, and User directories.

---

## 3. Technology Stack

### Frontend:
- **Framework**: React 18.3 (TypeScript)
- **Build Tool**: Vite 6.0
- **Routing**: React Router 7 (DOM)
- **Styling**: Tailwind CSS 3.4 & PostCSS
- **3D Graphics**: Three.js & React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- **Visualizations**: Recharts 2.15
- **Icons**: Lucide React
- **Motion**: GSAP 3.12 & CSS keyframe animations

### Backend:
- **Runtime**: Node.js 18+ / 20+
- **Server Framework**: Express.js 4.21
- **Serverless Integration**: Vercel Serverless Functions (`/api/index.ts`)
- **Admin SDK**: Firebase Admin SDK 13.0
- **Security & Middleware**: CORS, Express JSON (10 MB limit for image payloads), custom Bearer token authentication middleware

### Database & Cloud Services:
- **Primary Datastore**: Google Cloud Firestore (NoSQL document store with ACID transaction isolation)
- **Authentication**: Firebase Authentication (Email/Password & Google Identity Provider)
- **Hosting & Edge Deployment**: Vercel Edge Network
- **Image Pipeline**: In-memory HTML5 Canvas compression + Firestore document image store + Express binary image streaming

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      NEXORA CLIENT (React 18 + Vite)                    │
│                                                                         │
│  Explore Catalog  │  Interactive 3D Passes  │  Admin Command Center     │
│  (/events)        │  (/booking-success)     │  (/admin/overview)        │
└───────────────┬─────────────────────────────────────┬───────────────────┘
                │ Client SDK                          │ HTTPS REST API
                │ Real-time Listeners                 │ Bearer Token
                ▼                                     ▼
┌───────────────────────────────┐     ┌───────────────────────────────────┐
│       FIREBASE CLIENT         │     │         EXPRESS BACKEND           │
│                               │     │   (Vercel Serverless / Node.js)   │
│  • Firebase Authentication    │     │                                   │
│  • Firestore onSnapshot       │     │  • authMiddleware (verifyIdToken) │
│  • IndexedDB Token Store      │     │  • adminMiddleware (RBAC check)   │
└───────────────┬───────────────┘     │  • Atomic runTransaction()        │
                │                     │  • /api/upload & /api/images/:id  │
                │                     └─────────────────┬─────────────────┘
                │                                       │
                │                                       │ Firebase Admin SDK
                ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE CLOUD FIRESTORE                          │
│                                                                         │
│  • users         • events       • bookings                              │
│  • notifications • activityLogs • eventImages                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. End-to-End Booking Workflow

1. **Discovery**: The attendee browses published events on `/events`, filtering by category or search terms.
2. **Event Details**: The attendee inspects event schedule, venue location, ticket price, and remaining seat availability on `/events/:id`.
3. **Authentication Check**: Clicking "Reserve Passes" checks authentication status; unauthenticated users are seamlessly redirected to `/login` with return-state preservation.
4. **Seat Selection**: The attendee selects the quantity of seats (validated against `availableSeats`) and provides ticket-holder details on `/booking/:eventId`.
5. **Atomic Reservation**: The form dispatches `POST /api/bookings` with a unique `idempotencyKey`. The Express backend initiates an atomic transaction (`runTransaction`):
   - Reads the latest event document and verifies available seats.
   - Atomically decrements `availableSeats`.
   - Creates the booking record with status `'confirmed'`.
   - Generates an in-app confirmation notification for the attendee.
   - Records an audit log entry in `activityLogs`.
6. **Confirmation & Digital Pass**: The attendee is redirected to `/booking-success/:bookingId` displaying an interactive 3D holographic pass, booking reference, and barcode.
7. **Attendee Dashboard & History**: The reservation immediately appears under `/my-bookings` and `/dashboard`.
8. **Cancellation (Optional)**: Attendees can cancel passes from `/my-bookings`, which triggers an atomic transaction that restores seat capacity to the event inventory.

---

## 6. Local Development Setup

### Prerequisites:
- **Node.js**: v18.18+ or v20+ installed
- **npm**: v9+ or v10+ installed
- **Git**: Installed and configured

### Step 1: Clone the Repository
```bash
git clone https://github.com/jawaduddin470-coder/NEXORA.git
cd NEXORA
```

### Step 2: Install Dependencies
Install dependencies for both the frontend root and the Express backend:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 3: Configure Environment Variables
Create a `.env` file in the project root by copying `.env.example`:
```bash
cp .env.example .env
```
Fill in your Firebase configuration parameters (see Section 7 below).

### Step 4: Run Development Servers
Start both the Vite frontend server and Express backend server:
```bash
# Terminal 1: Start Express backend on port 5001
npm run server:dev

# Terminal 2: Start Vite frontend on port 3000
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Environment Variables Reference

NEXORA separates public client-side variables from server-side secrets.

### Frontend Configuration (Vite — Public):
| Variable Name | Description | Example / Format |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication domain | `project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Cloud Firestore Project ID | `project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Cloud Storage bucket | `project-id.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging sender ID | `704975342519` |
| `VITE_FIREBASE_APP_ID` | Firebase Web Application ID | `1:704975342519:web:...` |
| `VITE_API_BASE_URL` | Backend API base URL (`/api` for same-origin proxy) | `/api` |

### Backend Configuration (Express / Serverless — Private):
| Variable Name | Description | Constraints |
|---|---|---|
| `PORT` | Local backend port (default: 5001) | `5001` |
| `FIREBASE_PROJECT_ID` | Service Account Project ID | Matches Firebase Project ID |
| `FIREBASE_CLIENT_EMAIL` | Service Account Client Email | `firebase-adminsdk-...@...iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Service Account Private Key | Multi-line PEM string with `\n` escapes |
| `FRONTEND_URL` | Allowed CORS frontend domain | `https://nexora-azure-gamma.vercel.app` |
| `ADMIN_EMAIL` | Initial admin bootstrap email (optional script) | `admin@nexora.com` |
| `ADMIN_PASSWORD` | Initial admin bootstrap password (optional script) | `YourSecurePassword123!` |

> **Security Note**: Never commit `.env` to version control. The `.gitignore` file includes `.env` and `.env.local`.

---

## 8. Build, Lint & Test Commands

```bash
# Typecheck and build frontend Vite bundle
npm run build

# Typecheck and compile Express backend TypeScript
npm run server:build

# Run ESLint validation
npm run lint

# Preview production build locally
npm run preview

# Seed database with realistic demo events (optional)
npm run seed

# Bootstrap initial administrator credentials (optional)
npm run admin:create
```

---

## 9. Verification & Live Deployment Details

- **Live Production URL**: [https://nexora-azure-gamma.vercel.app](https://nexora-azure-gamma.vercel.app)
- **Deployment Platform**: Vercel (Edge CDN + Serverless Express Functions)
- **Health Check Endpoint**: [https://nexora-azure-gamma.vercel.app/api/health](https://nexora-azure-gamma.vercel.app/api/health)
- **Events Catalog API**: [https://nexora-azure-gamma.vercel.app/api/events?status=published](https://nexora-azure-gamma.vercel.app/api/events?status=published)
- **Deep Routing**: Managed via `vercel.json` rewrites (`/(.*) -> /index.html` and `/api/(.*) -> /api/index.ts`).

---

## 10. Database Documentation & Deliverables

- Detailed database schemas, entity relationship diagrams (ERD), collection definitions, field types, security rules, and transaction architectures are documented in [`DATABASE_SCHEMA.md`](file:///Users/merajuddin/Desktop/NEXORA/DATABASE_SCHEMA.md).
- Capstone Project Report and Presentation materials are maintained alongside the repository for academic evaluation.

---

**Developed for SkillOrbit Web Development Capstone Evaluation.**  
*NEXORA — Discover. Experience. Belong.*
