const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const calculateOvertimePay = require('./overtimeCalculator');
const { initDatabase } = require('./database');
const userRoutes = require('./routes/userRoutes');
const overtimeRoutes = require('./overtimeRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Load environment variables
require('dotenv').config();

// Trust proxy if behind reverse proxy
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// Disable host check
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Configure CORS
app.use(
  cors({
    origin: '*', // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Handle OPTIONS requests explicitly
app.options('*', cors());

app.use(bodyParser.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/groups', groupRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Simple overtime calculation endpoint (for testing)
app.post('/api/calculate', (req, res) => {
  const { salary, endHour, minutes } = req.body;

  if (
    typeof salary !== 'number' ||
    typeof endHour !== 'number' ||
    typeof minutes !== 'number'
  ) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  const result = calculateOvertimePay(salary, endHour, minutes);
  res.json({ result });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
