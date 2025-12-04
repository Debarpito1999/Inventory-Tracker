const Supplier = require("../Models/Supplier");

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  const suppliers = await Supplier.find();
  res.json(suppliers);
};

// Create supplier
exports.createSupplier = async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json(supplier);
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  await Supplier.findByIdAndDelete(req.params.id);
  res.json({ message: "Supplier removed" });
};
