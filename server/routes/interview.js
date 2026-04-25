const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

// Save interview session result
router.post('/save', auth, async (req, res) => {
  try {
    const { topic, difficulty, question, answer, score } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.interviewHistory) user.interviewHistory = [];
    user.interviewHistory.unshift({
      topic,
      difficulty,
      question,
      answer,
      score,
      date: new Date().toISOString()
    });
    // Keep last 50 only
    user.interviewHistory = user.interviewHistory.slice(0, 50);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
