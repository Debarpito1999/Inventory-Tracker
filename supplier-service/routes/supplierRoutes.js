const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const supplierController = require('../controllers/supplierController');

router.get('/', protect, supplierController.getAllSuppliers);
router.post('/', protect, supplierController.createSupplier);
router.get('/:id', protect, supplierController.getSupplierById);
router.put('/:id', protect, supplierController.updateSupplier);
router.delete('/:id', protect, supplierController.deleteSupplier);

module.exports = router;

