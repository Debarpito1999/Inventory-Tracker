# Inventory Tracker Frontend

A modern React frontend for the Inventory Tracker application.

## Features

- 🔐 User Authentication (Register/Login)
- 📦 Product Management (Add/Update/Delete)
- 🏢 Supplier Management
- 📊 Dashboard with Low Stock Alerts
- 💰 Sales Tracking (Admin only)
- 🔔 Auto-notifications for low stock items

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to `http://localhost:5000/api`):
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Usage

1. Register a new account or login with existing credentials
2. Navigate to Dashboard to see overview and low stock alerts
3. Manage products in the Products page
4. Manage suppliers in the Suppliers page
5. Record sales (Admin only) in the Sales page

## API Integration

The frontend communicates with the backend API running on port 5000. Make sure the backend server is running before starting the frontend.

