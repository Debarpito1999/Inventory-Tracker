const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const sellerController = require('../controllers/sellerController');

router.get('/', protect, sellerController.getAllSellers);
router.post('/', protect, sellerController.createSeller);
router.put('/:id', protect, sellerController.updateSeller);
router.delete('/:id', protect, sellerController.deleteSeller);

module.exports = router;

