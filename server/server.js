// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');
const queueService = require('./services/queueService');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000', // or '*' for all, but not recommended for production
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      queueService.startQueueProcessor(); // Start background queue
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
