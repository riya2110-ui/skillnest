# 🚀 SkillNest — AI-Powered Interview Preparation Platform

SkillNest is a full-stack web application that helps job seekers prepare for technical interviews with AI-generated mock interviews, adaptive learning roadmaps, aptitude drills, SQL challenges, and a peer community forum.

---

## ✨ Features

### 🎯 Practice Arena (Unified Hub)
- **Technical / OA Mock Interview** — AI-generated DSA, coding & online assessment questions with real-time evaluation
- **HR Mock Interview** — Behavioral and culture-fit questions with AI scoring
- **System Design Mock Interview** — Architecture & scalability deep-dives
- **Aptitude Sprint** — 10-question timed drills (Math, Logic, Verbal) with 5-minute countdown
- **SQL Architect** — Interactive SQL editor with AI-evaluated query challenges and optimization tips
- **Premium Loading Overlay** — Orbital animation system with floating particles while AI generates questions

### 🗺️ Adaptive Roadmap
- AI-generated personalized learning path based on your profile
- Gap analysis report highlighting skill weaknesses
- Topic-wise progress tracking with quiz assessments

### 📊 Dashboard
- Confidence Score tracking across interview sessions
- XP & Level gamification system
- Streak tracking for daily engagement
- Goal Tracker with priority and deadlines
- Industry Benchmark comparison

### ⚡ Daily Missions
- AI-curated daily tasks aligned to your roadmap
- XP rewards and badge system for completion

### 👥 Community Forum
- Share interview experiences (e.g., "Google SDE Interview — April 2024")
- Post success stories and tips
- Like and engage with peer content

### 📋 Application Tracker
- Track job applications with status pipeline (Applied → Interview → Offer)
- Analytics dashboard with conversion rates
- Interview preparation checklists

### ⚙️ Settings
- Theme customization (Light/Dark mode)
- Accent color selection
- Notification preferences

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI Framework |
| Vite 8 | Build Tool & Dev Server |
| Framer Motion | Animations & Transitions |
| Lucide React | Icon Library |
| Tailwind CSS 4 | Utility-first Styling |
| React Router 7 | Client-side Routing |
| Axios | HTTP Client |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API Server |
| MongoDB + Mongoose | Database & ODM |
| JWT | Authentication |
| bcrypt | Password Hashing |
| OpenRouter API | AI Model Access (DeepSeek, Gemini) |

---

## 📁 Project Structure

```
skillnest/
├── src/
│   ├── pages/
│   │   ├── Home.jsx              # Landing page
│   │   ├── Login.jsx             # Authentication
│   │   ├── Signup.jsx            # Registration
│   │   ├── Onboarding.jsx        # Profile setup & AI roadmap generation
│   │   ├── Dashboard.jsx         # Main dashboard with stats & goals
│   │   ├── PracticeCenter.jsx    # Mock Interview + Aptitude + SQL (merged)
│   │   ├── Roadmap.jsx           # AI-generated learning roadmap
│   │   ├── Missions.jsx          # Daily XP missions
│   │   ├── Community.jsx         # Forum & success stories
│   │   ├── Applications.jsx      # Job application tracker
│   │   └── Settings.jsx          # User preferences
│   ├── components/
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   ├── Navbar.jsx            # Top navigation bar
│   │   ├── GoalTracker.jsx       # Goal management widget
│   │   ├── QuizModal.jsx         # Topic assessment quizzes
│   │   ├── RoadmapCard.jsx       # Roadmap topic cards
│   │   └── ...                   # Loading states, illustrations
│   ├── context/
│   │   └── UserContext.jsx       # Global auth & user state
│   └── services/
│       └── api.jsx               # Axios API configuration
├── server/
│   ├── index.js                  # Express server entry point
│   ├── models/
│   │   ├── User.js               # User schema (profile, XP, badges, goals)
│   │   ├── Application.js        # Job application schema
│   │   └── ForumPost.js          # Community post schema
│   ├── routes/
│   │   ├── auth.js               # Login / Signup
│   │   ├── profile.js            # Onboarding & profile management
│   │   ├── career.js             # Mock interview generation & evaluation
│   │   ├── practice.js           # Aptitude & SQL challenge endpoints
│   │   ├── roadmap.js            # AI roadmap generation
│   │   ├── missions.js           # Daily mission generation
│   │   ├── forum.js              # Community CRUD
│   │   ├── applications.js       # Job tracker CRUD + analytics
│   │   ├── quiz.js               # Topic assessment quizzes
│   │   ├── benchmark.js          # Industry benchmark data
│   │   └── users.js              # Streak, XP, level management
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification
│   └── utils/
│       └── ai.js                 # OpenRouter AI wrapper with JSON extraction
├── package.json
├── vite.config.js
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas cloud)
- **OpenRouter API Key** — [Get one here](https://openrouter.ai)

### 1. Clone the repository
```bash
git clone https://github.com/riya2110-ui/skillnest.git
cd skillnest
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd server
npm install
```

### 4. Configure environment variables
Create a `server/.env` file:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
```

### 5. Start the backend server
```bash
cd server
node index.js
```

### 6. Start the frontend dev server
```bash
# From project root
npm run dev
```

### 7. Open in browser
Navigate to `http://localhost:5173`

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT token signing |
| `OPENROUTER_API_KEY` | API key for AI model access |
| `PORT` | Backend server port (default: 5000) |

> ⚠️ **Never commit `server/.env` to version control.** It contains sensitive API keys.

---

## 🤖 AI Integration

SkillNest uses **OpenRouter** to access multiple AI models:
- **DeepSeek R1** — Complex reasoning tasks (roadmap generation, gap analysis)
- **Google Gemini Flash** — Fast responses (quiz generation, interview questions)

All AI responses are parsed through a robust JSON extractor that handles markdown fences, `<think>` blocks, and malformed output.

---

## 📄 License

This project is for educational and portfolio purposes.

---

## 👩‍💻 Author

**Riya Thakur** — [GitHub](https://github.com/riya2110-ui)
