const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const { generateAIResponse } = require('../utils/ai');
const User = require('../models/User');

// Generate Aptitude Questions
router.post('/aptitude/generate', authMiddleware, async (req, res) => {
  const { difficulty = 'Medium' } = req.body;
  
  const prompt = `You are a professional aptitude test creator. Generate 10 multiple-choice questions for a competitive placement exam.
   Difficulty: ${difficulty}
   Topics: Mix of Quantitative, Logical Reasoning, and Verbal Ability.
  
  Return ONLY valid JSON:
  {
    "questions": [
      {
        "id": 1,
        "topic": "Quantitative",
        "question": "Question text...",
        "options": ["A", "B", "C", "D"],
        "correct": 0,
        "explanation": "Why..."
      }
    ]
  }`;

  try {
    const result = await generateAIResponse(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate aptitude questions' });
  }
});

// Generate SQL Challenge
router.post('/sql/generate', authMiddleware, async (req, res) => {
  const prompt = `You are a Database Architect. Generate a SQL challenge for a student.
  1. Provide a "Scenario" (e.g., E-commerce orders).
  2. Provide "Schema" details (Tables and columns).
  3. Provide a specific "Task" (e.g., "Find the top 3 customers by total spend in 2023").
  
  Return ONLY valid JSON:
  {
    "scenario": "...",
    "schema": "...",
    "task": "...",
    "solutionHint": "...",
    "tables": ["Orders", "Customers"]
  }`;

  try {
    const result = await generateAIResponse(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate SQL challenge' });
  }
});

// Validate SQL Answer
router.post('/sql/validate', authMiddleware, async (req, res) => {
  const { task, schema, userSql } = req.body;
  
  const prompt = `You are a SQL Code Reviewer. 
  Task: ${task}
  Schema: ${schema}
  User's SQL: ${userSql}
  
  Evaluate if the user's SQL is correct for the task.
  Provide a score (0-10) and detailed optimization tips.
  
  Return ONLY valid JSON:
  {
    "correct": true/false,
    "score": 8,
    "feedback": "...",
    "optimization": "Use an Index on order_date to speed up the query...",
    "optimizedSql": "SELECT ... FROM ..."
  }`;

  try {
    const result = await generateAIResponse(prompt);
    if (result.correct) {
      const user = await User.findById(req.user.id);
      user.xp += 25;
      user.level = Math.floor(user.xp / 100) + 1;
      await user.save();
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to validate SQL' });
  }
});

module.exports = router;
