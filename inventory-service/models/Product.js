const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  type: { type: String, enum: ['raw', 'selling'], required: true, default: 'selling' },
  lastRestocked: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
