const Seller = require("../Models/Seller");

// Get all sellers
exports.getAllSellers = async (req, res) => {
  const sellers = await Seller.find();
  res.json(sellers);
};

// Create seller
exports.createSeller = async (req, res) => {
  const seller = await Seller.create(req.body);
  res.status(201).json(seller);
};

// Update seller
exports.updateSeller = async (req, res) => {
  const updated = await Seller.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

// Delete seller
exports.deleteSeller = async (req, res) => {
  await Seller.findByIdAndDelete(req.params.id);
  res.json({ message: "Seller removed" });
};

