const mongoose = require('mongoose');

const producedTransactSchema = new mongoose.Schema({
  // Link back to the Product
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  // Product name snapshot at the time of transaction
  name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  price: {
    type: Number,
    required: true,
  },
  // e.g. "purchase", "return", etc.
  type: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
}, {
  timestamps: true,
});

// Prevent OverwriteModelError with nodemon / repeated imports
module.exports = mongoose.models.ProducedTransact || mongoose.model('ProducedTransact', producedTransactSchema);











