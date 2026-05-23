const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/database');

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const topicsRoutes = require('./routes/topics');
const modulesRoutes = require('./routes/modules');
const chaptersRoutes = require('./routes/chapters');
const quizRoutes = require('./routes/quiz');

// Initialize database on startup
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔧 Initializing database...');
    
    // Create tables (same code from setupDatabase.js)
    await client.query('CREATE TABLE IF NOT EXISTS users (...)');
    // ... rest of table creation
    
    console.log('✓ Database initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  } finally {
    client.release();
  }
};

// Run setup then start server
initializeDatabase().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/modules', require('./routes/modules'));
app.use('/api/chapters', require('./routes/chapters'));
app.use('/api/quiz', require('./routes/quiz'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Tutorial Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tutorial Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      topics: '/api/topics',
      modules: '/api/modules',
      chapters: '/api/chapters',
      quiz: '/api/quiz'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🎓 Tutorial Platform API Server                     ║
║                                                            ║
║        Server running on port ${PORT}                          ║
║        Environment: ${process.env.NODE_ENV || 'development'}                        ║
║                                                            ║
║        📡 API: http://localhost:${PORT}/api                   ║
║        🏥 Health: http://localhost:${PORT}/api/health         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
