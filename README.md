# ⛽ FuelFlux

> A full-stack fuel delivery platform — find nearby petrol bunks, order fuel, and track deliveries in real-time.

---

## 🚀 Overview

**FuelFlux** is a modern web application built with **React (Vite)** and **Firebase** that connects fuel customers with nearby petrol stations and delivery drivers. It supports three distinct roles — **User**, **Station Manager**, and **Admin** — each with a tailored dashboard and experience.

---

## ✨ Features

### 👤 User
- Interactive map showing nearby petrol bunks (via Leaflet + OpenStreetMap)
- Filter and sort stations by distance, petrol price, diesel price, or stock
- Order fuel with quantity selection, vehicle association, and payment method
- Real-time order tracking with road-route polyline (OSRM routing API)
- Turn-by-turn directions on the tracking map
- Vehicle management (add/remove cars, bikes, trucks, etc.)

### 🏪 Station Manager
- Register a new petrol bunk (GPS auto-detect or manual coordinates)
- Manage fuel inventory — update petrol/diesel stock and prices
- Edit station info: name, address, phone, and operating hours
- Registered bunks appear live on the user map immediately

### 🛡️ Admin
- Analytics dashboard: KPI cards, revenue area chart, 7-day orders bar chart, fuel breakdown pie, top stations chart
- Full order management — assign delivery drivers, mark as delivered, filter/search
- Driver (vehicle) management — add drivers, assign to orders, free after delivery
- User management — view all users, change roles in real time

---

## 🛠️ Tech Stack

| Layer       | Technology                             |
|-------------|----------------------------------------|
| Frontend    | React 19 + Vite 8                      |
| Routing     | React Router v7                        |
| Styling     | Vanilla CSS (custom dark-mode design)  |
| Map         | Leaflet + React-Leaflet                |
| Routing API | OSRM (open-source road routing)        |
| Backend     | Firebase (Auth + Firestore)            |
| Charts      | Recharts                               |
| Toasts      | React Hot Toast                        |

---

## 📁 Project Structure

```
src/
├── App.jsx                  # Routes & layout
├── index.css                # Global design system (dark mode, tokens, components)
├── components/
│   ├── Navbar.jsx           # Hamburger nav with role-based links
│   ├── Footer.jsx
│   ├── LoadingSpinner.jsx
│   ├── OrderCard.jsx
│   ├── OrderForm.jsx
│   ├── ProtectedRoute.jsx   # Role-aware route guard
│   └── QuickNav.jsx
├── context/
│   └── AuthContext.jsx      # Auth state + role resolution from Firestore
├── firebase/
│   └── firebaseConfig.js    # Firebase SDK initialisation
├── map/
│   ├── MapView.jsx          # Home page interactive map
│   ├── BunkMarker.jsx
│   └── UserMarker.jsx
├── pages/
│   ├── HomePage.jsx         # Map + order form
│   ├── LoginPage.jsx        # Login + demo quick-login
│   ├── RegisterPage.jsx     # Registration with role selection
│   ├── OrderFuelPage.jsx    # Full order flow
│   ├── OrdersPage.jsx       # My orders list
│   ├── TrackingPage.jsx     # Live tracking + OSRM route
│   ├── MyVehiclesPage.jsx   # Vehicle management
│   ├── NearbyBunksPage.jsx  # Filter/sort bunk list + mini-map
│   ├── InventoryPage.jsx    # Manager: stock & price management
│   ├── StationInfoPage.jsx  # Manager: register & edit station info
│   └── AdminPage.jsx        # Admin: analytics, orders, drivers, users
├── services/
│   ├── authService.js       # Firebase Auth + Firestore user profiles
│   ├── bunkService.js       # Firestore CRUD for petrol bunks
│   ├── orderService.js      # Order placement, status updates, subscriptions
│   ├── vehicleService.js    # Delivery vehicle management
│   └── userVehicleService.js# User vehicle (car/bike) management
└── utils/
    ├── calculateDistance.js # Haversine formula
    ├── constants.js         # Status colours, default map centre
    └── formatCurrency.js    # INR formatter
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js ≥ 18
- A Firebase project with **Authentication** and **Firestore** enabled

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/fuel-flux.git
cd fuel-flux/fuel_flux
npm install
```

### 2. Configure Firebase

Create a `.env` file in the project root with your Firebase config:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Demo Accounts

Register accounts using the `/register` page with these emails and the `demo123` password, then use the **Quick Demo Login** buttons on `/login`:

| Role            | Email                        |
|-----------------|------------------------------|
| 👤 User         | demo.user@fuelflux.com       |
| 🏪 Manager      | demo.manager@fuelflux.com    |
| 🛡️ Admin        | demo.admin@fuelflux.com      |

---

## 🗺️ Firestore Collections

| Collection      | Purpose                                  |
|-----------------|------------------------------------------|
| `users`         | User profiles with role                  |
| `bunks`         | Petrol station data (location, stock)    |
| `orders`        | Fuel orders with status lifecycle        |
| `vehicles`      | Delivery drivers / trucks                |
| `userVehicles`  | Customer's registered vehicles           |

---

## 📜 Scripts

| Command           | Description                     |
|-------------------|---------------------------------|
| `npm run dev`     | Start development server        |
| `npm run build`   | Build for production            |
| `npm run preview` | Preview production build        |
| `npm run lint`    | Run ESLint                      |

---

## 📄 License

MIT — free to use and modify.
