const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public
router.post('/register', register);
router.post('/login', login);

// Example: Protected route
router.get('/me', protect, (req, res) => {
  res.json({ message: "You are authenticated", user: req.user });
});

// Example: Admin-only route
router.get('/admin', protect, adminOnly, (req, res) => {
  res.json({ message: "Welcome Admin" });
});

module.exports = router;
