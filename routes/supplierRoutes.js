const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const supplierController = require('../controllers/supplierController');

router.get('/', protect, supplierController.getAllSuppliers);
router.post('/', protect, admin, supplierController.createSupplier);
router.put('/:id', protect, admin, supplierController.updateSupplier);
router.delete('/:id', protect, admin, supplierController.deleteSupplier);

module.exports = router;









