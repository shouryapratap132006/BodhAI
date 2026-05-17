# 🧠 BodhAI — Autonomous Instructional Designer

> **"BodhAI is not just an AI tutor—it is an autonomous instructional designer that structures, delivers, evaluates, and refines learning experiences using agentic feedback loops."**

BodhAI is a sophisticated, multi-modal **Curriculum Generation Engine**. Instead of acting as a simple Q&A chatbot, it explicitly models instructional design frameworks to build, assess, and adapt full learning experiences.

---

## 🎯 The Problem Statement

**The Scenario:** Most "AI Tutors" just act as standard chatbots that output walls of text. However, true pedagogy requires structure, pacing, and verification to ensure genuine comprehension. 

**The Challenge:** Build an autonomous curriculum generation system that ingests raw, dry technical documentation (e.g., a new software library, historical texts, or math concepts) and transforms it into a highly structured, interactive, and personalized lesson.

---

## ✨ Core Capabilities & The Agentic Workflow

BodhAI is powered by a **multi-agent LangGraph pipeline** designed specifically to mimic the workflow of an expert instructional designer.

### 1. The Architect Agent 
Unlike traditional LLMs that just start typing, BodhAI first routes your input to an Architect Agent. This agent **must map the raw data to strict instructional design frameworks** (like Gagné’s Nine Events of Instruction or Merrill's First Principles), constructing a rigid pedagogical blueprint before any content is ever written.

### 2. The Content Agent 
Working directly off the Architect's outline, the Content Agent **generates the actual teaching material**. It creates conversational lessons, practical examples, interactive step-by-step guides, and contextual assessments (like MCQs or short-answer questions) tailored perfectly to the blueprint.

### 3. The Simulated Student Agent & Evaluator
Before you ever see the lesson, BodhAI runs an internal verification loop. A **Simulated Student Agent** actively tries to complete the generated exercises and comprehend the lesson using a completely separate LLM context. It intentionally looks for confusing points, logic gaps, or missing examples. 
If the student struggles, an **Evaluator Agent** flags the failure logs, forcing the pipeline to dynamically rewrite and simplify the confusing parts of the lesson before it is finally delivered to you.

### 4. Interactive Learning Dashboard & Progress Tracking
BodhAI doesn't just forget your progress when you close the chat. 
- **Topic Normalization:** As you chat, it automatically identifies and normalizes topics, tracking your interaction effort.
- **Dynamic Scoring:** Your progress isn't just a flat increase. It is algorithmically blended with your actual performance on quizzes and assessments, offering a true measure of your mastery.
- **Weak Areas Analysis:** The dashboard displays precise, structured JSON extractions of your recurring mistakes, misconceptions, and tips for improvement.

### 5. Inline Assessment & Evaluation Engine
BodhAI moves away from passive reading.
- **Clickable Assessments:** When the AI generates a practice problem or test question, you can click directly on the question card in the UI to open an inline text box.
- **Targeted Evaluation:** Submit your answer directly to the backend. The AI will evaluate *only* your answer, providing immediate Mistake Analysis, pointing out exactly where your logic failed, and offering a hint without hallucinating an unprompted lesson.
- **Playable Quizzes:** Engaging, interactive MCQ interfaces that provide instant visual feedback.

---

## 🛠️ Technology Stack

### Frontend (Next.js)
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS + Custom CSS Variables for sleek glassmorphic UI and dark/orange themes.
- **UI Components**: Framer Motion for fluid chat bubbles, staggered block renders, and Lesson/Chat view toggles.

### Backend (Django)
- **Framework**: Django & Django REST Framework
- **Database**: SQLite (Development) / PostgreSQL (Production ready)
- **File Parsing**: `fitz` (PyMuPDF) and `python-pptx`

### AI & Agents
- **Orchestration**: LangGraph (StateGraph pipelines with conditional routing)
- **LLM Provider**: Groq (Using `llama-3.3-70b-versatile` for blazing-fast inference)
- **Structured Outputs**: Native JSON-mode enforcement for robust frontend rendering of `lesson_structure` and `evaluation`.

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

1. **User Input** → Sent to Django API `/api/chat/`.
2. **History Builder** → Retrieves recent context.
3. **LangGraph Pipeline**:
   - `Intent Node`: Identifies the user's goal.
   - `Architect Node`: Outlines the pedagogical structure.
   - `Content Node`: Generates the raw explanation and constructs the `lesson_structure`.
   - `Student/Evaluator/Refiner Loop`: Verifies clarity and executes *Learning Gap Detection*.
4. **Database Persistence** → Both user prompt and structured AI response (including `lesson_structure`) are saved to the `Message` model.
5. **Frontend Rendering** → The `ChatMessage.tsx` component parses the JSON into beautiful UI blocks, offering Chat/Lesson view toggles and interactive quizzes.

---
*Built with speed, aesthetics, and instructional design principles in mind.*
