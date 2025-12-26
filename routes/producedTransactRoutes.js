const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createTransaction,
  getAll,
  getByProduct,
} = require('../controllers/producedTransactController');

// List transactions (optional filters: startDate, endDate, productId)
router.get('/', protect, adminOnly, getAll);

// Create a new transaction for a product and update its stock
router.post('/', protect, adminOnly, createTransaction);

// List transactions for a specific product
router.get('/product/:productId', protect, adminOnly, getByProduct);

module.exports = router;


