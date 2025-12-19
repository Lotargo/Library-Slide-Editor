from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/sessions', views.api_sessions, name='api_sessions'),
    path('api/sessions/<str:session_id>', views.api_session_detail, name='api_session_detail'),
    path('api/fonts', views.api_fonts, name='api_fonts'),
]
