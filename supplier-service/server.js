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

app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/sellers', require('./routes/sellerRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'SUPPLIER_OK' });
});

const PORT = process.env.PORT || 5005;
app.set('trust proxy', 1);
app.listen(PORT, () => {
  console.log(`Supplier service running on port ${PORT}`);
});

