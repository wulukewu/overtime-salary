const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const calculateOvertimePay = require('./overtimeCalculator');
const initDatabase = require('./database');
const userRoutes = require('./routes/userRoutes');
const overtimeRoutes = require('./overtimeRoutes');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api', overtimeRoutes);
app.use('/api/users', userRoutes);

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

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
