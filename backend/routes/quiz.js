const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// @route   POST /api/quiz/questions
// @desc    Create a quiz question
// @access  Public
router.post('/questions', async (req, res) => {
  try {
    const { chapter_id, question, options, correct_answer, explanation, order_index } = req.body;

    if (!chapter_id || !question || !options || correct_answer === undefined) {
      return res.status(400).json({ 
        error: 'Chapter ID, question, options, and correct answer are required' 
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Options must be an array with at least 2 choices' });
    }

    const result = await pool.query(
      `INSERT INTO quiz_questions (chapter_id, question, options, correct_answer, explanation, order_index) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [chapter_id, question, JSON.stringify(options), correct_answer, explanation || '', order_index || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating quiz question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/quiz/questions/:id
// @desc    Update a quiz question
// @access  Admin only
router.put('/questions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, options, correct_answer, explanation, order_index } = req.body;

    if (!question || !options || correct_answer === undefined) {
      return res.status(400).json({ 
        error: 'Question, options, and correct answer are required' 
      });
    }

    const result = await pool.query(
      `UPDATE quiz_questions 
       SET question = $1, options = $2, correct_answer = $3, explanation = $4, order_index = $5 
       WHERE id = $6 RETURNING *`,
      [question, JSON.stringify(options), correct_answer, explanation || '', order_index || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating quiz question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/quiz/questions/:id
// @desc    Delete a quiz question
// @access  Admin only
router.delete('/questions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM quiz_questions WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/quiz/submit
// @desc    Submit quiz answers and get score
// @access  Private (requires authentication)
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { chapter_id, answers } = req.body;
    const userId = req.user.userId;

    if (!chapter_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Chapter ID and answers array are required' });
    }

    // Get all questions for this chapter
    const questionsResult = await pool.query(
      'SELECT * FROM quiz_questions WHERE chapter_id = $1 ORDER BY order_index, id',
      [chapter_id]
    );

    const questions = questionsResult.rows;
    
    if (questions.length === 0) {
      return res.status(404).json({ error: 'No quiz found for this chapter' });
    }

    // Calculate score
    let score = 0;
    const results = questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correct_answer;
      
      if (isCorrect) {
        score++;
      }

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        explanation: question.explanation
      };
    });

    // Save quiz result
    await pool.query(
      'INSERT INTO quiz_results (user_id, chapter_id, score, total_questions) VALUES ($1, $2, $3, $4)',
      [userId, chapter_id, score, questions.length]
    );

    res.json({
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      results
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/quiz/results/:chapterId
// @desc    Get user's quiz history for a chapter
// @access  Private
router.get('/results/:chapterId', authenticateToken, async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT * FROM quiz_results 
       WHERE user_id = $1 AND chapter_id = $2 
       ORDER BY completed_at DESC`,
      [userId, chapterId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/quiz
// @desc    Create quiz question
// @access  Admin only
router.post("/", async (req, res) => {
  try {
    const {
      chapter_id,
      question,
      options,
      correct_answer,
      explanation,
      order_index
    } = req.body;

    if (
      !chapter_id ||
      !question ||
      !options ||
      correct_answer === undefined
    ) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const result = await pool.query(
      `INSERT INTO quiz_questions
      (
        chapter_id,
        question,
        options,
        correct_answer,
        explanation,
        order_index
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        chapter_id,
        question,
        JSON.stringify(options),
        correct_answer,
        explanation || "",
        order_index || 0
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creating quiz:", error);

    res.status(500).json({
      error: "Server error"
    });
  }
});

module.exports = router;
