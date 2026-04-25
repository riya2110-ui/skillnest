const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const { generateAIResponse } = require('../utils/ai');

// Generate a 5-question quiz for a specific task
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { weekFocus, taskText } = req.body;
    const user = await User.findById(req.user._id).select('profile');
    const role = user.profile?.role || 'Software Developer';

    const prompt = `You are a JSON API. You must respond with valid JSON only. No text before or after. No markdown. No thinking tags.

You are a tech tutor creating a quick verification quiz.

Context:
- Student is preparing for: ${role}
- Current week focus: ${weekFocus}
- Task they claim to have completed: "${taskText}"

Generate exactly 5 multiple-choice questions to verify the student actually understood and completed this task.
Questions should be practical and test real understanding, not just memorization.
Mix difficulty: 2 easy, 2 medium, 1 hard.

Return ONLY this JSON. Start with {:
{
  "questions": [
    {
      "question": "Clear, specific question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

RULES:
- "correct" is the 0-based index of the correct option
- Each question must have exactly 4 options
- Explanations should be concise but educational
- Questions must be directly related to the task topic
- Return ONLY valid JSON, start with { directly.`;

    const result = await generateAIResponse(prompt);
    
    if (!result.questions || result.questions.length !== 5) {
      return res.status(500).json({ error: 'Quiz generation failed - invalid format' });
    }

    res.json(result);
  } catch (err) {
    console.error('Quiz generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Verify quiz answers and award XP
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { weekIndex, taskIndex, answers, questions } = req.body;
    
    // Calculate score
    let correct = 0;
    const results = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correct;
      if (isCorrect) correct++;
      return {
        question: q.question,
        yourAnswer: q.options[answers[i]],
        correctAnswer: q.options[q.correct],
        isCorrect,
        explanation: q.explanation
      };
    });

    const score = correct;
    const passed = score >= 3;
    const isPerfect = score === 5;
    const baseXP = 20;
    const bonusXP = isPerfect ? 10 : 0;
    const totalXP = passed ? baseXP + bonusXP : 0;

    if (passed) {
      const user = await User.findById(req.user._id);

      // Mark task as completed in roadmap
      const updatePath = `roadmap.roadmap.${weekIndex}.tasks.${taskIndex}`;
      const currentTask = user.roadmap?.roadmap?.[weekIndex]?.tasks?.[taskIndex];
      
      if (typeof currentTask === 'string') {
        // Convert string task to object
        await User.findByIdAndUpdate(req.user._id, {
          $set: { [updatePath]: { text: currentTask, completed: true, quizScore: score } }
        });
      } else {
        await User.findByIdAndUpdate(req.user._id, {
          $set: {
            [`${updatePath}.completed`]: true,
            [`${updatePath}.quizScore`]: score
          }
        });
      }

      // Update XP and Level
      user.xp = (user.xp || 0) + totalXP;
      user.level = Math.floor(user.xp / 100) + 1;
      user.confidenceScore = Math.min(100, (user.confidenceScore || 0) + 2);
      
      // Check if all tasks in week are completed for badge
      const updatedUser = await User.findById(req.user._id);
      const weekData = updatedUser.roadmap?.roadmap?.[weekIndex];
      const allTasksDone = weekData?.tasks?.every(t => t.completed === true);
      
      if (allTasksDone && !user.badges.includes('First Step 🏅')) {
        user.badges.push('First Step 🏅');
      }

      await user.save();

      // Recalculate roadmap progress
      const roadmapArr = updatedUser.roadmap?.roadmap || [];
      const completedWeeks = roadmapArr.filter(w =>
        w.tasks && w.tasks.length > 0 && w.tasks.every(t => t.completed === true)
      ).length;
      const progress = roadmapArr.length > 0 ? Math.round((completedWeeks / roadmapArr.length) * 100) : 0;
      await User.findByIdAndUpdate(req.user._id, { $set: { roadmapProgress: progress } });

      // Fetch updated user
      const freshUser = await User.findById(req.user._id).select('-password');

      res.json({
        passed: true,
        score,
        totalXP,
        bonusXP,
        isPerfect,
        results,
        user: freshUser
      });
    } else {
      res.json({
        passed: false,
        score,
        totalXP: 0,
        results,
        message: `You scored ${score}/5. You need at least 3/5 to pass. Review the explanations and try again!`
      });
    }
  } catch (err) {
    console.error('Quiz verify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
