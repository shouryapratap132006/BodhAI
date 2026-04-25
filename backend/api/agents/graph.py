"""
LangGraph agent graph for BodhAI — Phase 3.

Pipeline:
  Intent Detection → Architect → Content → Student → Evaluator
  → Decision (conditional)
      ├─ correct/done → END
      └─ needs_refinement → Refiner → Content (loop, max 2 passes)

Intents:
  learn_topic | solve_question | revise | quiz_me | homework | explain_again
"""

import json
import re
from typing import TypedDict, List, Optional, Literal
from duckduckgo_search import DDGS

from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage


# ─────────────────────────────────────────────────────────────────────────────
# State schema
# ─────────────────────────────────────────────────────────────────────────────
class BodhState(TypedDict):
    # Inputs
    input: str
    mode: str                               # beginner | balanced | advanced
    teaching_mode: str                      # learn | test
    conversation_history: List[dict]        # [{"role": "user"|"assistant", "content": "..."}]

    # Intermediate
    intent: str                             # learn_topic | solve_question | ...
    architect_outline: str
    refinement_pass: int                    # 0-based counter; max 2

    # Output fields
    response_type: str                      # learn | solve | quiz | homework | revise
    explanation: str
    steps: List[str]
    hint: str
    solution: str
    questions: List[dict]                   # [{text, options, answer, type}]
    example: str
    student_attempt: str
    evaluation: dict                        # {correct: bool, feedback: str}
    improved_explanation: str
    resources: List[dict]                   # [{title, type, link}]
    lesson_structure: dict
    needs_refinement: bool
    hint_levels: List[str]
    mistake_analysis: dict
    next_recommended_topic: str
    topic_progress: dict


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _llm(temperature: float = 0, json_mode: bool = False) -> ChatGroq:
    if json_mode:
        return ChatGroq(model="llama-3.3-70b-versatile", temperature=temperature, model_kwargs={"response_format": {"type": "json_object"}})
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=temperature)

def _fetch_trusted_resources(query: str) -> List[dict]:
    """Fetch verified real YouTube videos and trusted articles using DuckDuckGo."""
    resources = []
    try:
        ddgs = DDGS()
        # Fetch 2 educational videos
        videos = list(ddgs.videos(f"{query} educational tutorial", max_results=2))
        for v in videos:
            if v.get("content"):
                resources.append({
                    "title": v.get("title", "Educational Video"),
                    "type": "video",
                    "link": v.get("content")
                })
                
        # Fetch 2 trusted articles from verified educational domains
        domains = "site:khanacademy.org OR site:coursera.org OR site:mit.edu OR site:libretexts.org OR site:byjus.com OR site:brilliant.org"
        articles = list(ddgs.text(f"{query} {domains}", max_results=2))
        # If no strict domain hits, fallback to a general query
        if not articles:
             articles = list(ddgs.text(f"{query} tutorial explanation", max_results=2))
             
        for a in articles:
            # Skip wikipedia if requested, though sometimes it's okay. We already prioritize educational domains.
            if a.get("href") and "wikipedia.org" not in a.get("href"):
                resources.append({
                    "title": a.get("title", "Educational Article"),
                    "type": "article",
                    "link": a.get("href")
                })
    except Exception as e:
        print(f"Error fetching resources: {e}")
        # Fallback to guaranteed working search links if DDG is rate-limited
        resources = [
            {
                "title": f"YouTube Lessons: {query.title()}",
                "type": "video",
                "link": f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}+tutorial"
            },
            {
                "title": f"Wikipedia: {query.title()}",
                "type": "article",
                "link": f"https://en.wikipedia.org/wiki/Special:Search?search={query.replace(' ', '+')}"
            }
        ]

    # Cap to max 4 resources
    return resources[:4]


