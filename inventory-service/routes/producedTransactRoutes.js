const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTransaction,
  getAll,
  getByProduct
} = require('../controllers/producedTransactController');

router.get('/', protect, getAll);
router.post('/', protect, createTransaction);
router.get('/product/:productId', protect, getByProduct);

module.exports = router;

