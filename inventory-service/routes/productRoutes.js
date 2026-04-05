const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const productCtrl = require('../controllers/productController');

router.get('/', protect, productCtrl.getAll);
router.get('/low-stock', protect, productCtrl.getLowStock);
router.get('/:id', protect, productCtrl.getById);
router.post('/', protect, productCtrl.create);
router.put('/:id', protect, productCtrl.update);
router.delete('/:id', protect, productCtrl.remove);

module.exports = router;

