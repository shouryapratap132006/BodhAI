# BodhAI System Architecture & Workflow

## Overview
BodhAI is an "Autonomous Instructional Designer" that serves as a sophisticated AI tutor. Rather than just acting as a simple Q&A chatbot, it applies structured instructional design frameworks (like Gagné’s Nine Events of Instruction) to structure, evaluate, and dynamically refine learning experiences.

The system is split into two primary components:
1. **Frontend**: A Next.js (App Router) React application.
2. **Backend**: A Django application that orchestrates an agentic pipeline using LangGraph and Groq.

---

## 1. Backend Architecture & Workflow
The core intelligence of BodhAI lives in `backend/api/agents/graph.py`. When a user submits a prompt, it passes through a **multi-agent LangGraph pipeline**:

### Agentic Pipeline Flow
1. **Intent Detection Agent**
   - **Function**: Quickly classifies the user's request (e.g., `learn_topic`, `solve_question`, `quiz_me`, `homework`, `revise`, `get_resources`).
   - **Behavior**: Uses a fast LLM call (temp = 0) to ensure predictable routing.
2. **Architect Agent**
   - **Function**: Creates a structural "blueprint" or outline tailored to the specific intent (e.g., steps to solve a problem, or core sub-topics to learn).
3. **Content Agent**
   - **Function**: The workhorse. It drafts the primary pedagogical content. 
   - **Output Format**: Returns strict JSON mapped to frontend UI blocks, such as `lesson_structure`, `steps`, `mistake_analysis`, `hint_levels`, and interactive `questions`. It also explicitly searches DuckDuckGo for real educational links (YouTube, Khan Academy) to attach as `resources`.
4. **Student Agent (Simulation)**
   - **Function**: Acts as a "Beginner Student" who reads the Content Agent's draft. It deliberately generates a confused response or misconception based on the drafted text to simulate how a real student might misinterpret the lesson.
5. **Evaluator Agent**
   - **Function**: Acts as the "Teacher". It reviews the drafted content alongside the simulated "Student's attempt" to identify *Learning Gaps*—checking if the explanation is clear, complete, and prevents common misunderstandings.
6. **Refiner Agent** *(Conditional)*
   - **Function**: If the Evaluator finds the content lacking, the Refiner rewrites the explanation. This loop can run up to 2 times to polish the final response before it is sent to the user.

### Backend Data Models
- **Conversation & Message (`models.py`)**: Stores the full history. A `Message` stores the user's input alongside the highly structured JSON output from the AI (including the original vs. improved explanations).
- **LearningPath & TopicProgress**: Tracks what the user is learning and their accuracy on interactive quizzes to dynamically adjust difficulty (easy/medium/hard).

---

## 2. Frontend Architecture & Workflow
The frontend (`frontend/src/app`) translates the backend's rich JSON payload into an interactive, visually stunning interface.

### Key Components
- **`page.tsx`**: The main chat view. Handles sending messages to the Django API, streaming/loading state, and maintaining conversation history.
- **`ChatMessage.tsx`**: The core rendering engine. It dynamically renders different UI blocks depending on what the backend provides:
  - **Lesson Plan Block**: Renders the 8-step instructional plan (Gain Attention, Objectives, Content, Assessment, etc.).
  - **Interactive Hint Block**: Reveals progressive hints for problem-solving.
  - **Mistake Analysis**: Visualizes why a certain approach is wrong and provides the correct approach.
  - **Playable Quiz**: Renders interactive MCQs. When the user answers, it posts their score back to the Django API (`/api/topic-progress/`) to track accuracy.
  - **Original vs. Improved Toggle**: Shows the user how the internal AI feedback loop improved the explanation from the first draft to the final output.

---

## 3. End-to-End System Data Flow
1. **User Action**: The user types a message (e.g., "Teach me calculus") and selects a mode ("Beginner").
2. **API Request**: The Next.js frontend posts to the Django endpoint `POST /api/chat/`.
3. **Graph Invocation**: Django initializes a `BodhState` object with the user input and past conversation history, then invokes the LangGraph pipeline (`graph.invoke(initial_state)`).
4. **Agent Loop**: The Intent -> Architect -> Content -> Student -> Evaluator -> Refiner cycle runs internally.
5. **Persistence**: The final optimized response is saved to the SQLite/PostgreSQL database via the `Message` model.
6. **UI Rendering**: The JSON is returned to the frontend. `ChatMessage.tsx` unpacks the JSON and renders the appropriate interactive blocks.
