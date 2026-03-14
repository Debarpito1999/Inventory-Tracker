const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const productCtrl = require('../controllers/productController');

router.get('/', protect, productCtrl.getAll);
router.post('/', protect, productCtrl.create);
router.put('/:id', protect, productCtrl.update);
router.delete('/:id', protect, productCtrl.remove);
router.get('/low-stock', protect, productCtrl.getLowStock);

module.exports = router;

