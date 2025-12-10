# Inventory Tracker

A full-stack inventory management system with real-time stock monitoring and automatic email alerts.

## Features

- 🔐 **User Authentication** - Secure register/login with JWT tokens
- 📦 **Product Management** - Add, update, delete, and track products
- 🏢 **Supplier Management** - Manage supplier information
- 📊 **Dashboard** - Real-time overview with statistics and low stock alerts
- 💰 **Sales Tracking** - Record sales with automatic stock reduction
- 🔔 **Auto Email Alerts** - Automatic notifications when stock runs low
- 📱 **Modern Frontend** - Beautiful React-based user interface

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer for email alerts
- Node-cron for scheduled tasks

### Frontend
- React
- React Router
- Axios for API calls
- Modern CSS with responsive design

## Project Structure

```
Inventory_Tracker_DH/
├── config/           # Database configuration
├── controllers/      # Route controllers
├── Models/           # MongoDB models
├── routes/           # API routes
├── middleware/       # Auth middleware
├── utils/            # Utility functions (email, low stock checker)
├── jobs/             # Scheduled jobs (low stock monitoring)
├── frontend/         # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth)
│   │   └── services/    # API service layer
│   └── public/
└── server.js         # Main server file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Gmail account (for email alerts) or other SMTP provider

### Backend Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Inventory_Tracker_DH
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Database
MONGO_URI=your_mongodb_connection_string

# Server
PORT=5000

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (for low stock alerts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Admin Email (recipient for low stock alerts)
ADMIN_EMAIL=admin@example.com

# Low Stock Threshold (default: 10)
LOW_STOCK_THRESHOLD=10
```

4. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to `http://localhost:5000/api`):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will open at `http://localhost:3000`

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Dashboard**: View overview statistics and low stock alerts
3. **Products**: Manage your inventory - add, edit, delete products
4. **Suppliers**: Manage supplier information
5. **Sales**: Record sales (Admin only) - automatically reduces stock
6. **Email Alerts**: Automatic emails sent when stock drops below threshold

## Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Use that 16-character password in `EMAIL_PASS` (not your regular password)

See `EMAIL_SETUP.md` for detailed instructions for other email providers.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - Get all products (protected)
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `GET /api/products/low-stock` - Get low stock items (protected)

### Suppliers
- `GET /api/suppliers` - Get all suppliers (protected)
- `POST /api/suppliers` - Create supplier (admin)
- `PUT /api/suppliers/:id` - Update supplier (admin)
- `DELETE /api/suppliers/:id` - Delete supplier (admin)

### Sales
- `GET /api/sales` - Get all sales (admin)
- `POST /api/sales` - Create sale (protected)

## Features in Detail

### Automatic Low Stock Alerts

- **Real-time Monitoring**: Emails sent immediately when stock drops below threshold
- **Smart Cooldown**: Prevents spam (1 hour cooldown per product)
- **Comprehensive Reports**: Shows all low stock items in one email
- **Scheduled Backup**: Daily check at 9:00 AM

### User Roles

- **User**: Can view products and suppliers
- **Admin**: Full access including add/edit/delete and sales recording

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```
This creates an optimized production build in the `build` folder.

### Backend
The backend is ready for production. Consider:
- Using environment variables for all sensitive data
- Setting up proper error logging
- Using PM2 or similar for process management
- Setting up MongoDB Atlas for cloud database

## Troubleshooting

See `TROUBLESHOOTING_EMAIL.md` for email-related issues.

See `SETUP.md` for general setup issues.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Author

Your Name

---

**Note**: Make sure to never commit your `.env` file to version control. It contains sensitive information like database credentials and email passwords.





