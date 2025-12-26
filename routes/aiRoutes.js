const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getReorderSuggestion } = require("../controllers/aiController");

router.get("/reorder/:id", protect, adminOnly, getReorderSuggestion);

module.exports = router;
