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

from .models import Learning, Conversation, Message
from .serializers import (
    LearningSerializer,
    ConversationSerializer,
    ConversationListSerializer,
    MessageSerializer,
    LearningPathSerializer,
    TopicProgressSerializer,
)
from .models import Learning, Conversation, Message, LearningPath, TopicProgress
from .utils.extraction import extract_file_content
from .agents.graph import graph
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage


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
        teaching_mode: str = request.data.get("teaching_mode", "learn").strip().lower()
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
            "teaching_mode":        teaching_mode,
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
            "hint_levels":          [],
            "mistake_analysis":     {},
            "next_recommended_topic": "",
            "topic_progress":       {},
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

        # The `explanation` field should store the ORIGINAL explanation
        # The `improved_explanation` field stores the refinement

        if not explanation and not improved_explanation and not result.get("questions") and not result.get("hint"):
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
            explanation          = explanation,
            steps                = result.get("steps", []),
            hint                 = result.get("hint", ""),
            solution             = result.get("solution", ""),
            example              = result.get("example", ""),
            questions            = result.get("questions", []),
            student_attempt      = result.get("student_attempt", ""),
            evaluation           = result.get("evaluation", {}),
            improved_explanation = improved_explanation,
            resources            = result.get("resources", []),
            lesson_structure     = result.get("lesson_structure", {}),
            hint_levels          = result.get("hint_levels", []),
            mistake_analysis     = result.get("mistake_analysis", {}),
            next_recommended_topic = result.get("next_recommended_topic", ""),
            topic_progress       = result.get("topic_progress", {}),
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
                "explanation":        explanation,
                "steps":              result.get("steps", []),
                "hint":               result.get("hint", ""),
                "solution":           result.get("solution", ""),
                "example":            result.get("example", ""),
                "questions":          result.get("questions", []),
                "student_attempt":    result.get("student_attempt", ""),
                "evaluation":         result.get("evaluation", {}),
                "improved_explanation": improved_explanation,
                "resources":          result.get("resources", []),
                "lesson_structure":   result.get("lesson_structure", {}),
                "hint_levels":        result.get("hint_levels", []),
                "mistake_analysis":   result.get("mistake_analysis", {}),
                "next_recommended_topic": result.get("next_recommended_topic", ""),
                "topic_progress":     result.get("topic_progress", {}),
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
# Phase 2 Endpoints
# ─────────────────────────────────────────────────────────────────────────────
class HistoryView(APIView):
    """Return the Phase 2 learning history, newest first."""

    def get(self, request):
        history = Learning.objects.all().order_by("-created_at")
        serializer = LearningSerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HistoryDetailView(APIView):
    """Delete a specific Phase 2 history item."""

    def delete(self, request, history_id):
        try:
            history = Learning.objects.get(id=history_id)
        except Learning.DoesNotExist:
            return Response({"error": "History not found."}, status=status.HTTP_404_NOT_FOUND)
        history.delete()
        return Response({"deleted": True}, status=status.HTTP_200_OK)


class LearnView(APIView):
    """
    Phase 2 learn endpoint.
    Accepts text or file, processes via LangGraph, and returns {explanation, steps, question}.
    """

    def post(self, request):
        input_text = request.data.get("input", "").strip()
        mode = request.data.get("mode", "balanced").strip().lower()
        file_obj = request.FILES.get("file")
        file_type = None

        valid_modes = {"beginner", "balanced", "advanced"}
        if mode not in valid_modes:
            mode = "balanced"

        if file_obj:
            extracted, file_type = extract_file_content(file_obj, file_obj.name)
            if extracted:
                header = f"[Content extracted from uploaded {file_type.upper()} file]\n\n"
                input_text = (
                    header + extracted
                    + (f"\n\nAdditional context: {input_text}" if input_text else "")
                )

        if not input_text:
            return Response(
                {"error": "Please provide a message or upload a file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        initial_state = {
            "input": input_text,
            "mode": mode,
            "conversation_history": [],
            "intent": "learn_topic",
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
        }

        try:
            result = graph.invoke(initial_state)
        except Exception as exc:
            print(f"[BodhAI] Agent pipeline error: {exc}")
            return Response(
                {"error": "AI pipeline failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        explanation = result.get("improved_explanation", "") or result.get("explanation", "")
        steps = result.get("steps", [])
        question = ""
        if result.get("questions") and len(result["questions"]) > 0:
            question = result["questions"][0].get("text", "")
        elif result.get("example"):
            question = result.get("example", "")

        learning_obj = Learning.objects.create(
            input_text=request.data.get("input", "").strip() or f"[{file_type.upper()} file]",
            mode=mode,
            explanation=explanation,
            steps=steps,
            question=question,
            file_type=file_type
        )

        return Response({
            "explanation": explanation,
            "steps": steps,
            "question": question
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# Phase 6 Endpoints
# ─────────────────────────────────────────────────────────────────────────────
class LearningPathView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id", "default")
        paths = LearningPath.objects.filter(user_id=user_id).order_by("-created_at")
        serializer = LearningPathSerializer(paths, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        main_topic = request.data.get("main_topic")
        user_id = request.data.get("user_id", "default")

        if not main_topic:
            return Response({"error": "main_topic is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate Learning Path using Groq
        try:
            llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
            prompt = (
                f"Create a structured learning path for the topic: '{main_topic}'.\n"
                "Return the learning path as a plain list of subtopics in a logical learning progression, from basics to advanced.\n"
                "Each topic should build on the previous knowledge.\n"
                "Do NOT include any extra text. Return ONLY valid JSON in the exact format: "
                '{"topics": ["Topic 1", "Topic 2", "Topic 3", ...]}'
            )
            resp = llm.invoke([
                SystemMessage(content="You are an expert curriculum designer. Return strictly valid JSON."),
                HumanMessage(content=prompt)
            ])
            import json, re
            raw = resp.content
            m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", raw)
            if m: raw = m.group(1)
            parsed = json.loads(raw)
            topics = parsed.get("topics", [])
        except Exception as e:
            print(f"LearningPath gen error: {e}")
            topics = [f"{main_topic} Basics", f"Intermediate {main_topic}", f"Advanced {main_topic}"]

        lp = LearningPath.objects.create(
            user_id=user_id,
            main_topic=main_topic,
            topics=topics
        )
        serializer = LearningPathSerializer(lp)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class TopicProgressView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id", "default")
        progress = TopicProgress.objects.filter(user_id=user_id)
        serializer = TopicProgressSerializer(progress, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Allow frontend to manually update topic progress
        user_id = request.data.get("user_id", "default")
        topic = request.data.get("topic")
        correct = request.data.get("correct", False)

        if not topic:
            return Response({"error": "topic is required"}, status=status.HTTP_400_BAD_REQUEST)

        progress, created = TopicProgress.objects.get_or_create(user_id=user_id, topic=topic)
        progress.attempts += 1
        if correct:
            progress.correct_answers += 1
        
        progress.accuracy = (progress.correct_answers / progress.attempts) * 100
        
        if progress.accuracy < 50:
            progress.difficulty_level = "easy"
        elif progress.accuracy < 80:
            progress.difficulty_level = "medium"
        else:
            progress.difficulty_level = "hard"

        progress.save()
        serializer = TopicProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)

