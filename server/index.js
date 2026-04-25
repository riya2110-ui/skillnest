require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const careerRoutes = require('./routes/career');
const trackerRoutes = require('./routes/tracker');
const profileRoutes = require('./routes/profile');
const missionsRoutes = require('./routes/missions');
const usersRoutes = require('./routes/users');
const interviewRoutes = require('./routes/interview');
const applicationsRoutes = require('./routes/applications');
const roadmapRoutes = require('./routes/roadmap');
const quizRoutes = require('./routes/quiz');
const benchmarkRoutes = require('./routes/benchmark');
const forumRoutes = require('./routes/forum');
const practiceRoutes = require('./routes/practice');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// GLOBAL LOGGER (To Console and File)
app.use((req, res, next) => {
  const log = `[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}\n`;
  console.log(log.trim());
  fs.appendFileSync('server.log', log);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/benchmark', benchmarkRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/practice', practiceRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'SkillNest API is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Listen on 0.0.0.0 explicitly for Windows compatibility
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
