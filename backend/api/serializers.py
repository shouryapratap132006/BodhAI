from rest_framework import serializers
from .models import Learning, Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "user_input",
            "file_type",
            "intent",
            "response_type",
            "mode",
            "explanation",
            "steps",
            "hint",
            "solution",
            "example",
            "questions",
            "student_attempt",
            "evaluation",
            "improved_explanation",
            "resources",
            "lesson_structure",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "title", "mode", "created_at", "updated_at", "messages"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ConversationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for sidebar listing (no messages)."""
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "title", "mode", "created_at", "updated_at", "last_message"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if last:
            return {"intent": last.intent, "user_input": last.user_input[:80]}
        return None


class LearningSerializer(serializers.ModelSerializer):
    class Meta:
        model = Learning
        fields = [
            "id", "input_text", "mode", "explanation",
            "steps", "question", "file_type", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
