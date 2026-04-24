from rest_framework import serializers
from .models import LearningHistory

class LearningHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningHistory
        fields = '__all__'
