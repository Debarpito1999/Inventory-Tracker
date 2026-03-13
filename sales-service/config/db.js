const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Sales MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('Sales MongoDB Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
