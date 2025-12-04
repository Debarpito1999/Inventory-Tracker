# Inventory Tracker - Frontend Setup Guide

## Quick Start

### 1. Install Frontend Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

### 2. Configure Environment (Optional)

Create a `.env` file in the `frontend` directory if you need to change the API URL:

```
REACT_APP_API_URL=http://localhost:5000/api
```

By default, the frontend will use `http://localhost:5000/api` (configured via proxy in package.json).

### 3. Start the Frontend

Make sure your backend server is running first, then start the frontend:

```bash
npm start
```

The frontend will open at `http://localhost:3000`

## Features Implemented

✅ **Authentication**
- User registration
- User login
- JWT token-based authentication
- Protected routes

✅ **Product Management**
- View all products
- Add new products
- Edit existing products
- Delete products
- View stock levels with color-coded badges

✅ **Supplier Management**
- View all suppliers
- Add new suppliers (Admin only)
- Edit suppliers (Admin only)
- Delete suppliers (Admin only)

✅ **Stock Management**
- Real-time stock tracking
- Stock level updates when products are edited
- Automatic stock reduction when sales are recorded

✅ **Low Stock Notifications**
- Dashboard shows low stock items (threshold: 10 units)
- Banner notification at the top when low stock items are detected
- Auto-refreshes every 30 seconds
- Color-coded alerts (red for < 5, yellow for < 10)

✅ **Sales Tracking** (Admin only)
- Record sales
- Automatic stock reduction
- View sales history
- Calculate total price automatically

✅ **Dashboard**
- Overview statistics (total products, low stock count, total stock)
- Low stock alert section
- Real-time updates

## User Roles

- **User**: Can view products and suppliers, but cannot modify them
- **Admin**: Full access to all features including adding/editing/deleting products and suppliers, and recording sales

## Default Admin Account

To create an admin account, you'll need to manually set the role in the database or create a user through registration (which defaults to 'user' role) and then update it in the database.

## Troubleshooting

### Frontend won't connect to backend
- Make sure the backend server is running on port 5000
- Check that CORS is enabled in the backend
- Verify the API URL in `.env` file matches your backend URL

### Authentication issues
- Clear browser localStorage: `localStorage.clear()`
- Check that JWT_SECRET is set in backend `.env`
- Verify token is being sent in request headers

### Low stock notifications not showing
- Check that products exist with stock < 10
- Verify API endpoint `/api/products/low-stock` is working
- Check browser console for errors

## Building for Production

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `build` folder that can be served by any static file server.

