from django.urls import path
from .views import (
    ChatView,
    ConversationListView,
    ConversationDetailView,
    HistoryView,
    LearnView,
)

urlpatterns = [
    # Phase 3
    path("chat/",                       ChatView.as_view(),             name="chat"),
    path("conversations/",              ConversationListView.as_view(), name="conversations"),
    path("conversations/<int:conv_id>/", ConversationDetailView.as_view(), name="conversation-detail"),

    # Legacy Phase 1/2
    path("history/",                    HistoryView.as_view(),          name="history"),
    path("learn/",                      LearnView.as_view(),            name="learn"),
]
