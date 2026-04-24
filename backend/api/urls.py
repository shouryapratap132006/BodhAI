from django.urls import path
from .views import HistoryView, LearnView

urlpatterns = [
    path('history/', HistoryView.as_view(), name='history'),
    path('learn/', LearnView.as_view(), name='learn'),
]
