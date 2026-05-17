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

// POST create new chapter
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { module_id, title, content, order_index } = req.body;

    if (!module_id) {
      return res.status(400).json({ error: 'Module ID is required' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Chapter title is required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Chapter content is required' });
    }

    // Check if module exists
    const moduleCheck = await pool.query(
      'SELECT id FROM modules WHERE id = $1',
      [module_id]
    );

    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const result = await pool.query(
      'INSERT INTO chapters (module_id, title, content, order_index, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [module_id, title.trim(), content, order_index || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({ error: 'Server error creating chapter' });
  }
});

// GET all chapters
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chapters ORDER BY module_id, order_index, id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Server error fetching chapters' });
  }
});

// GET chapters by module (PRIMARY FOR SIDEBAR)
router.get('/by-module/:moduleId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chapters WHERE module_id = $1 ORDER BY order_index, id',
      [req.params.moduleId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chapters by module:', error);
    res.status(500).json({ error: 'Server error fetching chapters' });
  }
});

// GET chapter by id (includes quiz)
router.get('/:id', async (req, res) => {
  try {
    const chapter = await pool.query(
      'SELECT * FROM chapters WHERE id = $1',
      [req.params.id]
    );

    if (chapter.rows.length === 0)
      return res.status(404).json({ error: 'Chapter not found' });

    const quiz = await pool.query(
      'SELECT * FROM quiz_questions WHERE chapter_id = $1 ORDER BY order_index, id',
      [req.params.id]
    );

    const result = chapter.rows[0];
    result.quiz_questions = quiz.rows;

    res.json(result);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: 'Server error fetching chapter' });
  }
});

// PUT update chapter
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const { title, content, order_index } = req.body;
    const { id } = req.params;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Chapter title is required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Chapter content is required' });
    }

    const result = await pool.query(
      'UPDATE chapters SET title = $1, content = $2, order_index = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [title.trim(), content, order_index || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ error: 'Server error updating chapter' });
  }
});

// DELETE chapter
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM chapters WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json({ message: 'Chapter deleted successfully', chapter: result.rows[0] });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ error: 'Server error deleting chapter' });
  }
});

module.exports = router;