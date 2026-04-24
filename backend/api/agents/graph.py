"""
LangGraph agent graph for BodhAI.

Two-node pipeline:
  Architect  →  Content

The graph is compiled once at import time (cheap – just wires edges).
LLM clients are instantiated inside each node so they pick up the env
variable GROQ_API_KEY lazily, after Django settings have been loaded.
"""

import json
import re
from typing import TypedDict, List

from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage


# ── State schema ──────────────────────────────────────────────
class BodhState(TypedDict):
    input: str
    mode: str
    architect_outline: str
    explanation: str
    steps: List[str]
    question: str


# ── Architect node ────────────────────────────────────────────
def architect_node(state: BodhState) -> dict:
    """Identify key concepts and produce a learning outline."""
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    prompt = (
        "You are an expert curriculum architect.\n"
        "Identify the key concepts and create a concise, structured learning "
        "outline for the following topic/content.\n\n"
        f"Content:\n{state.get('input', '')}\n\n"
        "Return bullet-point outline only. Be brief."
    )
    response = llm.invoke([
        SystemMessage(content="You are a helpful AI curriculum architect."),
        HumanMessage(content=prompt),
    ])
    return {"architect_outline": response.content}


# ── Content node ──────────────────────────────────────────────
def content_node(state: BodhState) -> dict:
    """Generate explanation, steps, and a practice question."""
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)

    mode = state.get("mode", "balanced")
    mode_instructions = {
        "beginner": (
            "Explain in very simple terms. Use real-life analogies. "
            "Avoid jargon. Assume the reader knows nothing."
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

    prompt = (
        "You are an expert AI tutor.\n\n"
        f"### Content / Topic:\n{state.get('input', '')}\n\n"
        f"### Learning Outline:\n{state.get('architect_outline', '')}\n\n"
        f"### Learning Mode: {mode}\n"
        f"{mode_instructions}\n\n"
        "### Output Format:\n"
        "Return ONLY a raw JSON object (no markdown fences) matching:\n"
        '{"explanation": "...", "steps": ["...", "..."], "question": "..."}\n\n'
        "- explanation: 2-4 paragraphs\n"
        "- steps: 3-6 numbered learning steps\n"
        "- question: one reflective or practice question"
    )

    response = llm.invoke([
        SystemMessage(content="You are an AI tutor. Return only valid JSON."),
        HumanMessage(content=prompt),
    ])

    raw = response.content.strip()

    # Strip markdown code fences if the LLM wraps in them anyway
    json_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", raw)
    if json_match:
        raw = json_match.group(1)

    # Fallback: find first { ... } block
    brace_match = re.search(r"\{[\s\S]*\}", raw)
    if brace_match:
        raw = brace_match.group(0)

    try:
        parsed = json.loads(raw)
        return {
            "explanation": parsed.get("explanation", ""),
            "steps": parsed.get("steps", []),
            "question": parsed.get("question", ""),
        }
    except json.JSONDecodeError as exc:
        print(f"[BodhAI] JSON parse error: {exc}")
        return {
            "explanation": response.content,
            "steps": [],
            "question": "Could not generate a structured question.",
        }


# ── Build graph (compiled once) ───────────────────────────────
_workflow = StateGraph(BodhState)
_workflow.add_node("architect", architect_node)
_workflow.add_node("content", content_node)
_workflow.add_edge(START, "architect")
_workflow.add_edge("architect", "content")
_workflow.add_edge("content", END)

graph = _workflow.compile()
