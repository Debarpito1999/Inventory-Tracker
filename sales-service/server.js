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

app.use('/api/sales', require('./routes/saleRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'SALES_OK' });
});

const PORT = process.env.PORT || 5004;
app.set('trust proxy', 1);
app.listen(PORT, () => {
  console.log(`Sales service running on port ${PORT}`);
});

