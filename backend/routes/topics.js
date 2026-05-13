const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all topics
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM topics ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;