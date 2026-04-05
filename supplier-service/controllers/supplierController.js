const Supplier = require('../models/Supplier');

exports.getAllSuppliers = async (req, res) => {
  const suppliers = await Supplier.find({ user: req.user._id });
  res.json(suppliers);
};

exports.getSupplierById = async (req, res) => {
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!supplier) {
    return res.status(404).json({ message: 'Supplier not found' });
  }
  res.json(supplier);
};

exports.createSupplier = async (req, res) => {
  const supplier = await Supplier.create({
    ...req.body,
    user: req.user._id
  });
  res.status(201).json(supplier);
};

exports.updateSupplier = async (req, res) => {
  const updated = await Supplier.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { ...req.body, user: req.user._id },
    { new: true }
  );
  if (!updated) {
    return res.status(404).json({ message: 'Supplier not found' });
  }

  res.json(updated);
};

exports.deleteSupplier = async (req, res) => {
  const deleted = await Supplier.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) {
    return res.status(404).json({ message: 'Supplier not found' });
  }

  res.json({ message: 'Supplier removed' });
};