def _safe_json(raw: str) -> dict:
    """Parse JSON robustly, stripping markdown fences."""
    raw = raw.strip()
    # Remove ```json ... ``` fences
    m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", raw)
    if m:
        raw = m.group(1)
    # Find first { ... } block
    m2 = re.search(r"\{[\s\S]*\}", raw)
    if m2:
        raw = m2.group(0)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def _history_to_text(history: List[dict], limit: int = 6) -> str:
    """Serialize recent conversation history to a plain-text block."""
    if not history:
        return "No prior conversation."
    recent = history[-limit:]
    lines = []
    for msg in recent:
        role = "Student" if msg.get("role") == "user" else "BodhAI"
        lines.append(f"{role}: {msg.get('content', '')}")
    return "\n".join(lines)


def _mode_instructions(mode: str) -> str:
    return {
        "beginner": (
            "Use very simple language, real-life analogies, and avoid jargon. "
            "Assume the student knows nothing about the topic."
        ),
        "balanced": (
            "Mix intuitive explanation with moderate technical depth. "
            "Keep it clear but informative."
        ),
        "advanced": (
            "Provide full technical depth. Include precise reasoning. "
            "Assume strong prior knowledge."
        ),
    }.get(mode, "")


# ─────────────────────────────────────────────────────────────────────────────
# Node 1: Intent Detection
# ─────────────────────────────────────────────────────────────────────────────
def intent_node(state: BodhState) -> dict:
    """
    Classify the user's request into one of six intents.
    Uses a fast, zero-temp call to avoid hallucination.
    """
    llm = _llm(temperature=0, json_mode=True)
    history_text = _history_to_text(state.get("conversation_history", []))
    prompt = (
        "You are an intent classifier for an AI tutoring system.\n\n"
        "Conversation history (recent):\n"
        f"{history_text}\n\n"
        "New user message:\n"
        f"{state.get('input', '')}\n\n"
        f"Active Teaching Mode: {state.get('teaching_mode', 'learn')}\n\n"
        "Classify the intent into EXACTLY ONE of:\n"
        "  learn_topic     – wants to learn/understand a concept\n"
        "  solve_question  – wants help solving a problem, OR is asking for the solution/answer to a question you just asked them\n"
        "  quiz_me         – wants to be tested (MCQs, questions)\n"
        "  test_me         – wants a single challenge problem/question to solve with hints and solution (PREFER THIS IF Active Teaching Mode is 'test')\n"
        "  homework        – wants practice problems / assignments\n"
        "  revise          – wants a quick revision/recap\n"
        "  explain_again   – wants a simpler or deeper re-explanation\n"
        "  get_resources   – wants links, videos, or study materials for a topic\n\n"
        'Return ONLY a raw JSON object: {"intent": "<one of the above>"}'
    )
    resp = llm.invoke([
        SystemMessage(content="You are a precise intent classifier. Return only valid JSON."),
        HumanMessage(content=prompt),
    ])
    parsed = _safe_json(resp.content)
    intent = parsed.get("intent", "learn_topic")
    
    # Force 'test_me' if we are in 'test' mode and it's a general topic request
    if state.get("teaching_mode") == "test" and intent in ["learn_topic", "quiz_me"]:
        intent = "test_me"
        
    valid = {"learn_topic", "solve_question", "quiz_me", "test_me", "homework", "revise", "explain_again", "get_resources"}
    if intent not in valid:
        intent = "learn_topic"
        
    # Phase 6: If the user is in "Test Me" mode and asks about a topic, force the intent to "quiz_me"
    teaching_mode = state.get("teaching_mode", "learn")
    if teaching_mode == "test" and intent == "learn_topic":
        intent = "quiz_me"
        
    return {"intent": intent, "refinement_pass": 0}


