const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const sellerController = require('../controllers/sellerController');

router.get('/', protect, sellerController.getAllSellers);
router.post('/', protect, admin, sellerController.createSeller);
router.put('/:id', protect, admin, sellerController.updateSeller);
router.delete('/:id', protect, admin, sellerController.deleteSeller);

module.exports = router;

