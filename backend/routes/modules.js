const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// @route   GET /api/modules/:id
// @desc    Get single module with chapters
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get module
    const moduleResult = await pool.query('SELECT * FROM modules WHERE id = $1', [id]);
    
    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const module = moduleResult.rows[0];

    // Get chapters for this module
    const chaptersResult = await pool.query(
      'SELECT * FROM chapters WHERE module_id = $1 ORDER BY order_index, id',
      [id]
    );

    module.chapters = chaptersResult.rows;

    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/modules
// @desc    Create a new module
// @access  Admin only
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { topic_id, title, description, order_index } = req.body;

    if (!topic_id || !title) {
      return res.status(400).json({ error: 'Topic ID and title are required' });
    }

    const result = await pool.query(
      'INSERT INTO modules (topic_id, title, description, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [topic_id, title, description || '', order_index || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/modules/:id
// @desc    Update a module
// @access  Admin only
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order_index } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'UPDATE modules SET title = $1, description = $2, order_index = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, description || '', order_index || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/modules/:id
// @desc    Delete a module
// @access  Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM modules WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
