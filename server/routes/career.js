const express = require('express');
const router = express.Router();
const { generateAIResponse } = require('../utils/ai');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Onboarding: Analyze Skills & Save Profile
router.post('/onboard', authMiddleware, async (req, res) => {
  try {
    const { profile } = req.body;
    
    const prompt = `You are a JSON API. You must respond with valid JSON only. No text before or after. No markdown.
      You are an expert career coach for Indian engineering students.
      Student profile: ${JSON.stringify(profile)}

      Return ONLY a valid JSON object with:
      1. skill_gap: array of missing skills with priority (high/medium/low)
      2. roadmap: 8-week plan, each week has { week, focus, tasks: [] }
      3. confidence_score: 0-100 (initial estimate)
      4. daily_missions: 3 tasks for today based on their current skills

      Ensure the response is ONLY the JSON object, no markdown, no other text.
      IMPORTANT: Return ONLY the JSON object. Start your response with { or [ directly.
    `;

    const result = await generateAIResponse(prompt);
    
    // Save to user
    const user = await User.findByIdAndUpdate(req.user._id, {
      profile: profile,
      roadmap: result,
      confidenceScore: result.confidence_score || 0
    }, { new: true }).select('-password');

    res.json({ user, result });

  } catch (error) {
    console.error("FULL ERROR:", error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Update Confidence Score
router.post('/update-score', authMiddleware, async (req, res) => {
  try {
    const { points } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { $inc: { confidenceScore: points } }, 
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update score' });
  }
});

// Mock Interview: Get a set of 5 questions
router.post('/mock-interview/questions-set', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;
    const user = await User.findById(req.user._id);
    const role = user.profile?.targetRole || "Software Developer";
    const gaps = user.roadmap?.skill_gap?.map(g => g.skill).join(', ') || "No specific gaps";
    
    const prompt = `You are a JSON API. You must respond with valid JSON only. No text before or after. No markdown.
      Generate exactly 5 interview questions for a ${role} role ${type ? `specializing in ${type}` : ''}.
      Context: Candidate is from an Indian engineering college. Common weak areas to focus on: ${gaps}.
      
      Return ONLY a valid JSON object:
      {
        "questions": [
          { "id": 1, "text": "...", "context": "...", "expected_points": ["", "", ""] },
          { "id": 2, "text": "...", "context": "...", "expected_points": ["", "", ""] },
          { "id": 3, "text": "...", "context": "...", "expected_points": ["", "", ""] },
          { "id": 4, "text": "...", "context": "...", "expected_points": ["", "", ""] },
          { "id": 5, "text": "...", "context": "...", "expected_points": ["", "", ""] }
        ]
      }
      IMPORTANT: Return ONLY the JSON object. Start your response with { directly.
    `;
    const result = await generateAIResponse(prompt);
    res.json(result);
  } catch (error) {
    console.error("FULL ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mock Interview: Evaluate single answer
router.post('/mock-interview/evaluate', authMiddleware, async (req, res) => {
  try {
    const { question, answer, type } = req.body;
    const user = await User.findById(req.user._id);
    const role = user.profile?.targetRole || "Software Developer";

    const prompt = `You are a strict technical interviewer for a ${role} role. 
      Evaluate the candidate's response to this ${type || ''} question.
      Question: ${question}
      Answer: ${answer}

      Return ONLY a valid JSON object:
      {
        "score": 0-10 (integer),
        "feedback": "concise feedback on the answer",
        "improvement": "one specific technical tip to improve this exact answer",
        "isStrong": boolean
      }
      IMPORTANT: Return ONLY the JSON object. Start your response with { directly.
    `;
    const result = await generateAIResponse(prompt);
    res.json(result);
  } catch (error) {
    console.error("FULL ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mock Interview: Save session
router.post('/mock-interview/session-save', authMiddleware, async (req, res) => {
  try {
    const { type, score, questionBreakdown } = req.body;
    const user = await User.findById(req.user._id);
    
    const interviewResult = {
      date: new Date().toISOString(),
      type,
      score,
      questionBreakdown
    };

    if (!user.interviewHistory) user.interviewHistory = [];
    user.interviewHistory.unshift(interviewResult);
    
    // Update confidence score: existing * 0.7 + interview score * 3 (scaled to 100) * 0.3
    // Interview score is out of 10, so we scale to 100 by multiplying by 10.
    const scaledSessionScore = score * 10;
    user.confidenceScore = Math.round((user.confidenceScore * 0.7) + (scaledSessionScore * 0.3));
    
    await user.save();
    res.json({ success: true, newConfidenceScore: user.confidenceScore });
  } catch (error) {
    console.error("FULL ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
