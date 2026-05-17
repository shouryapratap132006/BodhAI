# BodhAI — Project Documentation
 
> **"BodhAI is not just an AI tutor—it is an autonomous instructional designer that structures, delivers, evaluates, and refines learning experiences using agentic feedback loops."**
 
**Repository:** https://github.com/shouryapratap132006/BodhAI  
**Live Demo:** https://bodh-ai-kappa.vercel.app  
**Version:** main branch  
**Language Breakdown:** Python 52% · TypeScript 44.3% · CSS 3.4% · JavaScript 0.3%
 
---
 
## Table of Contents
 
1. [Overview](#1-overview)
2. [Core Capabilities](#2-core-capabilities)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Architecture & System Design](#5-architecture--system-design)
6. [The Agent Pipeline](#6-the-agent-pipeline)
7. [Frontend Components](#7-frontend-components)
8. [Backend Models & API](#8-backend-models--api)
9. [Data Flow (End-to-End)](#9-data-flow-end-to-end)
10. [Getting Started](#10-getting-started)
11. [Environment Variables](#11-environment-variables)
12. [Learning Modes](#12-learning-modes)
13. [Key Design Principles](#13-key-design-principles)
 
---
 
## 1. Overview
 
BodhAI is a sophisticated, multi-modal **Curriculum Generation Engine** powered by a 6-node LangGraph agentic pipeline. Unlike conventional AI chatbots, BodhAI explicitly models established instructional design frameworks—most notably **Gagné's Nine Events of Instruction** and **Merrill's First Principles of Instruction**—to build, assess, and dynamically adapt complete learning experiences.
 
The system is composed of two primary components:
 
- **Frontend** — A Next.js (App Router) React application providing an interactive, ChatGPT-style continuous learning UI.
- **Backend** — A Django application that orchestrates the multi-agent pipeline using LangGraph and the Groq LLM provider.
 
Rather than responding with a flat text answer, BodhAI structures every response as a pedagogically sound lesson, runs an internal self-improvement loop, and then delivers the refined output to the user—complete with interactive quizzes, hints, and a before/after comparison view.
 
---
 
## 2. Core Capabilities
 
### 2.1 Curriculum Generation & Lesson Framing
 
From any topic, BodhAI generates a fully structured curriculum following a formal pedagogical structure:
 
- **Lesson Plan Mode** — Renders the full instructional structure: Gain Attention → Objectives → Prior Knowledge → Content → Guided Practice → Assessment → Feedback → Improvement.
- **Multi-Mode Flexibility** — Natively supports `Learn`, `Solve`, `Quiz`, `Homework`, and `Revise` modes, each with a tailored output format.
 
### 2.2 Pedagogical Feedback Loop (Self-Improvement)
 
BodhAI does not deliver raw first-draft output. Instead, it runs an internal multi-agent verification cycle before presenting any content:
 
1. The **Content Agent** drafts the lesson or solution.
2. The **Student Agent** simulates a confused beginner attempting to understand the draft.
3. The **Evaluator Agent** reviews the draft alongside the simulated student's attempt, identifying Learning Gaps—unclear explanations, missing steps, or incorrect assumptions.
4. The **Refiner Agent** rewrites and simplifies the explanation based on those gaps, running up to 2 iterations.
 
### 2.3 Before vs. After Improvement View
 
When the internal loop detects gaps and refines the explanation, the user can toggle between the **Original** and **Improved** explanations to see exactly how the AI adapted its teaching approach.
 
### 2.4 Interactive Assessment Engine
 
- Real-time interactive UI rendering Multiple Choice Questions (MCQs) and Short Answer questions.
- Adaptive hints delivered progressively at multiple levels.
- Evaluative feedback provided immediately upon answering.
- User scores posted back to the Django API to track progress and adjust difficulty (Easy / Medium / Hard).
 
### 2.5 Multi-Modal Context & Chat Continuity
 
- Upload **PDFs, PPTs, and Images** as reference material; BodhAI incorporates them into its responses.
- Full session-based conversation history enables natural, continuous follow-up questions.
- File parsing powered by `fitz` (PyMuPDF) and `python-pptx`.
 
---
 
## 3. Technology Stack
 
### Frontend
 
| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS + Custom CSS Variables |
| Animations | Framer Motion (chat bubbles, staggered blocks, view toggles) |
| UI Theme | Glassmorphic, dark/orange color palette |
 
### Backend
 
| Layer | Technology |
|---|---|
| Framework | Django + Django REST Framework |
| Database (Dev) | SQLite |
| Database (Prod) | PostgreSQL |
| File Parsing | `fitz` (PyMuPDF), `python-pptx` |
 
### AI & Agents
 
| Layer | Technology |
|---|---|
| Agent Orchestration | LangGraph (StateGraph pipelines with conditional routing) |
| LLM Provider | Groq (`llama-3.3-70b-versatile`) |
| External Search | DuckDuckGo (for fetching real educational resource links) |
| Structured Output | Native JSON-mode enforcement for reliable frontend rendering |
 
---
 
## 4. Project Structure
 
```
BodhAI/
├── backend/
│   ├── api/
│   │   ├── agents/
│   │   │   └── graph.py          # Core 6-node LangGraph pipeline
│   │   ├── models.py             # Conversation, Message, LearningPath, TopicProgress
│   │   └── views.py              # Django REST API endpoints
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       └── app/
│           ├── page.tsx          # Main chat view & API communication
│           └── components/
│               └── ChatMessage.tsx   # Core rendering engine for all UI blocks
├── ARCHITECTURE.md               # System architecture reference
├── AGENTS.md                     # Agent guidelines
├── CLAUDE.md                     # AI coding conventions
└── README.md
```
 
---
 
## 5. Architecture & System Design
 
BodhAI follows a clean separation of concerns: the **frontend** handles user interaction and rich UI rendering, while the **backend** runs the entire AI pipeline and persists all data.
 
```
User Browser (Next.js)
        │
        │  POST /api/chat/
        ▼
Django REST API
        │
        │  graph.invoke(BodhState)
        ▼
LangGraph Pipeline (6 Nodes)
        │
        │  Optimized JSON Response
        ▼
SQLite / PostgreSQL (Message persistence)
        │
        │  JSON Payload
        ▼
ChatMessage.tsx (Frontend Rendering)
        │
        ▼
Interactive UI Blocks (Lesson Plan, Quiz, Hints, Before/After Toggle)
```
 
---
 
## 6. The Agent Pipeline
 
The core intelligence of BodhAI resides in `backend/api/agents/graph.py`. All six agents operate as nodes in a LangGraph `StateGraph`, passing a shared `BodhState` object between them.
 
### Node 1 — Intent Detection Agent
 
**Role:** Router  
**Temperature:** 0 (deterministic)
 
Classifies the user's request into one of the following intents to ensure correct downstream routing:
 
- `learn_topic`
- `solve_question`
- `quiz_me`
- `homework`
- `revise`
- `get_resources`
 
### Node 2 — Architect Agent
 
**Role:** Blueprint Creator
 
Generates a structural outline or plan tailored to the detected intent. For example, a `solve_question` intent produces a step-by-step problem-solving scaffold, while `learn_topic` produces a list of core sub-topics.
 
### Node 3 — Content Agent
 
**Role:** Primary Content Generator
 
The workhorse of the pipeline. Drafts the primary pedagogical content in strict JSON format, producing a rich payload mapped to specific frontend UI blocks:
 
| JSON Field | Frontend Rendering |
|---|---|
| `lesson_structure` | 8-step Gagné lesson plan |
| `steps` | Step-by-step solution view |
| `mistake_analysis` | Why an approach is wrong + correct approach |
| `hint_levels` | Progressive hint reveal block |
| `questions` | Interactive MCQ / Short Answer quiz |
| `resources` | Real links from DuckDuckGo (YouTube, Khan Academy, etc.) |
 
### Node 4 — Student Agent (Simulation)
 
**Role:** Beginner Learner Simulation
 
Reads the Content Agent's draft and deliberately generates a confused or mistaken response—simulating how a real beginner might misunderstand the explanation. This output is passed to the Evaluator.
 
### Node 5 — Evaluator Agent
 
**Role:** Teacher / Gap Detector
 
Reviews both the draft content and the Student Agent's simulated attempt. Runs explicit **Learning Gap Detection**, checking for:
 
- Unclear or ambiguous language
- Missing conceptual steps
- Incorrect assumptions that might confuse learners
 
Decides whether the content requires refinement (conditional routing to Node 6).
 
### Node 6 — Refiner Agent (Conditional)
 
**Role:** Content Improver  
**Max iterations:** 2
 
If the Evaluator identifies gaps, the Refiner rewrites and simplifies the explanation. This loop can repeat up to two times before the final output is committed. The original draft is preserved alongside the improved version so the user can see the delta.
 
---
 
## 7. Frontend Components
 
### `page.tsx` — Main Chat View
 
Responsibilities:
- Sending user messages to `POST /api/chat/`
- Managing loading/streaming state
- Maintaining full conversation history for multi-turn context
 
### `ChatMessage.tsx` — Core Rendering Engine
 
The most critical frontend component. Parses the backend's JSON payload and conditionally renders the appropriate interactive blocks:
 
| Block Type | Description |
|---|---|
| **Lesson Plan Block** | Renders the 8-step instructional plan (Gain Attention, Objectives, Prior Knowledge, Content, Guided Practice, Assessment, Feedback, Improvement) |
| **Interactive Hint Block** | Progressively reveals multi-level hints for problem-solving |
| **Mistake Analysis** | Shows why an approach is wrong and presents the correct approach |
| **Playable Quiz** | Interactive MCQs; posts scores to `/api/topic-progress/` on answer |
| **Original vs. Improved Toggle** | Side-by-side comparison showing how the internal AI loop refined the explanation |
| **Resources Block** | Displays real curated educational links sourced via DuckDuckGo |
 
---
 
## 8. Backend Models & API
 
### Data Models (`models.py`)
 
**`Conversation`**  
Top-level container for a user's session. Stores session metadata.
 
**`Message`**  
Stores each turn in a conversation. Holds:
- The user's raw input
- The full structured JSON response from the AI pipeline
- Both the original and improved explanation versions
 
**`LearningPath`**  
Tracks which topics a user is studying, scoped to a conversation.
 
**`TopicProgress`**  
Records the user's quiz accuracy per topic, enabling the system to dynamically adjust difficulty (Easy → Medium → Hard).
 
### API Endpoints
 
| Endpoint | Method | Description |
|---|---|---|
| `/api/chat/` | POST | Submit a user message; invokes the full LangGraph pipeline |
| `/api/topic-progress/` | POST | Submit a quiz answer score to update topic difficulty tracking |
 
---
 
## 9. Data Flow (End-to-End)
 
1. **User Action** — User types a message (e.g., "Teach me integration by parts") and selects a mode (e.g., "Beginner").
2. **API Request** — Next.js posts to `POST /api/chat/` with the message and conversation history.
3. **State Initialization** — Django constructs a `BodhState` object containing the user input, intent context, and recent conversation history.
4. **Graph Invocation** — `graph.invoke(initial_state)` triggers the full 6-node LangGraph pipeline.
5. **Agent Loop** — Intent → Architect → Content → Student → Evaluator → Refiner runs internally (Refiner is conditional, max 2 loops).
6. **DuckDuckGo Search** — The Content Agent searches for real educational links and attaches them as `resources`.
7. **Persistence** — The final optimized response (including original and improved versions) is saved to the `Message` model in SQLite/PostgreSQL.
8. **API Response** — The structured JSON is returned to the Next.js frontend.
9. **UI Rendering** — `ChatMessage.tsx` unpacks the JSON and renders the appropriate interactive blocks in the chat view.
 
---
 
## 10. Getting Started
 
### Prerequisites
 
- Python 3.9+
- Node.js 18+
- A Groq API key (obtain at https://console.groq.com)
 
### Step 1 — Clone the Repository
 
```bash
git clone https://github.com/shouryapratap132006/BodhAI.git
cd BodhAI
```
 
### Step 2 — Backend Setup
 
```bash
cd backend
 
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
 
# Install Python dependencies
pip install -r requirements.txt
 
# Configure environment variables
echo "GROQ_API_KEY=your_api_key_here" > .env
 
# Run database migrations
python manage.py migrate
 
# Start the Django development server
python manage.py runserver 8000
```
 
The backend API will be available at `http://localhost:8000`.
 
### Step 3 — Frontend Setup
 
Open a new terminal window:
 
```bash
cd frontend
 
# Install Node.js dependencies
npm install
 
# Start the Next.js development server
npm run dev
```
 
### Step 4 — Open the Application
 
Visit `http://localhost:3000` in your browser (or `http://localhost:3001` if port 3000 is occupied).
 
---
 
## 11. Environment Variables
 
### Backend (`.env` in `/backend`)
 
| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key for the Groq LLM provider |
| `DATABASE_URL` | Optional | PostgreSQL connection string for production (defaults to SQLite) |
| `DEBUG` | Optional | Set to `False` in production |
 
---
 
## 12. Learning Modes
 
BodhAI supports five distinct interaction modes, selectable from the UI. Each mode routes through the same agent pipeline but produces a different output structure optimized for that learning goal.
 
| Mode | Intent Classified As | Primary Output |
|---|---|---|
| **Learn** | `learn_topic` | Full Gagné 8-step lesson plan |
| **Solve** | `solve_question` | Step-by-step solution with mistake analysis |
| **Quiz** | `quiz_me` | Interactive MCQ/Short Answer assessment |
| **Homework** | `homework` | Guided problem-solving with progressive hints |
| **Revise** | `revise` | Condensed summary with key concept reinforcement |
 
---
 
## 13. Key Design Principles
 
### Instructional Design First
 
BodhAI's output is not shaped by what is easy to generate—it is shaped by what instructional design research says is effective. Every lesson follows **Gagné's Nine Events**, ensuring attention, prior knowledge activation, content delivery, practice, and feedback are all addressed.
 
### Self-Verification Before Delivery
 
The Student-Evaluator-Refiner loop means BodhAI never delivers an explanation that it cannot verify a simulated beginner would understand. The system critiques its own output before the user ever sees it.
 
### Structured Outputs for Rich UI
 
Rather than returning Markdown text, the backend enforces strict JSON output (native JSON-mode via Groq). This allows the frontend to render interactive, stateful UI components—quizzes, hint reveals, toggle views—rather than flat text.
 
### Transparency Through Before/After View
 
By exposing the original and improved explanations side-by-side, BodhAI makes its reasoning process visible, building user trust and demonstrating the value of its internal feedback loop.
 
### Adaptive Difficulty
 
By tracking quiz accuracy per topic via `TopicProgress`, the system adjusts the difficulty of future content and assessments, ensuring learners are always appropriately challenged.
 
---
 
*Built with speed, aesthetics, and instructional design principles in mind.*
 
