const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Optional authentication middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// POST create new module
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { topic_id, title, description, order_index } = req.body;

    if (!topic_id) {
      return res.status(400).json({ error: 'Topic ID is required' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Module title is required' });
    }

    // Check if topic exists
    const topicCheck = await pool.query(
      'SELECT id FROM topics WHERE id = $1',
      [topic_id]
    );

    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Insert module
    const result = await pool.query(
      'INSERT INTO modules (topic_id, title, description, order_index, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [topic_id, title.trim(), description || '', order_index || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Server error creating module' });
  }
});

// GET all modules
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM modules ORDER BY topic_id, order_index, id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Server error fetching modules' });
  }
});

// GET modules by topic (PRIMARY FOR SIDEBAR)
router.get('/by-topic/:topicId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM modules WHERE topic_id = $1 ORDER BY order_index, id',
      [req.params.topicId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching modules by topic:', error);
    res.status(500).json({ error: 'Server error fetching modules' });
  }
});

// GET module by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM modules WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Module not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Server error fetching module' });
  }
});

// GET chapters for a module
router.get('/:id/chapters', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chapters WHERE module_id = $1 ORDER BY order_index, id',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chapters for module:', error);
    res.status(500).json({ error: 'Server error fetching chapters' });
  }
});

// PUT update module
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const { title, description, order_index } = req.body;
    const { id } = req.params;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Module title is required' });
    }

    const result = await pool.query(
      'UPDATE modules SET title = $1, description = $2, order_index = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [title.trim(), description || '', order_index || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Server error updating module' });
  }
});

// DELETE module
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM modules WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({ message: 'Module deleted successfully', module: result.rows[0] });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Server error deleting module' });
  }
});

module.exports = router;