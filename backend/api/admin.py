from django.contrib import admin
from .models import LearningHistory, Conversation, Message


# ── Conversation ──────────────────────────────────────────────────────────
@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display  = ("id", "title", "mode", "message_count", "created_at", "updated_at")
    list_filter   = ("mode",)
    search_fields = ("title",)
    ordering      = ("-updated_at",)
    readonly_fields = ("created_at", "updated_at")

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = "Messages"


# ── Message ───────────────────────────────────────────────────────────────
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ("id", "conversation", "intent", "response_type", "mode", "short_input", "created_at")
    list_filter   = ("intent", "response_type", "mode")
    search_fields = ("user_input", "explanation")
    ordering      = ("-created_at",)
    readonly_fields = ("created_at",)

    def short_input(self, obj):
        return obj.user_input[:60] + ("…" if len(obj.user_input) > 60 else "")
    short_input.short_description = "User Input"


# ── Legacy ────────────────────────────────────────────────────────────────
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
