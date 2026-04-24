from django.db import models

class LearningHistory(models.Model):
    MODE_CHOICES = [
        ('beginner', 'Beginner'),
        ('balanced', 'Balanced'),
        ('advanced', 'Advanced'),
    ]

    input_text = models.TextField()
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='balanced')
    explanation = models.TextField()
    steps = models.JSONField(default=list)
    question = models.TextField()
    file_type = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.mode}] {self.input_text[:50]}"
