const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to lab-08 Backend API',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('=================================');
  console.log(' lab-08 Server running on:');
  console.log(` http://localhost:${PORT}`);
  console.log('=================================');
});
