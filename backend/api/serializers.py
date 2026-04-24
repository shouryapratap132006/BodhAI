from rest_framework import serializers
from .models import LearningHistory


class LearningHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningHistory
        fields = [
            "id",
            "input_text",
            "mode",
            "explanation",
            "steps",
            "question",
            "file_type",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
