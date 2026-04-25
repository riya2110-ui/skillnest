const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const { generateAIResponse } = require('../utils/ai');

// Mark a mission complete (accepts both POST and PATCH)
router.post('/complete', authMiddleware, async (req, res) => {
  try {
    const { missionText, xpReward, type } = req.body;
    const user = await User.findById(req.user._id);
    const today = new Date().toISOString().split('T')[0];
    
    const missionId = today + ':' + missionText;
    
    if (!user.completedMissions.includes(missionId)) {
      user.completedMissions.push(missionId);
      
      // Update XP and Level
      user.xp += xpReward || 10;
      user.level = Math.floor(user.xp / 100) + 1;
      
      // Update Confidence Score (Legacy support)
      user.confidenceScore = Math.min(100, user.confidenceScore + Math.floor((xpReward || 10) / 5));

      // Streak Logic
      const todayMissions = user.roadmap?.daily_missions || [];
      const completedToday = user.completedMissions.filter(m => m.startsWith(today + ':'));
      
      if (completedToday.length === todayMissions.length && todayMissions.length > 0) {
        // Check if lastActive was yesterday to increment streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (user.lastActiveDate === yesterdayStr) {
          user.streakDays += 1;
        } else if (user.lastActiveDate !== today) {
          user.streakDays = 1;
        }

        // Badge: 7-day streak = "On Fire" 🔥
        if (user.streakDays >= 7 && !user.badges.includes('On Fire 🔥')) {
          user.badges.push('On Fire 🔥');
        }
        
        // Badge: first week complete = "First Step" 🏅
        if (user.streakDays >= 1 && !user.badges.includes('First Step 🏅')) {
          user.badges.push('First Step 🏅');
        }
      }

      user.lastActiveDate = today;
      await user.save();
    }
    
    const freshUser = await User.findById(req.user._id).select('-password');
    
    // Check if all daily missions completed today
    const todayMissions = user.roadmap?.daily_missions || [];
    const completedToday = freshUser.completedMissions.filter(m => m.startsWith(new Date().toISOString().split('T')[0] + ':'));
    const dailyCompleted = completedToday.length >= todayMissions.length && todayMissions.length > 0;
    
    res.json({ 
      user: freshUser,
      dailyCompleted,
      xp: freshUser.xp, 
      level: freshUser.level, 
      streakDays: freshUser.streakDays,
      badges: freshUser.badges,
      completedMissions: freshUser.completedMissions 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh missions via Gemini (OpenRouter specific as configured)
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const week = user.roadmap?.roadmap?.[0]?.week || 1;
    const role = user.profile?.role || "Software Developer";
    
    const prompt = `You are a JSON API. You must respond with valid JSON only. No text before or after. No markdown.
The student is currently on week ${week} of their ${role} preparation roadmap. 
Generate 3 entirely fresh daily missions for today:
1. "Learn" task (Concepts/Theory) - 10 XP
2. "Practice" task (Coding/Labs) - 20 XP
3. "Build" task (Project/Feature) - 30 XP

Return ONLY a valid JSON object:
{
  "tasks": [
    { "type": "Learn", "text": "...", "xp": 10 },
    { "type": "Practice", "text": "...", "xp": 20 },
    { "type": "Build", "text": "...", "xp": 30 }
  ]
}
IMPORTANT: Return ONLY the JSON object. Start your response with { directly.`;

    const result = await generateAIResponse(prompt);
    const missions = result.tasks;
    
    if (!user.roadmap) user.roadmap = {};
    user.roadmap.daily_missions = missions;
    
    // Mongoose needs marking modified for mixed types
    user.markModified('roadmap');
    await user.save();
    
    res.json({ daily_missions: missions });
  } catch (err) {
    console.error("FULL ERROR:", err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
