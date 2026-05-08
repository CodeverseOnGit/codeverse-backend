const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// @route   GET /api/chapters/:id
// @desc    Get single chapter with quiz questions
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get chapter
    const chapterResult = await pool.query('SELECT * FROM chapters WHERE id = $1', [id]);
    
    if (chapterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    const chapter = chapterResult.rows[0];

    // Get quiz questions for this chapter
    const questionsResult = await pool.query(
      'SELECT * FROM quiz_questions WHERE chapter_id = $1 ORDER BY order_index, id',
      [id]
    );

    chapter.quiz_questions = questionsResult.rows;

    res.json(chapter);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chapters
// @desc    Create a new chapter
// @access  Admin only
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { module_id, title, content, order_index } = req.body;

    if (!module_id || !title || !content) {
      return res.status(400).json({ error: 'Module ID, title, and content are required' });
    }

    const result = await pool.query(
      'INSERT INTO chapters (module_id, title, content, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [module_id, title, content, order_index || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/chapters/:id
// @desc    Update a chapter
// @access  Admin only
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, order_index } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await pool.query(
      'UPDATE chapters SET title = $1, content = $2, order_index = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, content, order_index || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/chapters/:id
// @desc    Delete a chapter
// @access  Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM chapters WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
