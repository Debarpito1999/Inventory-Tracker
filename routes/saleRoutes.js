const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const saleController = require("../controllers/saleController");

// Get all sales for current user
router.get("/", protect, async (req, res) => {
  const Sale = require("../Models/Sale");
  const sales = await Sale.find({ user: req.user._id }).populate("product").populate("seller");
  res.json(sales);
});

// Create sale (reduce stock automatically)
router.post("/", protect, saleController.createSale);

module.exports = router;
