const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Auth MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('Auth MongoDB Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
