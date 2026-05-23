const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

// Force IPv4 DNS resolution
dns.setDefaultResultOrder('ipv4first');

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
    console.log('🔧 Setting up database...\n');
    console.log("DB URL:", process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')); // Hide password in logs

    // Drop existing tables (in correct order due to foreign keys)
    await client.query('DROP TABLE IF EXISTS quiz_results CASCADE');
    await client.query('DROP TABLE IF EXISTS quiz_questions CASCADE');
    await client.query('DROP TABLE IF EXISTS chapters CASCADE');
    await client.query('DROP TABLE IF EXISTS modules CASCADE');
    await client.query('DROP TABLE IF EXISTS topics CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✓ Dropped existing tables');

    // Create Users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created users table');

    // Create Topics table
    await client.query(`
      CREATE TABLE topics (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created topics table');

    // Create Modules table
    await client.query(`
      CREATE TABLE modules (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created modules table');

    // Create Chapters table
    await client.query(`
      CREATE TABLE chapters (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created chapters table');

    // Create Quiz Questions table
    await client.query(`
      CREATE TABLE quiz_questions (
        id SERIAL PRIMARY KEY,
        chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created quiz_questions table');

    // Create Quiz Results table
    await client.query(`
      CREATE TABLE quiz_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created quiz_results table');

    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await client.query(
      'INSERT INTO users (email, password, is_admin) VALUES ($1, $2, $3)',
      [process.env.ADMIN_EMAIL || 'admin@tutorial.com', hashedPassword, true]
    );
    console.log('✓ Created admin user');

    console.log('\n✅ Database setup completed successfully!\n');
    console.log('📧 Admin credentials:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@tutorial.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('\n⚠️  Please change these credentials after first login!\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

// Run setup then start server
const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  
  try {
    await initializeDatabase();
  } catch (dbError) {
    console.warn('⚠️  Database initialization failed. Server will run without database.');
    console.warn('Error:', dbError.message);
  }
  
  try {
    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/topics', topicsRoutes);
    app.use('/api/modules', modulesRoutes);
    app.use('/api/chapters', chaptersRoutes);
    app.use('/api/quiz', quizRoutes);

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

startServer();

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
