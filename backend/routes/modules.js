const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET modules by topic (PRIMARY FOR SIDEBAR)
router.get('/by-topic/:topicId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM modules WHERE topic_id = $1 ORDER BY order_index, id',
      [req.params.topicId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;