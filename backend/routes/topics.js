const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Optional authentication middleware - allows requests with or without token
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

// POST create new topic (with optional auth - allows creation without login)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Topic title is required' });
    }

    const result = await pool.query(
      'INSERT INTO topics (title, description, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [title.trim(), description || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Server error creating topic' });
  }
});

// GET all topics
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM topics ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Server error fetching topics' });
  }
});

// GET topic by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM topics WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Topic not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Server error fetching topic' });
  }
});

// GET modules under topic (IMPORTANT FOR SIDEBAR)
router.get('/:id/modules', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM modules WHERE topic_id = $1 ORDER BY order_index, id',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching modules for topic:', error);
    res.status(500).json({ error: 'Server error fetching modules' });
  }
});

// PUT update topic
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const { title, description } = req.body;
    const { id } = req.params;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Topic title is required' });
    }

    const result = await pool.query(
      'UPDATE topics SET title = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title.trim(), description || '', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: 'Server error updating topic' });
  }
});

// DELETE topic
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM topics WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json({ message: 'Topic deleted successfully', topic: result.rows[0] });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Server error deleting topic' });
  }
});

module.exports = router;