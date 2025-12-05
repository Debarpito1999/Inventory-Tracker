# Email Troubleshooting Guide

## Quick Diagnostic Steps

### Step 1: Check Email Configuration
Visit this URL in your browser:
```
http://localhost:5000/api/check-email-config
```

This will show you:
- Which environment variables are set
- Which ones are missing
- Current configuration values

### Step 2: Test Email Sending
Visit this URL to test email sending:
```
http://localhost:5000/api/test-low-stock-email
```

**Watch your server console** - you'll now see detailed logs showing:
- What's being checked
- Configuration status
- SMTP connection attempts
- Detailed error messages

## Common Issues and Solutions

### Issue 1: "EMAIL_USER and EMAIL_PASS must be set"

**Solution:**
1. Create or edit `.env` file in your project root
2. Add these lines:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ADMIN_EMAIL=your_email@gmail.com
```

### Issue 2: "Authentication failed" (EAUTH error)

**For Gmail:**
1. Enable 2-Factor Authentication on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Use that 16-character password (not your regular password) in `EMAIL_PASS`

**For other providers:**
- Make sure you're using the correct username and password
- Some providers require app-specific passwords

### Issue 3: "Connection failed" (ECONNECTION/ETIMEDOUT)

**Check:**
1. `EMAIL_HOST` is correct:
   - Gmail: `smtp.gmail.com`
   - Outlook: `smtp-mail.outlook.com`
   - Yahoo: `smtp.mail.yahoo.com`

2. `EMAIL_PORT` is correct:
   - Usually `587` for TLS
   - Or `465` for SSL (set `EMAIL_SECURE=true`)

3. Internet connection is working
4. Firewall isn't blocking the connection

### Issue 4: No console logs appearing

**Possible causes:**
1. Server not restarted after code changes
   - **Solution:** Restart your server

2. Looking at wrong console
   - **Solution:** Check the terminal/console where you ran `npm start` or `node server.js`

3. Logs are being suppressed
   - **Solution:** Check if you have any logging middleware that might be filtering

### Issue 5: Email sent but not received

**Check:**
1. Spam/Junk folder
2. Email address is correct
3. Check server logs for "Email sent successfully" message
4. Some email providers delay delivery

## Enhanced Logging

The system now logs:
- ✅ When email sending starts
- ✅ SMTP connection verification
- ✅ Configuration status
- ✅ Detailed error messages with codes
- ✅ Success confirmations

## Testing Checklist

1. ✅ Check configuration: `/api/check-email-config`
2. ✅ Test email: `/api/test-low-stock-email`
3. ✅ Watch server console for detailed logs
4. ✅ Check spam folder
5. ✅ Verify `.env` file is in project root
6. ✅ Restart server after changing `.env`

## Example Console Output (Success)

```
🔍 Testing low stock email...
   Threshold: 10
   Found 1 low stock item(s)
   Low stock products:
     - Test Product: 5 units
   Attempting to send email...

🔍 Checking all products for low stock...
   Threshold: 10
   Found 1 low stock item(s)
   📧 Preparing to send email for 1 low stock item(s)
   Recipient: admin@example.com

📧 Attempting to send email...
   To: admin@example.com
   Subject: ⚠️ Low Stock Alert: 1 Item(s) Need Attention
   Using SMTP: smtp.gmail.com
   Port: 587
   From: your_email@gmail.com
   Verifying SMTP connection...
   ✓ SMTP connection verified
   Sending email...
✅ Email sent successfully!
   To: admin@example.com
   Message ID: <xxx@mail.gmail.com>
✅ Low stock alert email sent successfully for 1 product(s)
```

## Example Console Output (Error)

```
🔍 Testing low stock email...
   Threshold: 10
   Found 1 low stock item(s)

📧 Attempting to send email...
   To: admin@example.com
   Subject: ⚠️ Low Stock Alert: 1 Item(s) Need Attention
   Using SMTP: smtp.gmail.com
   Port: 587
   From: your_email@gmail.com
   Verifying SMTP connection...
❌ Email Error Details:
   Error Message: Invalid login: 535-5.7.8 Username and Password not accepted
   Error Code: EAUTH
   ⚠️  Authentication failed!
   Please check:
   1. EMAIL_USER is correct
   2. EMAIL_PASS is correct (use App Password for Gmail)
   3. 2-Factor Authentication is enabled (for Gmail)
```

## Still Not Working?

1. **Share the console output** - The detailed logs will show exactly what's wrong
2. **Check the diagnostic endpoint** - `/api/check-email-config` shows your configuration
3. **Verify .env file** - Make sure it's in the project root (same folder as server.js)
4. **Restart server** - Environment variables are loaded on startup



