# NEXORA Database Schema Specification

This document details the Cloud Firestore database architecture, entity models, field definitions, data types, relationships, indexes, and security constraints for NEXORA.

---

## Collections Overview

NEXORA utilizes five primary Firestore collections:

1. `users` - User authentication profiles and application role management.
2. `events` - Event listings, metadata, schedule, location, capacity, and seat availability.
3. `bookings` - Ticket reservations, quantities, attendee details, and booking status.
4. `notifications` - In-app user notifications for confirmations and system alerts.
5. `activityLogs` - Audit logs for tracking critical system and user actions.

---

## Collection Schemas

### 1. `users`
- **Path**: `users/{userId}`
- **Description**: Stores user profile information and system role (`user` or `admin`).

| Field | Type | Description | Required | Immutable by Client |
|---|---|---|---|---|
| `userId` | `string` | Matches Firebase Authentication UID (`auth.uid`) | Yes | Yes |
| `name` | `string` | Display name of the user | Yes | No |
| `email` | `string` | User's email address | Yes | Yes |
| `role` | `string` | Access role: `'user'` \| `'admin'` | Yes | **YES (STRICT)** |
| `profileImage` | `string` (URL) | Profile picture URL | No | No |
| `createdAt` | `timestamp` | ISO date string / Firestore Timestamp | Yes | Yes |
| `updatedAt` | `timestamp` | ISO date string / Firestore Timestamp | Yes | No |

---

### 2. `events`
- **Path**: `events/{eventId}`
- **Description**: Event catalog containing capacity, pricing, status, and location details.

| Field | Type | Description | Required |
|---|---|---|---|
| `eventId` | `string` | Auto-generated Firestore document ID | Yes |
| `title` | `string` | Event title | Yes |
| `slug` | `string` | URL-friendly slug | Yes |
| `description` | `string` | Detailed event markdown/text description | Yes |
| `category` | `string` | `'Technology'` \| `'Music'` \| `'Business'` \| `'Workshop'` \| `'Sports'` \| `'Education'` \| `'Art'` \| `'Conference'` | Yes |
| `bannerImage` | `string` (URL) | Firebase Storage image URL | Yes |
| `date` | `string` (YYYY-MM-DD) | Event date | Yes |
| `time` | `string` (HH:mm) | Display time string | Yes |
| `startTime` | `string` | Start time (e.g. "09:00 AM") | No |
| `endTime` | `string` | End time (e.g. "05:00 PM") | No |
| `venue` | `string` | Venue name (e.g. "Silicon Arena") | Yes |
| `location` | `string` | City / Address (e.g. "San Francisco, CA") | Yes |
| `city` | `string` | City name (e.g. "San Francisco") | No |
| `organizerId` | `string` | UID of organizer/admin who created the event | Yes |
| `organizerName` | `string` | Name of organizer | Yes |
| `capacity` | `number` | Total venue seating capacity | Yes |
| `availableSeats` | `number` | Current available unbooked seats | Yes |
| `ticketPrice` | `number` | Price per ticket in USD | Yes |
| `status` | `string` | `'draft'` \| `'published'` \| `'cancelled'` \| `'completed'` | Yes |
| `featured` | `boolean` | Flag for landing page spotlight carousel | No |
| `createdAt` | `timestamp` | Document creation timestamp | Yes |
| `updatedAt` | `timestamp` | Document update timestamp | Yes |
| `createdBy` | `string` | User UID of event author | No |

---

### 3. `bookings`
- **Path**: `bookings/{bookingId}`
- **Description**: Ticket booking transaction record created exclusively via secure backend API.

| Field | Type | Description | Required |
|---|---|---|---|
| `bookingId` | `string` | Auto-generated Firestore document ID | Yes |
| `bookingReference` | `string` | Human-readable reference code (e.g. `NX-2026-89F3A1`) | Yes |
| `userId` | `string` | UID of booking user | Yes |
| `userName` | `string` | Name of user at time of booking | Yes |
| `userEmail` | `string` | Email of user | Yes |
| `eventId` | `string` | Foreign key to `events` collection document ID | Yes |
| `eventTitle` | `string` | Title snapshot of the booked event | Yes |
| `quantity` | `number` | Number of tickets booked | Yes |
| `ticketsBooked` | `number` | Alias for ticket quantity reserved | Yes |
| `ticketPrice` | `number` | Snapshot price per ticket at time of reservation | Yes |
| `attendeeDetails` | `array` of `{ name, email, phone? }` | List of ticket holder details | Yes |
| `totalAmount` | `number` | Calculated as `quantity × ticketPrice` (Simulated Booking Value) | Yes |
| `status` | `string` | `'confirmed'` \| `'cancelled'` | Yes |
| `idempotencyKey` | `string` | Client checkout session token for retry protection | No |
| `bookedAt` | `timestamp` | Transaction completion timestamp (ISO 8601 string) | Yes |
| `updatedAt` | `timestamp` | Last status update timestamp (ISO 8601 string) | Yes |

---

