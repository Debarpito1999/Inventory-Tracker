const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  contactEmail: String,
  phone: String,
  address: String,
});

module.exports = mongoose.model('Supplier', supplierSchema);
