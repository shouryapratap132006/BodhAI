import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from api.agents.graph import _workflow
graph = _workflow.compile()
initial_state = {
    "input": "Evaluate my answer to this question: Find the integral of x^2 * sin(x). My answer is: cos x",
    "mode": "balanced",
    "teaching_mode": "test",
    "conversation_history": [{"role": "user", "content": "evaluate my answer"}],
    "current_topic": "Math",
    "previous_topic": "",
    "is_new_topic": False,
    "user_level": "Beginner",
    "weak_areas": [],
    "last_score": 0.0,
    "intent": "",
    "architect_outline": "",
    "refinement_pass": 0,
    "response_type": "",
    "explanation": "",
    "steps": [],
    "hint": "",
    "solution": "",
    "questions": [],
    "example": "",
    "student_attempt": "",
    "evaluation": {},
    "improved_explanation": "",
    "resources": [],
    "needs_refinement": False,
    "hint_levels": [],
    "mistake_analysis": {},
    "next_recommended_topic": "",
    "topic_progress": {},
}
try:
    print(graph.invoke(initial_state))
except Exception as e:
    import traceback
    traceback.print_exc()
