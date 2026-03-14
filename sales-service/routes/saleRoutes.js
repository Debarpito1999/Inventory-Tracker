const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const saleController = require('../controllers/saleController');

router.get('/', protect, saleController.getSales);
router.post('/', protect, saleController.createSale);

module.exports = router;

