from django.db import models


class Conversation(models.Model):
    """
    A conversation session — groups all messages in one chat thread.
    Each Conversation maps to one "chat" in the sidebar.
    """
    title = models.CharField(max_length=200, blank=True)   # auto-filled from first message
    mode = models.CharField(max_length=20, default="balanced")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.id}] {self.title or 'Untitled'}"


class Message(models.Model):
    """
    A single turn in a conversation.
    Stores both the user input and the full structured AI response.
    """
    INTENT_CHOICES = [
        ("learn_topic",    "Learn Topic"),
        ("solve_question", "Solve Question"),
        ("quiz_me",        "Quiz Me"),
        ("homework",       "Homework"),
        ("revise",         "Revise"),
        ("explain_again",  "Explain Again"),
    ]
    RESPONSE_TYPE_CHOICES = [
        ("learn",    "Learn"),
        ("solve",    "Solve"),
        ("quiz",     "Quiz"),
        ("homework", "Homework"),
        ("revise",   "Revise"),
    ]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )

    # User side
    user_input   = models.TextField()
    file_type    = models.CharField(max_length=50, blank=True, null=True)

    # Classification
    intent        = models.CharField(max_length=30, choices=INTENT_CHOICES, default="learn_topic")
    response_type = models.CharField(max_length=20, choices=RESPONSE_TYPE_CHOICES, default="learn")
    mode          = models.CharField(max_length=20, default="balanced")

    # Core response fields
    explanation          = models.TextField(blank=True)
    steps                = models.JSONField(default=list)
    hint                 = models.TextField(blank=True)
    solution             = models.TextField(blank=True)
    example              = models.TextField(blank=True)
    questions            = models.JSONField(default=list)
    student_attempt      = models.TextField(blank=True)
    evaluation           = models.JSONField(default=dict)
    improved_explanation = models.TextField(blank=True)
    resources            = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.conversation_id}] {self.intent}: {self.user_input[:50]}"


# Keep LearningHistory for backwards compatibility (Phase 1/2 data)
class LearningHistory(models.Model):
    MODE_CHOICES = [
        ('beginner', 'Beginner'),
        ('balanced', 'Balanced'),
        ('advanced', 'Advanced'),
    ]
    input_text  = models.TextField()
    mode        = models.CharField(max_length=20, choices=MODE_CHOICES, default='balanced')
    explanation = models.TextField()
    steps       = models.JSONField(default=list)
    question    = models.TextField()
    file_type   = models.CharField(max_length=50, blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.mode}] {self.input_text[:50]}"