# ─────────────────────────────────────────────────────────────────────────────
# Node 2: Architect
# ─────────────────────────────────────────────────────────────────────────────
def architect_node(state: BodhState) -> dict:
    """Produce a concise learning outline tailored to the detected intent."""
    llm = _llm(temperature=0)
    intent = state.get("intent", "learn_topic")
    intent_guidance = {
        "learn_topic":    "Create a structured concept outline with key sub-topics.",
        "solve_question": "Break the problem into solvable sub-steps. Identify the core concept tested.",
        "quiz_me":        "Identify 3-5 testable concepts worth quizzing on.",
        "test_me":        "Formulate one single, challenging problem to test the user's deep understanding.",
        "homework":       "Identify 4-6 concepts of increasing difficulty suitable for practice.",
        "revise":         "List 4-6 key revision points or common pitfalls.",
        "explain_again":  "Identify the concept that needs re-explanation and simplest analogies.",
    }.get(intent, "Create a structured concept outline.")

    prompt = (
        f"Intent: {intent}\n"
        f"Topic/Question: {state.get('input', '')}\n\n"
        f"Task: {intent_guidance}\n\n"
        "Return a bullet-point outline only. Be concise (max 8 bullets). "
        "For 'learn_topic', explicitly align with instructional design principles (e.g., Gagne's 9 Events or Merrill's First Principles)."
    )
    resp = llm.invoke([
        SystemMessage(content="You are an expert curriculum architect."),
        HumanMessage(content=prompt),
    ])
    return {"architect_outline": resp.content}


