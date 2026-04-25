const router = require('express').Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { generateAIResponse } = require('../utils/ai');

// ─── Industry Benchmarks ────────────────────────────────────────
const industryBenchmarks = {
  "SDE": {
    critical:   [{ skill:"DSA", level:"advanced" }, { skill:"System Design", level:"intermediate" }, { skill:"OOP", level:"intermediate" }, { skill:"SQL", level:"intermediate" }, { skill:"Git", level:"intermediate" }],
    important:  [{ skill:"React", level:"intermediate" }, { skill:"Node.js", level:"intermediate" }, { skill:"OS Concepts", level:"beginner" }, { skill:"Computer Networks", level:"beginner" }],
    niceToHave: [{ skill:"Docker", level:"beginner" }, { skill:"Cloud", level:"beginner" }, { skill:"CI/CD", level:"beginner" }]
  },
  "Software Developer": {
    critical:   [{ skill:"DSA", level:"advanced" }, { skill:"System Design", level:"intermediate" }, { skill:"OOP", level:"intermediate" }, { skill:"SQL", level:"intermediate" }, { skill:"Git", level:"intermediate" }],
    important:  [{ skill:"React", level:"intermediate" }, { skill:"Node.js", level:"intermediate" }, { skill:"OS Concepts", level:"beginner" }, { skill:"Computer Networks", level:"beginner" }],
    niceToHave: [{ skill:"Docker", level:"beginner" }, { skill:"Cloud", level:"beginner" }, { skill:"CI/CD", level:"beginner" }]
  },
  "DevOps Engineer": {
    critical:   [{ skill:"Linux", level:"intermediate" }, { skill:"Docker", level:"advanced" }, { skill:"CI/CD", level:"intermediate" }, { skill:"Cloud", level:"intermediate" }, { skill:"Scripting", level:"intermediate" }, { skill:"Git", level:"intermediate" }],
    important:  [{ skill:"Kubernetes", level:"intermediate" }, { skill:"Networking", level:"beginner" }, { skill:"Monitoring", level:"beginner" }, { skill:"Ansible", level:"beginner" }],
    niceToHave: [{ skill:"Terraform", level:"beginner" }, { skill:"Security", level:"beginner" }]
  },
  "Data Analyst": {
    critical:   [{ skill:"SQL", level:"advanced" }, { skill:"Python", level:"intermediate" }, { skill:"Excel", level:"intermediate" }, { skill:"Data Visualization", level:"intermediate" }],
    important:  [{ skill:"Statistics", level:"intermediate" }, { skill:"Power BI", level:"beginner" }, { skill:"Data Cleaning", level:"intermediate" }, { skill:"EDA", level:"intermediate" }],
    niceToHave: [{ skill:"Machine Learning", level:"beginner" }, { skill:"Tableau", level:"beginner" }]
  },
  "ML Engineer": {
    critical:   [{ skill:"Python", level:"advanced" }, { skill:"Machine Learning", level:"advanced" }, { skill:"Deep Learning", level:"intermediate" }, { skill:"Mathematics", level:"intermediate" }, { skill:"Data Preprocessing", level:"intermediate" }],
    important:  [{ skill:"TensorFlow", level:"intermediate" }, { skill:"SQL", level:"beginner" }, { skill:"Feature Engineering", level:"intermediate" }, { skill:"Model Evaluation", level:"intermediate" }],
    niceToHave: [{ skill:"MLOps", level:"beginner" }, { skill:"Cloud ML", level:"beginner" }, { skill:"NLP", level:"beginner" }]
  },
  "Frontend Developer": {
    critical:   [{ skill:"HTML/CSS", level:"advanced" }, { skill:"JavaScript", level:"advanced" }, { skill:"React", level:"intermediate" }, { skill:"Git", level:"intermediate" }],
    important:  [{ skill:"TypeScript", level:"intermediate" }, { skill:"REST APIs", level:"intermediate" }, { skill:"Responsive Design", level:"intermediate" }],
    niceToHave: [{ skill:"Next.js", level:"beginner" }, { skill:"Testing", level:"beginner" }, { skill:"GraphQL", level:"beginner" }]
  },
  "Backend Developer": {
    critical:   [{ skill:"Node.js", level:"intermediate" }, { skill:"REST APIs", level:"advanced" }, { skill:"SQL", level:"intermediate" }, { skill:"Authentication", level:"intermediate" }, { skill:"Git", level:"intermediate" }],
    important:  [{ skill:"System Design", level:"beginner" }, { skill:"Redis", level:"beginner" }, { skill:"Docker", level:"beginner" }, { skill:"MongoDB", level:"intermediate" }],
    niceToHave: [{ skill:"Microservices", level:"beginner" }, { skill:"Kubernetes", level:"beginner" }, { skill:"GraphQL", level:"beginner" }]
  },
  "Product Manager": {
    critical:   [{ skill:"Product Thinking", level:"intermediate" }, { skill:"User Research", level:"intermediate" }, { skill:"PRD Writing", level:"intermediate" }, { skill:"Roadmapping", level:"intermediate" }],
    important:  [{ skill:"SQL Basics", level:"beginner" }, { skill:"Analytics", level:"intermediate" }, { skill:"A/B Testing", level:"beginner" }, { skill:"Wireframing", level:"beginner" }],
    niceToHave: [{ skill:"Figma", level:"beginner" }, { skill:"Agile", level:"beginner" }]
  }
};

