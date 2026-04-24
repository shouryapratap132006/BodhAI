"""
API views for BodhAI backend.

Endpoints:
  POST /api/learn/    → accept topic/file, run agents, save & return result
  GET  /api/history/  → return all past learnings, newest first
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import LearningHistory
from .serializers import LearningHistorySerializer
from .utils.extraction import extract_file_content
from .agents.graph import graph


class HistoryView(APIView):
    """Return the full learning history, newest first."""

    def get(self, request):
        history = LearningHistory.objects.all().order_by("-created_at")
        serializer = LearningHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LearnView(APIView):
    """
    Accept a topic (text) or a file upload, run the LangGraph pipeline,
    persist the result, and return structured learning content.
    """

    def post(self, request):
        input_text: str = request.data.get("input", "").strip()
        mode: str = request.data.get("mode", "balanced").strip().lower()
        file_obj = request.FILES.get("file")
        file_type: str | None = None

        # ── Validate mode ──────────────────────────────────────
        valid_modes = {"beginner", "balanced", "advanced"}
        if mode not in valid_modes:
            mode = "balanced"

        # ── File ingestion ─────────────────────────────────────
        if file_obj:
            extracted, file_type = extract_file_content(file_obj, file_obj.name)
            if extracted:
                # Prepend a header so the LLM knows the source
                header = f"[Content extracted from uploaded {file_type.upper()} file]\n\n"
                input_text = header + extracted + (
                    f"\n\nAdditional context from user: {input_text}" if input_text else ""
                )

        # ── Validate combined input ────────────────────────────
        if not input_text:
            return Response(
                {"error": "Please provide a topic or upload a file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Run LangGraph pipeline ─────────────────────────────
        initial_state = {
            "input": input_text,
            "mode": mode,
            "architect_outline": "",
            "explanation": "",
            "steps": [],
            "question": "",
        }

        try:
            result = graph.invoke(initial_state)
        except Exception as exc:
            print(f"[BodhAI] Agent error: {exc}")
            return Response(
                {"error": "AI pipeline failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        explanation = result.get("explanation", "")
        steps = result.get("steps", [])
        question = result.get("question", "")

        if not explanation:
            return Response(
                {"error": "AI returned an empty response. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── Persist to database ────────────────────────────────
        # Store a clean version of input_text (user text only, not file dump)
        display_input = request.data.get("input", "").strip()

        record = LearningHistory.objects.create(
            input_text=display_input,
            mode=mode,
            explanation=explanation,
            steps=steps,
            question=question,
            file_type=file_type,
        )

        # ── Return response ────────────────────────────────────
        return Response(
            {
                "id": record.id,
                "explanation": explanation,
                "steps": steps,
                "question": question,
            },
            status=status.HTTP_200_OK,
        )
