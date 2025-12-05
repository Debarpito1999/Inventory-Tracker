const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactEmail: String,
  phone: String,
  address: String,
});

module.exports = mongoose.model('Seller', sellerSchema);

