const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SIAKAD MUSA API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/hero-slides', require('./routes/heroSlide.routes'));
app.use('/api/school-profile', require('./routes/schoolProfile.routes'));
app.use('/api/school-facilities', require('./routes/schoolFacility.routes'));
app.use('/api/extracurriculars', require('./routes/extracurricular.routes'));
app.use('/api/school-activities', require('./routes/schoolActivity.routes'));
app.use('/api/school-achievements', require('./routes/schoolAchievement.routes'));
app.use('/api/articles', require('./routes/article.routes'));
app.use('/api/school-programs', require('./routes/schoolProgram.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/teachers', require('./routes/teacher.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.testConnection();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
      console.log(`✓ API URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
