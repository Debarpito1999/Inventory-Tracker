const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTransaction,
  getAll,
  getByProduct,
} = require('../controllers/producedTransactController');

// List transactions (optional filters: startDate, endDate, productId)
router.get('/', protect, getAll);

// Create a new transaction for a product and update its stock
router.post('/', protect, createTransaction);

// List transactions for a specific product
router.get('/product/:productId', protect, getByProduct);

module.exports = router;

