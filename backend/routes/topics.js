const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// @route   GET /api/topics
// @desc    Get all topics
// @access  Public
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM topics ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/topics/:id
// @desc    Get single topic with modules
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get topic
    const topicResult = await pool.query('SELECT * FROM topics WHERE id = $1', [id]);
    
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const topic = topicResult.rows[0];

    // Get modules for this topic
    const modulesResult = await pool.query(
      'SELECT * FROM modules WHERE topic_id = $1 ORDER BY order_index, id',
      [id]
    );

    topic.modules = modulesResult.rows;

    res.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/topics
// @desc    Create a new topic
// @access  Admin only
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO topics (title, description) VALUES ($1, $2) RETURNING *',
      [title, description || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/topics/:id
// @desc    Update a topic
// @access  Admin only
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'UPDATE topics SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [title, description || '', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/topics/:id
// @desc    Delete a topic
// @access  Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
