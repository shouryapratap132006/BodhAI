# 🧠 BodhAI — Autonomous Instructional Designer

> **"BodhAI is not just an AI tutor—it is an autonomous instructional designer that structures, delivers, evaluates, and refines learning experiences using agentic feedback loops."**

BodhAI is a sophisticated, multi-modal **Curriculum Generation Engine**. Instead of acting as a simple Q&A chatbot, it explicitly models instructional design frameworks (like Gagné’s Nine Events of Instruction and Merrill’s First Principles) to build, assess, and adapt full learning experiences.

![BodhAI Interface Demo](frontend/public/favicon.ico) *(A sleek, ChatGPT-style continuous learning UI)*

---

## ✨ Core Capabilities

BodhAI is powered by a **6-node LangGraph Agent Pipeline** built to teach effectively.

### 1. Curriculum Generation & Lesson Framing
From any topic, BodhAI generates a full structured curriculum.
- **Lesson Plan Mode**: Toggles a clean UI rendering the entire pedagogical structure (Gain Attention, Objectives, Prior Knowledge, Content, Guided Practice, Assessment, Feedback, and Improvement).
- **Multi-Mode Flexibility**: Switch natively between `Learn`, `Solve`, `Quiz`, `Homework`, and `Revise`.

### 2. Pedagogical Feedback Loop
BodhAI doesn't just send the first draft. It runs an internal verification loop:
1. **Content Agent** drafts the lesson or solution.
2. **Student Agent** simulates a beginner, attempting to find confusing parts or gaps.
3. **Evaluator Agent** reviews the lesson, running explicit **Learning Gap Detection** (identifying misunderstood concepts, weak reasoning, or incorrect assumptions).
4. **Refiner Agent** improves and simplifies the explanation *before* the user sees it.

### 3. Before vs After Improvement View
BodhAI visually proves its intelligence. When the system detects a gap and improves its own explanation, users can toggle between the **Original** and **Improved** explanations to see exactly how the AI adapted its teaching style.

### 4. Interactive Assessment Engine
- Real-time interactive UI for **MCQs** and **Short Answer** questions.
- Adaptive hints and evaluative feedback upon answering.

### 5. Multi-Modal Context & Chat Continuity
Upload **PDFs, PPTs, and Images** for BodhAI to use as reference material. It remembers your previous questions in the session, allowing for natural, continuous follow-up conversations.

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
