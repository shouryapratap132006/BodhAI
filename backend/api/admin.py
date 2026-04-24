from django.contrib import admin
from .models import LearningHistory


@admin.register(LearningHistory)
class LearningHistoryAdmin(admin.ModelAdmin):
    list_display  = ("id", "mode", "file_type", "short_input", "created_at")
    list_filter   = ("mode", "file_type")
    search_fields = ("input_text", "explanation")
    ordering      = ("-created_at",)
    readonly_fields = ("created_at",)

    def short_input(self, obj):
        return obj.input_text[:60] + ("…" if len(obj.input_text) > 60 else "")
    short_input.short_description = "Input"
