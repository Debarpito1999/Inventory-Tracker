# Email Configuration Guide for Low Stock Alerts

## Problem Fixed

The low stock email job was not running because it wasn't being started in `server.js`. This has been fixed, and the email system has been improved.

## Required Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Admin Email (who receives the alerts)
ADMIN_EMAIL=admin@example.com

# Low Stock Threshold (optional, default is 10)
LOW_STOCK_THRESHOLD=10
```

## Gmail Setup (Most Common)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Inventory Tracker" as the name
4. Click "Generate"
5. Copy the 16-character password (no spaces)

### Step 3: Update .env
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
ADMIN_EMAIL=your_email@gmail.com
```

## Other Email Providers

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_app_password
```

### Custom SMTP
```env
EMAIL_HOST=your_smtp_server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_username
EMAIL_PASS=your_password
```

## Testing the Email System

### Option 1: Test on Startup
Add this to your `.env` temporarily:
```env
RUN_LOW_STOCK_JOB_ON_STARTUP=true
```

This will run the low stock check 5 seconds after server startup (if you have low stock items).

### Option 2: Manual Test
Create a test route in your server to manually trigger the email:

```javascript
// Add to server.js (temporary for testing)
app.get('/test-email', async (req, res) => {
  const sendEmail = require('./utils/emailAlert');
  const Product = require('./Models/Product');
  
  const low = await Product.find({ stock: { $lt: 10 } }).populate('supplier');
  if (low.length > 0) {
    const emailText = `Test email: Found ${low.length} low stock items`;
    await sendEmail(process.env.ADMIN_EMAIL, 'Test Low Stock Alert', emailText);
    res.json({ message: 'Test email sent', lowStockCount: low.length });
  } else {
    res.json({ message: 'No low stock items found' });
  }
});
```

Then visit: `http://localhost:5000/test-email`

## How It Works

1. **Scheduled Job**: Runs every day at 9:00 AM
2. **Checks Stock**: Finds all products with stock below threshold (default: 10)
3. **Sends Email**: If low stock items found, sends formatted HTML email to ADMIN_EMAIL
4. **Logging**: All actions are logged to console

## Troubleshooting

### Email not sending?

1. **Check Environment Variables**
   ```bash
   # Make sure these are set
   echo $EMAIL_USER
   echo $ADMIN_EMAIL
   ```

2. **Check Console Logs**
   - Look for "Email sent successfully" or error messages
   - Check for "Authentication failed" errors

3. **Test Connection**
   - Verify SMTP settings are correct
   - For Gmail, make sure you're using an App Password, not your regular password
   - Check firewall/network settings

4. **Check Spam Folder**
   - Low stock emails might go to spam initially

### Job not running?

1. **Check Server Logs**
   - Should see: "✅ Low stock monitoring job scheduled (runs daily at 9:00 AM)"
   - Should see: "🔍 Checking for low stock items..." at 9:00 AM

2. **Verify Server is Running**
   - The job only runs when the server is running
   - Make sure server stays running (use PM2 or similar for production)

### Want to test immediately?

The job runs daily at 9:00 AM. To test:
1. Set `RUN_LOW_STOCK_JOB_ON_STARTUP=true` in `.env`
2. Restart your server
3. Wait 5 seconds - it will check and send email if low stock items exist

## Email Format

The email includes:
- Header with alert count
- List of low stock products with:
  - Product name
  - Category
  - Current stock (highlighted in red)
  - Price
  - Supplier name
- Professional HTML formatting
- Plain text fallback

## Next Steps

1. Add email configuration to your `.env` file
2. Restart your server
3. Wait for 9:00 AM or use the test method above
4. Check your email (and spam folder)





