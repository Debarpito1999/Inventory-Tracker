# Automatic Low Stock Email Alerts

## ✅ Implementation Complete

The system now sends **automatic email alerts in real-time** whenever stock levels drop below the threshold.

## How It Works

### Real-Time Monitoring
Emails are sent automatically when:

1. **Product Created** - If a new product is created with low stock
2. **Product Updated** - If stock is updated and drops below threshold
3. **Sale Recorded** - If a sale reduces stock below threshold

### Smart Alert System
- **Immediate Alerts**: Emails sent as soon as stock drops below threshold
- **Cooldown Protection**: Prevents spam - won't send another email for the same product for 1 hour
- **Comprehensive Reports**: Email includes ALL low stock items, not just the one that triggered it
- **Scheduled Backup**: Daily check at 9:00 AM as a backup (in case real-time alerts miss something)

## Email Triggers

### Scenario 1: Creating a Product with Low Stock
```javascript
// When you create a product with stock < 10
POST /api/products
{
  "name": "Widget",
  "stock": 5,  // Below threshold
  "price": 10.00
}
// → Email sent immediately
```

### Scenario 2: Updating Stock to Low
```javascript
// When you update stock from 15 to 8
PUT /api/products/:id
{
  "stock": 8  // Drops below threshold
}
// → Email sent immediately
```

### Scenario 3: Sale Reduces Stock to Low
```javascript
// When a sale reduces stock below threshold
POST /api/sales
{
  "product": "product_id",
  "quantity": 12  // Reduces stock from 15 to 3
}
// → Email sent immediately
```

## Configuration

### Required Environment Variables

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Email (who receives alerts)
ADMIN_EMAIL=admin@example.com

# Low Stock Threshold (default: 10)
LOW_STOCK_THRESHOLD=10
```

## Cooldown System

To prevent email spam:
- **Cooldown Period**: 1 hour per product
- **How it works**: If a product triggers an alert, it won't trigger another for 1 hour
- **Multiple Products**: Each product has its own cooldown timer
- **Stock Recovery**: If stock goes above threshold, cooldown is cleared

### Example:
1. Product A stock drops to 5 → Email sent ✅
2. Product A stock drops to 3 (within 1 hour) → No email (cooldown) ⏳
3. Product A stock drops to 2 (after 1 hour) → Email sent ✅
4. Product A stock increases to 15 → Cooldown cleared ✅

## Email Content

Each email includes:
- **Header**: Alert count and urgency indicator
- **Product List**: All low stock items with:
  - Product name
  - Category
  - Current stock (highlighted in red)
  - Price
  - Supplier information
- **Professional Formatting**: HTML email with styling
- **Plain Text Fallback**: For email clients that don't support HTML

## Testing

### Test Endpoint
```bash
GET http://localhost:5000/api/test-low-stock-email
```

This will:
- Check for low stock items
- Send email if any found
- Return JSON response with status

### Manual Testing Steps

1. **Create a product with low stock:**
   ```bash
   POST /api/products
   {
     "name": "Test Product",
     "stock": 5,
     "price": 10.00
   }
   ```
   → Should receive email immediately

2. **Update stock to low:**
   ```bash
   PUT /api/products/:id
   {
     "stock": 3
   }
   ```
   → Should receive email immediately

3. **Record a sale that reduces stock:**
   ```bash
   POST /api/sales
   {
     "product": "product_id",
     "quantity": 8
   }
   ```
   → Should receive email if stock drops below threshold

## Monitoring

### Console Logs

Watch for these messages in your server console:

**Success:**
```
✅ Low stock alert email sent for 3 product(s)
Email sent successfully to: admin@example.com
```

**Cooldown:**
```
⏳ Skipping email for Product Name - cooldown active
```

**Errors:**
```
❌ Error checking low stock: [error message]
⚠️  ADMIN_EMAIL not configured - cannot send low stock alert
```

## Troubleshooting

### Email Not Sending?

1. **Check Environment Variables**
   - Verify `EMAIL_USER`, `EMAIL_PASS`, and `ADMIN_EMAIL` are set
   - Check `.env` file is loaded correctly

2. **Check Console Logs**
   - Look for error messages
   - Verify email configuration

3. **Test Email Connection**
   - Use test endpoint: `/api/test-low-stock-email`
   - Check spam folder

4. **Verify Stock Levels**
   - Make sure products actually have stock < threshold
   - Check threshold value in `.env`

### Too Many Emails?

- Cooldown system prevents spam (1 hour per product)
- If you need to adjust, modify `EMAIL_COOLDOWN_MS` in `utils/lowStockChecker.js`

### Want to Disable Real-Time Alerts?

Comment out the low stock checks in:
- `controllers/productController.js` (create/update functions)
- `controllers/saleController.js` (createSale function)

The scheduled job will still run daily at 9:00 AM.

## Benefits

✅ **Immediate Alerts** - Know about low stock right away
✅ **No Manual Checks** - Fully automated
✅ **Smart System** - Prevents email spam
✅ **Comprehensive** - Shows all low stock items in one email
✅ **Reliable** - Scheduled backup ensures nothing is missed

## Next Steps

1. Configure email settings in `.env`
2. Test with the test endpoint
3. Create/update a product with low stock to see it in action
4. Monitor console logs for confirmation

Your inventory system now has real-time low stock monitoring! 🎉



