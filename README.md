# 🧠 BodhAI — The Advanced Agentic AI Tutor

**BodhAI** is a sophisticated, multi-modal AI tutoring system designed to act like a real teacher rather than a simple answer generator. It teaches concepts, provides hints before solutions, generates practice quizzes, evaluates understanding, and continuously adapts its explanations based on simulated student feedback.

![BodhAI Interface Demo](frontend/public/favicon.ico) *(A sleek, ChatGPT-style continuous learning UI)*

---

## ✨ Core Capabilities

BodhAI isn't just a chatbot; it's a **6-node LangGraph Agent Pipeline** built to teach effectively.

### 1. Intent-Driven Teaching Modes
The system automatically detects what you need and responds natively in one of 6 modes:
- **📖 Learn Mode**: Breaks down concepts with explanations, examples, and steps.
- **🔍 Solve Mode**: Don't just get the answer—get a hint first, then a step-by-step solution.
- **🎯 Quiz Mode**: Generates multi-choice and short-answer questions to test your knowledge.
- **📝 Homework Mode**: Creates practice problems with increasing difficulty (Easy → Challenge).
- **⚡ Revise Mode**: Provides quick recaps and conceptual revision points.
- **🔄 Explain Again**: Adjusts the explanation to be simpler or deeper based on your preference.

### 2. The Agentic Feedback Loop
When teaching a complex topic, BodhAI doesn't just send the first draft. It runs an internal loop:
1. **Content Agent** drafts the lesson.
2. **Student Agent** simulates a beginner reading the lesson, attempting to find confusing parts or gaps.
3. **Evaluator Agent** reviews the lesson against the simulated student's confusion.
4. **Refiner Agent** improves and simplifies the explanation *before* you even see it.

### 3. Multi-Modal Context
You can upload **PDFs, PPTs, and Images**. BodhAI uses Groq's Vision models and extraction utilities to read your files and teach you the content within them.

### 4. Continuous Chat History
BodhAI remembers your previous questions in the session, allowing for natural, continuous follow-up conversations just like a real tutoring session.

---

## 🛠️ Technology Stack

### Frontend (Next.js)
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS + Custom CSS Variables for sleek glassmorphic UI and dark/orange themes.
- **Animations**: Framer Motion for fluid chat bubbles, typing indicators, and staggered block renders.

### Backend (Django)
- **Framework**: Django & Django REST Framework
- **Database**: SQLite (Development) / PostgreSQL (Production ready via `dj_database_url`)
- **File Parsing**: `fitz` (PyMuPDF) and `python-pptx`

### AI & Agents
- **Orchestration**: LangGraph (StateGraph pipelines with conditional routing)
- **LLM Provider**: Groq (Using `llama-3.3-70b-versatile` for blazing-fast inference)
- **Structured Outputs**: Native JSON-mode enforcement for reliable frontend rendering.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/BodhAI.git
cd BodhAI
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create a .env file and add your GROQ_API_KEY
echo "GROQ_API_KEY=your_api_key_here" > .env

# Run migrations
python manage.py migrate

# Start the Django server
python manage.py runserver 8000
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

### 4. Open the App
Visit [http://localhost:3000](http://localhost:3000) (or `3001` if port 3000 is occupied) in your browser.

---

## 📂 Architecture & Data Flow

1. **User Input** → (Text or File) sent to Django API `/api/chat/`.
2. **History Builder** → Retrieves the last 16 messages of the active conversation to preserve context limits.
3. **LangGraph Pipeline**:
   - `Intent Node`: Identifies the user's goal.
   - `Architect Node`: Outlines the pedagogical structure.
   - `Content Node`: Generates the raw explanation/quiz JSON.
   - `Student/Evaluator/Refiner Loop`: Verifies and improves the explanation's clarity.
4. **Database Persistence** → Both user prompt and structured AI response are saved to the `Message` model.
5. **Frontend Rendering** → The `ChatMessage.tsx` component parses the structured JSON into beautiful UI blocks (Hints, Steps, MCQs, Examples, Evaluator Badges).

---
*Built with speed, aesthetics, and pedagogy in mind.*
