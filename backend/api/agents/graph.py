import json
import re
from typing import TypedDict, List
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

class BodhState(TypedDict):
    input: str
    mode: str
    architectOutline: str
    explanation: str
    steps: List[str]
    question: str

def architect_node(state: BodhState) -> BodhState:
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    prompt = f"""You are an expert curriculum architect. 
Identify key concepts and create a structured learning outline for the following topic:

Topic: {state.get('input', '')}

Return the structure directly in bullet points or a short outline."""

    response = llm.invoke([
        SystemMessage(content="You are a helpful AI architect."),
        HumanMessage(content=prompt)
    ])
    
    return {"architectOutline": response.content}

def content_node(state: BodhState) -> BodhState:
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
    prompt = f"""You are an expert AI tutor. Your task is to generate learning content based on the user's preferred learning style.

### Topic:
{state.get('input', '')}

### Learning Mode:
{state.get('mode', 'balanced')}

### Outline from Architect:
{state.get('architectOutline', '')}

### Instructions:
Adapt your explanation based on the mode:
- If mode = "beginner": Explain in very simple terms, use analogies and real-life examples, avoid jargon.
- If mode = "balanced": Mix intuition with moderate technical depth, keep explanation clear but slightly deeper.
- If mode = "advanced": Provide technical depth, include detailed reasoning, assume prior knowledge.

### Output Format:
Return your response STRICTLY as a JSON object with the following schema, and NOTHING else. Do not use Markdown JSON wrappers if possible, just return the raw JSON text.
{{
  "explanation": "...",
  "steps": ["...", "..."],
  "question": "..."
}}"""

    response = llm.invoke([
        SystemMessage(content="You are an AI tutor that strictly returns JSON."),
        HumanMessage(content=prompt)
    ])
    
    content_str = response.content
    try:
        json_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', content_str)
        if json_match:
            content_str = json_match.group(1)
        parsed = json.loads(content_str.strip())
        return {
            "explanation": parsed.get("explanation", ""),
            "steps": parsed.get("steps", []),
            "question": parsed.get("question", "")
        }
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        return {
            "explanation": content_str,
            "steps": [],
            "question": "Failed to generate structured question."
        }

workflow = StateGraph(BodhState)
workflow.add_node("architect", architect_node)
workflow.add_node("content", content_node)
workflow.add_edge(START, "architect")
workflow.add_edge("architect", "content")
workflow.add_edge("content", END)

graph = workflow.compile()
