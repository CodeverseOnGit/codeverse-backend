const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST create new chapter
router.post('/', async (req, res) => {
  try {
    const { module_id, title, content } = req.body;

    if (!module_id || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO chapters (module_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [module_id, title, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;