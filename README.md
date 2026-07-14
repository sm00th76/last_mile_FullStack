# Last-Mile Delivery Tracker

A production-grade, database-driven logistics tracker built using the MERN stack (MongoDB, Express, React, Node.js) with dynamic pricing engines, automated location-aware agent assignments, a fully-auditable state machine, and customer rescheduling support.

---

## Features

- **Database-Driven Rate Calculation Engine**: Computes charges dynamically using active RateCard documents, supporting volumetric dimensions and flat/percentage cash-on-delivery (COD) fees.
- **Zone Detection System**: Translates pickup and dropoff pincodes directly to dispatch zones.
- **Automated Agent Matching Service**: Employs Haversine-based proximity searches to match new orders to available drivers in target zones, with workload tiebreakers and system-wide fallbacks.
- **Auditable Status Transitions**: An immutable history transitions orders along a strict path (`Created` → `Assigned` → `PickedUp` → `InTransit` → `OutForDelivery` → `Delivered`), logging every actor movement and administrative override to append-only tables.
- **Integrated Email System**: Fires transaction notifications to the consumer on every shipment milestone using Nodemailer.

---

## Directory Structure

```
delivery-tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, env.js, mailer.js
│   │   ├── models/          # User, Zone, Area, RateCard, Agent, Order, TrackingEvent, Notification
│   │   ├── services/        # rateEngine.js, zoneDetection.js, assignmentEngine.js, notificationService.js, orderStateMachine.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/      # auth.js, rbac.js, errorHandler.js, validate.js
│   │   └── app.js
│   ├── server.js
│   ├── seed.js               # seeds zones/areas/rate cards/demo users
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # axios.js instance config
│   │   ├── pages/           # login, register, customer, agent, admin components
│   │   ├── components/
│   │   ├── context/         # AuthContext.jsx
│   │   └── App.jsx
│   └── package.json
├── docs/
│   ├── SYSTEM_DESIGN.md
│   ├── API_DOCS.md
│   └── DB_SCHEMA.md
├── render.yaml
└── README.md
```

---

## Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.

### 2. Configure Environment Variables
Copy `.env.example` in the `backend/` directory to a new `.env` file:
```bash
cp backend/.env.example backend/.env
```
Fill in the configuration details:
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/delivery-tracker
JWT_ACCESS_SECRET=your_access_jwt_secret_key_string
JWT_REFRESH_SECRET=your_refresh_jwt_secret_key_string
FRONTEND_URL=http://localhost:5173
```

*(Optional)* Nodemailer settings:
```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=example@gmail.com
SMTP_PASS=app_password_here
SMTP_FROM="Delivery Tracker <noreply@deliverytracker.com>"
```
*Note: If SMTP variables are missing, the system will log outbound emails to stdout instead of failing.*

---

### 3. Run and Seed the Backend Database
Navigate to the backend directory, install package dependencies, and execute the seed script to populate testing configurations:
```bash
cd backend
npm install
npm run seed
```
This script creates:
- 4 default operational zones (`NORTH`, `SOUTH`, `EAST`, `WEST`).
- 12 default serviceable pincodes.
- Active rate cards (flat + percent surcharges).
- Five test accounts (Administrators, Agents, Customers).

To start the local developer server:
```bash
npm run dev
```

---

### 4. Run the React Frontend App
Open a separate terminal window, change directories to `frontend`, install packages, and boot up Vite:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Test Credentials
You can log in to the application using any of the following accounts:
- **Administrator**: `admin@delivery.com` (Password: `password123`)
- **Customer**: `customer@delivery.com` (Password: `password123`)
- **Agent**: `agent.north@delivery.com` (Password: `password123`)

---

## Deployment on Render

This project contains a `render.yaml` blueprint defining the entire deployment stack.
1. Connect your GitHub repository to [Render](https://render.com/).
2. Click **New** → **Blueprint Route**.
3. Point to the `render.yaml` file in this repository.
4. Input the environment variables (`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) in the Render Dashboard when prompted.
