# PulseRoute

PulseRoute is a ride-booking platform inspired by Uber and Ola, with separate experiences for passengers and captains (drivers). The project includes a React frontend and an Express + MongoDB backend, with real-time ride updates using Socket.IO and map-based location support.

## Features

- User signup and login
- Captain signup and login
- Ride request flow for passengers
- Captain ride acceptance and status updates
- Real-time location tracking during active rides
- Route and map integration for pickup and destination selection
- Secure authentication with JWT and hashed passwords
- Responsive frontend built with React and Vite

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Leaflet and React Leaflet
- GSAP animation library
- Tailwind CSS
- Socket.IO client

### Backend
- Node.js
- Express
- MongoDB and Mongoose
- JWT authentication
- bcrypt password hashing
- Socket.IO
- Cookie parsing and CORS

## Project Structure

```text
PulseRoute/
├── backend/
│   ├── controllers/
│   ├── DB/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── app.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── README.md
└── package.json (if present in your setup)
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ installed
- MongoDB running locally or a MongoDB connection string
- A Google Maps API key (if you are using route and map features in your environment)
- npm installed

## Environment Variables

Create a `.env` file inside the `backend` directory with values similar to the following:

```env
PORT=3000
DB_CONNECT=mongodb://localhost:27017/pulseroute
JWT_SECRET=your_super_secret_key
GOOGLE_MAPS_API=your_google_maps_api_key
```

## Installation

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## Running the Project

### Start the backend

```bash
cd backend
npm start
```

The backend server will run on the configured port (default: `3000`).

### Start the frontend

```bash
cd frontend
npm run dev
```

The frontend will typically run on the Vite default port (`5173`).

## Typical User Flow

1. User signs up or logs in.
2. User searches for a pickup and destination location.
3. User requests a ride.
4. Captain accepts the ride.
5. Real-time tracking updates begin for both parties.
6. Ride is completed when the user or captain marks it as finished.

## Notes

This project is a full-stack prototype for a mobility service application and is meant to demonstrate authentication, ride management, live tracking, and route handling in a modern web app setup.

## License

This project is currently unlicensed unless you add a license file for your own distribution needs.
