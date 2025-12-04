const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const productCtrl = require('../controllers/productController.js');

router.get('/', protect, productCtrl.getAll);
router.post('/', protect, admin, productCtrl.create);
router.put('/:id', protect, admin, productCtrl.update);
router.delete('/:id', protect, admin, productCtrl.remove);
router.get('/low-stock', protect, productCtrl.getLowStock);

module.exports = router;