### 4. `notifications`
- **Path**: `notifications/{notificationId}`
- **Description**: In-app notifications for confirmation alerts, event updates, and system messages.

| Field | Type | Description | Required |
|---|---|---|---|
| `notificationId` | `string` | Auto-generated document ID | Yes |
| `userId` | `string` | Recipient user UID | Yes |
| `title` | `string` | Notification title | Yes |
| `message` | `string` | Notification content text | Yes |
| `type` | `string` | `'booking_confirmation'` \| `'event_update'` \| `'system'` | Yes |
| `read` | `boolean` | Read status | Yes |
| `createdAt` | `timestamp` | Notification timestamp | Yes |

---

### 5. `activityLogs`
- **Path**: `activityLogs/{logId}`
- **Description**: Audit logging for system activity, admin edits, and ticket reservations.

| Field | Type | Description | Required |
|---|---|---|---|
| `logId` | `string` | Document ID | Yes |
| `userId` | `string` | UID associated with activity | Yes |
| `action` | `string` | E.g. `'EVENT_CREATED'`, `'TICKETS_BOOKED'`, `'BOOKING_CANCELLED'` | Yes |
| `details` | `object` | Additional context parameters | Yes |
| `createdAt` | `timestamp` | Timestamp | Yes |

---

## Technical Booking Transaction Architecture

To guarantee accuracy, seat inventory safety, and overbooking protection:

1. **Authentication Step (Prior to Transaction)**:
   - The client sends the Firebase Bearer ID Token in `Authorization: Bearer <token>`.
   - Express server middleware (`authMiddleware`) verifies the ID token using `Firebase Admin SDK` (`adminAuth.verifyIdToken`).
   - User identity and authorization are established before entering database logic.

2. **Idempotency Protection**:
   - Client sends a unique `idempotencyKey` per checkout session attempt.
   - Server checks if a booking with the same `userId` and `idempotencyKey` already exists, returning the original booking if found to prevent duplicate charges or reservations.

3. **Atomic Reservation Transaction (`adminDb.runTransaction`)**:
   - Reads current event seat availability (`eventDoc.availableSeats`).
   - Validates requested ticket quantity (`quantity <= availableSeats`).
   - Atomically decrements `availableSeats` on the event document.
   - Atomically creates the `bookings` document with status `'confirmed'`.
   - Atomically creates the in-app `notifications` document.
   - Appends audit entry in `activityLogs` (`TICKETS_BOOKED`).

4. **Atomic Cancellation Transaction (`POST /api/bookings/:id/cancel`)**:
   - Authenticates user and verifies ownership (`userId === req.user.uid`).
   - Verifies current status is `'confirmed'`.
   - Atomically increments `availableSeats` by `booking.quantity`.
   - Updates booking status to `'cancelled'`.
   - Atomically creates in-app notification (`"Booking Cancelled"`).
   - Appends audit entry in `activityLogs` (`BOOKING_CANCELLED`).

---

## Event Management & Safety Rules

1. **Edit Capacity Safety**:
   - When editing an event, the server verifies `ticketsBooked = capacity - availableSeats`.
   - Capacity reductions below `ticketsBooked` are rejected with `400 Bad Request`.
   - New `availableSeats = newCapacity - ticketsBooked`.

2. **Delete Booking Safety**:
   - Before event deletion, the server queries active bookings for the `eventId`.
   - If bookings exist, hard deletion is blocked to prevent orphaned records. Admin is advised to update status to `cancelled` or `draft`.

3. **Firebase Storage Configuration**:
   - Uses exact `storageBucket` parameter (`VITE_FIREBASE_STORAGE_BUCKET`, e.g. `nexora-cd4dc.firebasestorage.app`).
   - Banner uploads restricted to verified admins in `storage.rules`.

---

## Admin Analytics & Reporting Architecture

1. **KPI Definitions & Calculations**:
   - **Tickets Sold**: Sum of `quantity` (`ticketsBooked`) for confirmed bookings (`status == 'confirmed'`).
   - **Active Bookings**: Count of bookings where `status == 'confirmed'`.
   - **Cancelled Bookings**: Count of bookings where `status == 'cancelled'`.
   - **Simulated Booking Value**: Sum of `totalAmount` for confirmed bookings.
   - **Overall Capacity Utilization (%)**: `Math.min(100, Math.round((ticketsSold / totalCapacity) * 100))`.
   - **Event Utilization (%)**: `Math.min(100, Math.round((eventTicketsSold / eventCapacity) * 100))`.

2. **Authoritative Endpoints (`server/src/routes/admin.ts`)**:
   - `GET /api/admin/analytics`: Aggregated live Firestore analytics with `timeRange` and `category` filtering.
   - `GET /api/admin/reports?type=events|bookings|users`: Filtered UTF-8 BOM CSV exports for Excel and spreadsheet viewers.
   - `GET /api/admin/users`: Registered user accounts list.
   - `GET /api/admin/bookings`: Comprehensive bookings platform audit.
   - `GET /api/admin/activity`: System audit logs query.
