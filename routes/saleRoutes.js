const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const saleController = require("../controllers/saleController");

// Get all sales (admin only)
router.get("/", protect, admin, async (req, res) => {
  const Sale = require("../Models/Sale");
  const sales = await Sale.find().populate("product").populate("seller");
  res.json(sales);
});

// Create sale (reduce stock automatically)
router.post("/", protect, saleController.createSale);

module.exports = router;


