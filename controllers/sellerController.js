const Seller = require("../Models/Seller");

// Get all sellers
exports.getAllSellers = async (req, res) => {
  const sellers = await Seller.find({ user: req.user._id });
  res.json(sellers);
};

// Create seller
exports.createSeller = async (req, res) => {
  const seller = await Seller.create({
    ...req.body,
    user: req.user._id
  });
  res.status(201).json(seller);
};

// Update seller
exports.updateSeller = async (req, res) => {
  const updated = await Seller.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { ...req.body, user: req.user._id },
    { new: true }
  );
  if (!updated) {
    return res.status(404).json({ message: "Seller not found" });
  }

  res.json(updated);
};

// Delete seller
exports.deleteSeller = async (req, res) => {
  const deleted = await Seller.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) {
    return res.status(404).json({ message: "Seller not found" });
  }

  res.json({ message: "Seller removed" });
};