const levelScore = { beginner: 1, intermediate: 2, advanced: 3 };

function matchSkill(userSkills, requiredSkill) {
  return userSkills.find(us =>
    us.name.toLowerCase().includes(requiredSkill.toLowerCase()) ||
    requiredSkill.toLowerCase().includes(us.name.toLowerCase())
  );
}

// ─── Generate Roadmap ───────────────────────────────────────────
router.post('/generate', authMiddleware, async (req, res) => {
  console.log("=> /generate hit");
  try {
    const { answers } = req.body;
    require('fs').appendFileSync('debug.log', `=> /generate hit\nAnswers: ${JSON.stringify(answers)}\n`);
    const role = answers.targetRole || answers.role;
    const mode = answers.mode || 'Placement';
    const year = answers.year;
    const months = answers.months || answers.experience || 8;
    const hours = answers.hours || answers.commitment || '2-4 hours';

    // Normalize skills to object format
    const userSkills = (answers.skills || []).map(s => {
      if (typeof s === 'string') return { name: s, level: 'beginner', knownTopics: '' };
      return s;
    });

    // ── STEP 1: Get benchmark for role ──
    const benchmark = industryBenchmarks[role] || industryBenchmarks["SDE"] || { critical: [], important: [], niceToHave: [] };

    // ── STEP 2: Classify skills ──
    const alreadyKnown   = [];
    const needsPolishing = [];
    const dailyPractice  = [];
    const fullyMissing   = [];

    const allRequired = [
      ...benchmark.critical.map(s => ({ ...s, priority: 'critical' })),
      ...benchmark.important.map(s => ({ ...s, priority: 'important' })),
      ...benchmark.niceToHave.map(s => ({ ...s, priority: 'niceToHave' }))
    ];

    allRequired.forEach(req => {
      const userSkill = matchSkill(userSkills, req.skill);

      if (!userSkill) {
        fullyMissing.push({ skill: req.skill, priority: req.priority, requiredLevel: req.level });
      } else {
        const uScore = levelScore[userSkill.level] || 1;
        const rScore = levelScore[req.level] || 1;

        if (uScore > rScore) {
          dailyPractice.push({ skill: req.skill, level: userSkill.level, knownTopics: userSkill.knownTopics || '' });
        } else if (uScore === rScore) {
          alreadyKnown.push({ skill: req.skill, level: userSkill.level, knownTopics: userSkill.knownTopics || '' });
        } else {
          needsPolishing.push({
            skill: req.skill,
            currentLevel: userSkill.level,
            requiredLevel: req.level,
            knownTopics: userSkill.knownTopics || '',
            priority: req.priority
          });
        }
      }
    });

    // ── STEP 3: Calculate readiness score ──
    const totalCritical = benchmark.critical.length;
    const coveredCritical = alreadyKnown.filter(s =>
      benchmark.critical.find(b => b.skill.toLowerCase() === s.skill.toLowerCase())
    ).length;
    const partialCritical = needsPolishing.filter(s => s.priority === 'critical').length;
    const readinessScore = totalCritical > 0
      ? Math.round(((coveredCritical + partialCritical * 0.4) / totalCritical) * 100)
      : 50;

    // ── STEP 4: Build AI prompt ──
    const prompt = `You are a JSON API. You must respond with valid JSON only. No text before or after. No markdown. No thinking tags.
You are a senior tech career coach at a top tech company.

STUDENT PROFILE:
- Target Role: ${role}
- Goal: ${mode} (${mode === 'Internship' ? 'Looking for internship' : 'Looking for full-time placement'})
- College Year: ${year}
- Timeline: ${months} months
- Daily Study Hours: ${hours}

PRE-COMPUTED SKILL CLASSIFICATION:
Already Knows Well (meets industry standard):
${alreadyKnown.map(s => `- ${s.skill} (${s.level})${s.knownTopics ? ': knows ' + s.knownTopics : ''}`).join('\n') || 'None'}

Needs Polishing (has skill but below required level):
${needsPolishing.map(s => `- ${s.skill}: currently ${s.currentLevel}, needs ${s.requiredLevel}${s.knownTopics ? ', knows: ' + s.knownTopics : ''}`).join('\n') || 'None'}

Needs Daily Practice (exceeds requirement, just needs consistency):
${dailyPractice.map(s => `- ${s.skill} (${s.level})`).join('\n') || 'None'}

Fully Missing (never learned):
${fullyMissing.map(s => `- ${s.skill} (need: ${s.requiredLevel}, priority: ${s.priority})`).join('\n') || 'None'}

Current Readiness Score: ${readinessScore}%

ROADMAP RULES:
1. Do NOT include skills from "Already Knows Well" in roadmap
2. For "Needs Polishing" — continue from where they are, skip known topics
3. For "Needs Daily Practice" — only add as 15 min daily practice task
4. For "Fully Missing" — start from scratch, prioritize critical ones first
5. Adapt difficulty to ${mode === 'Internship' ? 'internship level (lighter, project-focused)' : 'placement level (interview-focused, DSA heavy)'}
6. CRITICAL: For each week, provide 4-6 WORKING resource URLs. Use these EXACT URL patterns:
   - YouTube: https://www.youtube.com/results?search_query=TOPIC+tutorial+for+beginners (replace TOPIC with URL-encoded topic)
   - GeeksForGeeks: https://www.geeksforgeeks.org/TOPIC/ (use real GFG slug like "array-data-structure", "linked-list-data-structure", "binary-search-algorithm")
   - LeetCode: https://leetcode.com/tag/TOPIC/ (use real LeetCode tags like "array", "linked-list", "dynamic-programming", "tree")
   - W3Schools: https://www.w3schools.com/TOPIC/ (use real paths like "python/", "js/", "sql/")
   - MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/TOPIC
   - HackerRank: https://www.hackerrank.com/domains/TOPIC (like "data-structures", "algorithms", "sql")
   - Programiz: https://www.programiz.com/dsa/TOPIC (like "stack", "queue", "graph")
7. Timeline is ${months} months with ${hours} daily — be realistic
8. Each week must have a hands-on project

RESOURCE URL RULES:
- MUST use the URL patterns above — they are GUARANTEED to work
- For YouTube, ALWAYS use search URLs: https://www.youtube.com/results?search_query=...
- For GFG, use topic page URLs like https://www.geeksforgeeks.org/data-structures/
- Include at least: 1 YouTube search, 1 article/docs, 1 practice, 1 cheatsheet or reference
- Use + for spaces in YouTube search URLs

Return ONLY this exact JSON. Start with {:
{
  "confidence_score": ${readinessScore},
  "current_salary_estimate": "realistic estimate e.g. 4-6 LPA",
  "target_salary_estimate": "realistic estimate after roadmap e.g. 15-22 LPA",
  "gap_summary": {
    "already_known": [{ "skill": "string", "level": "string", "status": "perfect" }],
    "needs_polishing": [{ "skill": "string", "currentLevel": "string", "requiredLevel": "string", "missingTopics": "string", "status": "polish" }],
    "daily_practice": [{ "skill": "string", "level": "string", "practiceTask": "string", "status": "practice" }],
    "fully_missing": [{ "skill": "string", "priority": "critical|important|niceToHave", "reason": "string", "status": "missing" }]
  },
  "roadmap": [{
    "week": 1,
    "focus": "string",
    "goal": "what student should be able to do by end of week",
    "tasks": ["specific task 1", "specific task 2", "specific task 3"],
    "resources": [
      { "title": "Video/Playlist title", "url": "https://real-url", "type": "youtube_playlist" },
      { "title": "Article/Tutorial title", "url": "https://real-url", "type": "worksheet" },
      { "title": "Practice problems", "url": "https://real-url", "type": "practice" },
      { "title": "Cheat sheet name", "url": "https://real-url", "type": "cheatsheet" }
    ],
    "project": "hands-on project for this week",
    "skipping": "what we skip because student already knows it"
  }],
  "daily_missions": [
    { "type": "learn", "task": "specific task", "xp": 10 },
    { "type": "practice", "task": "specific task", "xp": 20 },
    { "type": "build", "task": "specific task", "xp": 30 }
  ]
}
8 weeks in roadmap. 3 daily missions only. 4-6 resources per week.
IMPORTANT: Return ONLY the JSON object. Start with { directly.`;

    require('fs').appendFileSync('debug.log', `PROMPT: ${prompt}\n`);
    const result = await generateAIResponse(prompt);
    require('fs').appendFileSync('debug.log', `RESULT: ${JSON.stringify(result)}\n`);

    // ── STEP 5: Merge local gap data with AI response ──
    const gapReport = {
      readinessScore,
      currentSalary: result.current_salary_estimate || '4-6 LPA',
      targetSalary: result.target_salary_estimate || '15-22 LPA',
      alreadyKnown: result.gap_summary?.already_known || alreadyKnown.map(s => ({ skill: s.skill, level: s.level, status: 'perfect' })),
      needsPolishing: result.gap_summary?.needs_polishing || needsPolishing.map(s => ({ skill: s.skill, currentLevel: s.currentLevel, requiredLevel: s.requiredLevel, missingTopics: '', status: 'polish' })),
      dailyPractice: result.gap_summary?.daily_practice || dailyPractice.map(s => ({ skill: s.skill, level: s.level, practiceTask: 'Practice daily for 15 min', status: 'practice' })),
      fullyMissing: result.gap_summary?.fully_missing || fullyMissing.map(s => ({ skill: s.skill, priority: s.priority, reason: `Required for ${role}`, status: 'missing' })),
    };

    // Attach gapReport to result
    result.gapReport = gapReport;
    result.confidence_score = readinessScore;

    res.json(result);
  } catch (err) {
    console.error("FULL ERROR:", err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// ─── Save onboarding answers + AI roadmap ───────────────────────
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { profile, roadmap } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profile,
        roadmap,
        gapReport: roadmap?.gapReport || null,
        confidenceScore: roadmap?.confidence_score || roadmap?.gapReport?.readinessScore || 0,
        onboardingDone: true,
      },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Get current user profile ───────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
