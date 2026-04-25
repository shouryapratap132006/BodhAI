from django.urls import path
from .views import (
    ChatView,
    ConversationListView,
    ConversationDetailView,
    HistoryView,
    HistoryDetailView,
    LearnView,
    LearningPathView,
    TopicProgressView,
)

urlpatterns = [
    # Phase 3
    path("chat/",                       ChatView.as_view(),             name="chat"),
    path("conversations/",              ConversationListView.as_view(), name="conversations"),
    path("conversations/<int:conv_id>/", ConversationDetailView.as_view(), name="conversation-detail"),

    # Phase 2
    path("history/",                    HistoryView.as_view(),          name="history"),
    path("history/<int:history_id>/",   HistoryDetailView.as_view(),    name="history-detail"),
    path("learn/",                      LearnView.as_view(),            name="learn"),

    # Phase 6
    path("learning-path/",              LearningPathView.as_view(),     name="learning-path"),
    path("topic-progress/",             TopicProgressView.as_view(),    name="topic-progress"),
]
