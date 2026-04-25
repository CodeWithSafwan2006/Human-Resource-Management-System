const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Test route — check karo server chal raha hai
app.get('/', (req, res) => {
  res.json({ message: 'HRMS Backend Running!' });
});

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/employees',  require('./routes/employees'));
app.use('/api/leaves',     require('./routes/leaves'));
app.use('/api/salary',     require('./routes/salary'));
app.use('/api/ai',         require('./routes/ai'));

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected!');
  })
  .catch(err => {
    console.log('❌ MongoDB Error:', err.message);
  });

// Start Server
app.listen(process.env.PORT || 5000, () =>
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
);