# ─────────────────────────────────────────────────────────────────────────────
# Node 3: Content Agent
# ─────────────────────────────────────────────────────────────────────────────
def content_node(state: BodhState) -> dict:
    """
    Generate the primary response based on intent.
    On refinement passes, incorporates the evaluator's feedback.
    """
    llm = _llm(temperature=0.3, json_mode=True)
    intent = state.get("intent", "learn_topic")
    mode = state.get("mode", "balanced")
    mode_instr = _mode_instructions(mode)
    history_text = _history_to_text(state.get("conversation_history", []))
    refinement_pass = state.get("refinement_pass", 0)
    evaluation = state.get("evaluation", {})

    # Refinement context
    refine_ctx = ""
    if refinement_pass > 0:
        prev_exp = state.get("improved_explanation") or state.get("explanation", "")
        feedback = evaluation.get("feedback", "")
        refine_ctx = (
            f"\n\n### Previous Explanation (needs improvement):\n{prev_exp}"
            f"\n\n### Evaluator Feedback:\n{feedback}"
            f"\n\nIMPORTANT: Improve the explanation based on this feedback. "
            "Make it simpler, add better examples, and address the gaps identified."
        )

    # Build intent-specific output spec
    output_specs = {
        "learn_topic": (
            "learn",
            '{"response_type":"learn",'
            '"lesson_structure":{"attention":"...","objectives":"...","prior_knowledge":"...","content":"...","guided_practice":"...","assessment":"...","feedback":"...","improvement":"..."},'
            '"explanation":"...","steps":["..."],'
            '"example":"...","question":"...","next_recommended_topic":"...","topic_progress":{"accuracy":80,"level":"medium"},"resources":[{"title":"...","type":"article|video","link":"..."}]}'
        ),
        "solve_question": (
            "solve",
            '{"response_type":"solve","hint_levels":["hint 1...","hint 2...","almost solution..."],"steps":["..."],'
            '"solution":"...","mistake_analysis":{"mistake":"...","why_wrong":"...","correct_approach":"...","tip":"..."},"next_recommended_topic":"...","topic_progress":{"accuracy":60,"level":"medium"},"resources":[{"title":"...","type":"article|video","link":"..."}]}'
        ),
        "quiz_me": (
            "quiz",
            '{"response_type":"quiz","explanation":"Brief intro to the test...","questions":['
            '{"type":"mcq","text":"...","options":["A)...","B)...","C)...","D)..."],"answer":"A","hint":"explanation of answer..."},'
            '{"type":"mcq","text":"...","options":["A)...","B)...","C)...","D)..."],"answer":"B","hint":"explanation of answer..."},'
            '{"type":"short","text":"...","answer":"..."}],"next_recommended_topic":"...","topic_progress":{"accuracy":60,"level":"medium"}}'
        ),
        "test_me": (
            "solve",
            '{"response_type":"solve","explanation":"Here is a challenge for you...","questions":[{"type":"conceptual","text":"[The Challenge Question]"}],"hint_levels":["Hint 1...","Hint 2...","Almost there..."],"steps":["Step 1...","Step 2..."],"solution":"[Full Detailed Solution]","next_recommended_topic":"...","topic_progress":{"accuracy":60,"level":"medium"}}'
        ),
        "homework": (
            "homework",
            '{"response_type":"homework","questions":['
            '{"type":"easy","text":"...","hint":"..."},'
            '{"type":"medium","text":"...","hint":"..."},'
            '{"type":"hard","text":"...","hint":"..."},'
            '{"type":"challenge","text":"...","hint":"..."}]}'
        ),
        "revise": (
            "revise",
            '{"response_type":"revise","steps":["key point..."],'
            '"questions":[{"type":"conceptual","text":"..."},{"type":"conceptual","text":"..."}]}'
        ),
        "explain_again": (
            "learn",
            '{"response_type":"learn","explanation":"...","steps":["..."],'
            '"example":"...","question":"...","resources":[]}'
        ),
        "get_resources": (
            "learn",
            '{"response_type":"learn","explanation":"Brief overview of the topic before sharing resources...","resources":[]}'
        ),
    }

    resp_type, output_template = output_specs.get(intent, output_specs["learn_topic"])

    prompt = (
        "You are an expert AI tutor.\n\n"
        f"### Conversation History:\n{history_text}\n\n"
        f"### Current Input:\n{state.get('input', '')}\n\n"
        f"### Learning Outline:\n{state.get('architect_outline', '')}\n\n"
        f"### Learning Mode: {mode} (Teaching mode: {state.get('teaching_mode', 'learn')})\n{mode_instr}\n\n"
        f"### Intent: {intent}\n"
        + refine_ctx
        + "\n\n### Output Format (return ONLY this JSON, no markdown):\n"
        + output_template
        + "\n\nRules:\n"
        "- For 'learn_topic', populate 'lesson_structure' acting as an Autonomous Instructional Designer.\n"
        "- If teaching_mode is 'test', YOU MUST NOT provide a full explanation or solution. You MUST only provide questions to quiz the user, or progressive hint_levels. Your 'explanation' field should just be a brief intro like 'Let's test your knowledge!'\n"
        "- If the user provides a wrong answer or struggles, populate 'mistake_analysis'.\n"
        "- If teaching_mode is 'test' or intent is 'solve_question', prefer giving progressive 'hint_levels' instead of direct answers.\n"
        "- Always populate 'topic_progress' (estimate accuracy 0-100 and level easy/medium/hard) and 'next_recommended_topic'.\n"
        "- explanation: 2-4 paragraphs (ONLY IF teaching_mode is 'learn')\n"
        "- steps: 3-6 actionable steps\n"
        "- For resources: Provide real links to Khan Academy, Wikipedia, or YouTube only.\n"
        "- Be context-aware of the conversation history. If the user is asking for the solution to a question YOU just asked them, provide the exact solution instead of generating new concepts!"
    )

    resp = llm.invoke([
        SystemMessage(content="You are an AI tutor. Return only valid JSON. No markdown fences."),
        HumanMessage(content=prompt),
    ])

    parsed = _safe_json(resp.content)
    if not parsed:
        # Fallback
        parsed = {
            "response_type": resp_type,
            "explanation": resp.content,
            "steps": [],
        }

    # Inject VERIFIED REAL resources if it's an intent that benefits from resources
    final_resources = parsed.get("resources", [])
    if intent in ["learn_topic", "solve_question", "get_resources"]:
        query = state.get("input", "")
        
        # If the user just clicked "Get resources on this", we need to search for the ACTUAL topic
        if intent == "get_resources" or "resource" in query.lower() or len(query) < 5:
            history = state.get("conversation_history", [])
            last_topic = ""
            # Find the last meaningful user question that wasn't just "get resources"
            for msg in reversed(history):
                if msg.get("role") == "user":
                    content = msg.get("content", "")
                    if "resource" not in content.lower() and len(content) > 3:
                        last_topic = content
                        break
            
            if last_topic:
                query = last_topic
                
        fetched = _fetch_trusted_resources(query)
        if fetched:
            final_resources = fetched

    explanation = parsed.get("explanation", "")
    if isinstance(explanation, dict):
        explanation = "\n\n".join([str(v) for v in explanation.values()])

    return {
        "response_type":  parsed.get("response_type", resp_type),
        "explanation":    explanation,
        "steps":          parsed.get("steps", []),
        "hint":           parsed.get("hint", ""),
        "solution":       parsed.get("solution", ""),
        "questions":      parsed.get("questions", []),
        "example":        parsed.get("example", ""),
        "resources":      final_resources,
        "lesson_structure": parsed.get("lesson_structure", {}),
        "hint_levels":    parsed.get("hint_levels", []),
        "mistake_analysis": parsed.get("mistake_analysis", {}),
        "next_recommended_topic": parsed.get("next_recommended_topic", ""),
        "topic_progress": parsed.get("topic_progress", {}),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Node 4: Student Agent
# ─────────────────────────────────────────────────────────────────────────────
def student_node(state: BodhState) -> dict:
    """
    Simulate a beginner student attempting to engage with the content.
    Only runs for learn/solve intents to generate a realistic student response.
    """
    intent = state.get("intent", "learn_topic")
    # Student simulation only makes sense for learning/solving
    if intent in {"quiz_me", "homework"}:
        return {"student_attempt": ""}

    llm = _llm(temperature=0.6, json_mode=True)  # Higher temp for more varied student responses
    explanation = state.get("explanation", "")
    steps = state.get("steps", [])

    prompt = (
        "You are simulating a beginner student who just read the following explanation.\n\n"
        f"Explanation: {explanation[:800]}\n\n"
        f"Steps: {json.dumps(steps[:4])}\n\n"
        "As a beginner, write a SHORT (1-2 sentences) confused or partially correct "
        "attempt/question that reveals a common misconception or gap in understanding. "
        "Be realistic — students often miss subtle points or confuse similar concepts.\n\n"
        "Return ONLY a raw JSON: {\"attempt\": \"...\"}"
    )
    resp = llm.invoke([
        SystemMessage(content="You simulate a beginner student. Return only JSON."),
        HumanMessage(content=prompt),
    ])
    parsed = _safe_json(resp.content)
    return {"student_attempt": parsed.get("attempt", "")}


# ─────────────────────────────────────────────────────────────────────────────
# Node 5: Evaluator Agent
# ─────────────────────────────────────────────────────────────────────────────
def evaluator_node(state: BodhState) -> dict:
    """
    Evaluate whether the content explanation is clear and complete.
    If a student attempt exists, evaluate that too.
    """
    llm = _llm(temperature=0, json_mode=True)
    explanation = state.get("explanation", "")
    steps = state.get("steps", [])
    student_attempt = state.get("student_attempt", "")
    intent = state.get("intent", "learn_topic")
    refinement_pass = state.get("refinement_pass", 0)

    # Skip evaluation for quiz/homework — they don't need feedback loop
    if intent in {"quiz_me", "homework"} or refinement_pass >= 2:
        return {
            "evaluation": {"correct": True, "feedback": ""},
            "needs_refinement": False,
        }

    eval_focus = ""
    if student_attempt:
        eval_focus = (
            f"\n\nStudent's attempt/response:\n{student_attempt}\n\n"
            "Also evaluate if the student's misconception is addressed in the explanation."
        )

    prompt = (
        "You are an expert educational evaluator.\n\n"
        f"Intent: {intent}\n"
        f"Explanation provided:\n{explanation[:1200]}\n\n"
        f"Steps: {json.dumps(steps[:4])}\n"
        + eval_focus
        + "\n\nEvaluate:\n"
        "1. Is the explanation clear, complete, and accurate?\n"
        "2. Detect Learning Gaps: Identify misunderstood concepts, weak reasoning, or incorrect assumptions.\n"
        "3. Does it address the student's level? Are there missing examples?\n\n"
        "Return ONLY a raw JSON:\n"
        '{"correct": true/false, "feedback": "specific pedagogical improvement suggestion or empty string"}\n\n'
        "Set correct=true if explanation is highly effective (no refinement needed).\n"
        "Set correct=false ONLY if there are clear pedagogical gaps or confusion."
    )
    resp = llm.invoke([
        SystemMessage(content="You are an educational evaluator. Return only JSON."),
        HumanMessage(content=prompt),
    ])
    parsed = _safe_json(resp.content)
    correct = parsed.get("correct", True)
    feedback = parsed.get("feedback", "")

    return {
        "evaluation": {"correct": correct, "feedback": feedback},
        "needs_refinement": not correct,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Node 6: Refiner Agent
# ─────────────────────────────────────────────────────────────────────────────
def refiner_node(state: BodhState) -> dict:
    """
    Improve the explanation based on evaluator feedback.
    Produces an improved_explanation and increments refinement_pass.
    """
    llm = _llm(temperature=0.2, json_mode=True)
    explanation = state.get("explanation", "")
    feedback = state.get("evaluation", {}).get("feedback", "")
    mode = state.get("mode", "balanced")
    mode_instr = _mode_instructions(mode)

    prompt = (
        "You are an expert AI tutor improving a lesson explanation.\n\n"
        f"Original Explanation:\n{explanation}\n\n"
        f"Evaluator Feedback:\n{feedback}\n\n"
        f"Mode: {mode}\n{mode_instr}\n\n"
        "Write an improved version of the explanation:\n"
        "- Address the specific feedback and correct any identified learning gaps\n"
        "- Simplify explanations, adjust examples, and modify difficulty if needed\n"
        "- Keep it concise (2-3 paragraphs)\n\n"
        'Return ONLY raw JSON: {"improved_explanation": "your full text here"}\n'
        'CRITICAL: "improved_explanation" MUST be a single string, not a nested object/dictionary.'
    )
    resp = llm.invoke([
        SystemMessage(content="You are an AI tutor refiner. Return only JSON."),
        HumanMessage(content=prompt),
    ])
    parsed = _safe_json(resp.content)
    improved = parsed.get("improved_explanation", explanation)
    
    # If LLM ignored instructions and returned a dict, flatten it into a string
    if isinstance(improved, dict):
        improved = "\n\n".join([str(v) for v in improved.values()])

    return {
        "improved_explanation": improved,
        "refinement_pass": state.get("refinement_pass", 0) + 1,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Decision Function (conditional edge)
# ─────────────────────────────────────────────────────────────────────────────
def should_refine(state: BodhState) -> Literal["refine", "end"]:
    """Route to refiner if evaluation flagged issues and we haven't exceeded max passes."""
    needs_refinement = state.get("needs_refinement", False)
    refinement_pass = state.get("refinement_pass", 0)
    if needs_refinement and refinement_pass < 2:
        return "refine"
    return "end"


# ─────────────────────────────────────────────────────────────────────────────
# Build & compile graph (once at import time)
# ─────────────────────────────────────────────────────────────────────────────
_workflow = StateGraph(BodhState)

# Add nodes
_workflow.add_node("intent",    intent_node)
_workflow.add_node("architect", architect_node)
_workflow.add_node("content",   content_node)
_workflow.add_node("student",   student_node)
_workflow.add_node("evaluator", evaluator_node)
_workflow.add_node("refiner",   refiner_node)

# Linear edges
_workflow.add_edge(START,       "intent")
_workflow.add_edge("intent",    "architect")
_workflow.add_edge("architect", "content")
_workflow.add_edge("content",   "student")
_workflow.add_edge("student",   "evaluator")

# Conditional: evaluator → refine OR end
_workflow.add_conditional_edges(
    "evaluator",
    should_refine,
    {"refine": "refiner", "end": END},
)

# Refiner completes the loop and goes to END
_workflow.add_edge("refiner", END)

graph = _workflow.compile()
