const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const productionCtrl = require('../controllers/productionController');

router.get('/', protect, productionCtrl.getAll);
router.get('/stats', protect, productionCtrl.getStats);
router.get('/date-range', protect, productionCtrl.getByDateRange);
router.get('/date/:date', protect, productionCtrl.getByDate);
router.post('/', protect, admin, productionCtrl.create);

module.exports = router;


