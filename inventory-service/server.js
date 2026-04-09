require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/productions', require('./routes/productionRoutes'));
app.use('/api/produced-transactions', require('./routes/producedTransactRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'INVENTORY_OK' });
});

const PORT = process.env.PORT || 5003;
app.set('trust proxy', 1);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Inventory service running on port ${PORT}`);
});

