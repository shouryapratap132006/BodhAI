"""
API views for BodhAI Phase 3.

Endpoints:
  POST /api/chat/                     → Send a message (new or existing conversation)
  GET  /api/conversations/            → List all conversations (sidebar)
  GET  /api/conversations/<id>/       → Get full conversation with messages
  DELETE /api/conversations/<id>/     → Delete a conversation
  GET  /api/history/                  → Legacy Phase 1/2 history
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import LearningHistory, Conversation, Message
from .serializers import (
    LearningHistorySerializer,
    ConversationSerializer,
    ConversationListSerializer,
    MessageSerializer,
)
from .utils.extraction import extract_file_content
from .agents.graph import graph


# ─────────────────────────────────────────────────────────────────────────────
# Helper: build conversation history list for LangGraph state
# ─────────────────────────────────────────────────────────────────────────────
def _build_history(conversation: Conversation) -> list:
    """
    Convert DB messages into a [{role, content}] list for the LangGraph state.
    We keep the last 8 turns (16 messages) to bound token usage.
    """
    messages = conversation.messages.order_by("created_at")[:16]
    history = []
    for msg in messages:
        history.append({"role": "user", "content": msg.user_input})
        # Summarise the assistant reply so it doesn't explode context
        assistant_content = msg.explanation or msg.solution or ""
        if msg.hint:
            assistant_content = f"Hint: {msg.hint}\n\n{assistant_content}"
        history.append({"role": "assistant", "content": assistant_content[:600]})
    return history


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/chat/
# ─────────────────────────────────────────────────────────────────────────────
class ChatView(APIView):
    """
    Core Phase 3 chat endpoint.
    Accepts text input + optional file, runs the Phase 3 LangGraph pipeline,
    persists results, and returns structured response.
    """

    def post(self, request):
        input_text: str = request.data.get("input", "").strip()
        mode: str       = request.data.get("mode", "balanced").strip().lower()
        conv_id         = request.data.get("conversation_id")   # None → new conversation
        file_obj        = request.FILES.get("file")
        file_type       = None

        # ── Validate mode ──────────────────────────────────────────────────
        valid_modes = {"beginner", "balanced", "advanced"}
        if mode not in valid_modes:
            mode = "balanced"

        # ── File ingestion ─────────────────────────────────────────────────
        if file_obj:
            extracted, file_type = extract_file_content(file_obj, file_obj.name)
            if extracted:
                header = f"[Content extracted from uploaded {file_type.upper()} file]\n\n"
                input_text = (
                    header + extracted
                    + (f"\n\nAdditional context: {input_text}" if input_text else "")
                )

        # ── Validate combined input ────────────────────────────────────────
        if not input_text:
            return Response(
                {"error": "Please provide a message or upload a file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Resolve / create conversation ──────────────────────────────────
        conversation = None
        if conv_id:
            try:
                conversation = Conversation.objects.get(id=conv_id)
            except Conversation.DoesNotExist:
                pass  # fall through → create new

        if conversation is None:
            # Auto-title from first 60 chars of user input
            display_input = request.data.get("input", "").strip()
            title = display_input[:60] or (f"📄 Document" if file_obj else "New Chat")
            conversation = Conversation.objects.create(title=title, mode=mode)

        # ── Build conversation history for LangGraph ───────────────────────
        conversation_history = _build_history(conversation)

        # ── Run LangGraph Phase 3 pipeline ────────────────────────────────
        initial_state = {
            "input":                input_text,
            "mode":                 mode,
            "conversation_history": conversation_history,
            "intent":               "",
            "architect_outline":    "",
            "refinement_pass":      0,
            "response_type":        "",
            "explanation":          "",
            "steps":                [],
            "hint":                 "",
            "solution":             "",
            "questions":            [],
            "example":              "",
            "student_attempt":      "",
            "evaluation":           {},
            "improved_explanation": "",
            "resources":            [],
            "needs_refinement":     False,
        }

        try:
            result = graph.invoke(initial_state)
        except Exception as exc:
            print(f"[BodhAI] Agent pipeline error: {exc}")
            return Response(
                {"error": "AI pipeline failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── Extract result fields ──────────────────────────────────────────
        explanation          = result.get("explanation", "")
        improved_explanation = result.get("improved_explanation", "")
        intent               = result.get("intent", "learn_topic")
        response_type        = result.get("response_type", "learn")

        # Use improved explanation if refinement ran
        final_explanation = improved_explanation if improved_explanation else explanation

        if not final_explanation and not result.get("questions") and not result.get("hint"):
            return Response(
                {"error": "AI returned an empty response. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── Persist message ────────────────────────────────────────────────
        display_input = request.data.get("input", "").strip() or (
            f"[{file_type.upper()} file]" if file_type else ""
        )
        msg = Message.objects.create(
            conversation         = conversation,
            user_input           = display_input,
            file_type            = file_type,
            intent               = intent,
            response_type        = response_type,
            mode                 = mode,
            explanation          = final_explanation,
            steps                = result.get("steps", []),
            hint                 = result.get("hint", ""),
            solution             = result.get("solution", ""),
            example              = result.get("example", ""),
            questions            = result.get("questions", []),
            student_attempt      = result.get("student_attempt", ""),
            evaluation           = result.get("evaluation", {}),
            improved_explanation = improved_explanation,
            resources            = result.get("resources", []),
        )

        # Update conversation timestamp
        conversation.save()   # triggers auto_now on updated_at

        # ── Return response ────────────────────────────────────────────────
        return Response(
            {
                "conversation_id":    conversation.id,
                "conversation_title": conversation.title,
                "message_id":         msg.id,
                "intent":             intent,
                "type":               response_type,
                "explanation":        final_explanation,
                "steps":              result.get("steps", []),
                "hint":               result.get("hint", ""),
                "solution":           result.get("solution", ""),
                "example":            result.get("example", ""),
                "questions":          result.get("questions", []),
                "student_attempt":    result.get("student_attempt", ""),
                "evaluation":         result.get("evaluation", {}),
                "improved_explanation": improved_explanation,
                "resources":          result.get("resources", []),
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/conversations/
# ─────────────────────────────────────────────────────────────────────────────
class ConversationListView(APIView):
    """Return all conversations ordered by most recent, for the sidebar."""

    def get(self, request):
        convs = Conversation.objects.all().order_by("-updated_at")
        serializer = ConversationListSerializer(convs, many=True)
        return Response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
# GET / DELETE /api/conversations/<id>/
# ─────────────────────────────────────────────────────────────────────────────
class ConversationDetailView(APIView):
    """Fetch full conversation (with all messages) or delete it."""

    def get(self, request, conv_id):
        try:
            conv = Conversation.objects.prefetch_related("messages").get(id=conv_id)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ConversationSerializer(conv)
        return Response(serializer.data)

    def delete(self, request, conv_id):
        try:
            conv = Conversation.objects.get(id=conv_id)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        conv.delete()
        return Response({"deleted": True}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# Legacy endpoints (Phase 1/2 compatibility)
# ─────────────────────────────────────────────────────────────────────────────
class HistoryView(APIView):
    """Return the legacy Phase 1/2 learning history, newest first."""

    def get(self, request):
        history = LearningHistory.objects.all().order_by("-created_at")
        serializer = LearningHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LearnView(APIView):
    """
    Legacy Phase 1/2 learn endpoint.
    Kept for backwards compatibility — now delegates to ChatView internally.
    """

    def post(self, request):
        # Proxy to ChatView
        chat_view = ChatView()
        return chat_view.post(request)
