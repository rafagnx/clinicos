# ClinicOS Deployment Guide

## Prerequisites
- Node.js (v18+)
- MySQL or PostgreSQL (Optional for local mock version)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Backend Server**
   To run the local backend (initially using in-memory mock data):
   ```bash
   npm run server
   ```
   *Server runs on port 3000.*

3. **Start Frontend**
   In a new terminal:
   ```bash
   npm run dev
   ```
   *Frontend runs on http://localhost:5173.*

## Database Setup (Production)
If you wish to switch from Mock Data to a real database:
1. Run the script in `database/schema.sql` to create your tables.
2. Edit `server/routes.js` (or create a `db.js` connector) to query the database instead of the `db` object.

## Features Currently Active
- **Dashboard**: Visualizes mock data.
- **Agenda**: Fully interactive with drag-and-drop support (mocked).
- **Patients/Leads**: CRUD operations (in-memory).

## Troubleshooting
- If you see "Network Error", ensure the backend server is running on port 3000.
