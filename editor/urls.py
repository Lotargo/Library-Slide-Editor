from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),

    # Workspace API
    path('api/workspaces', views.api_workspaces, name='api_workspaces'),
    path('api/workspaces/<str:workspace_id>', views.api_workspace_detail, name='api_workspace_detail'),
    path('api/workspaces/<str:workspace_id>/pages', views.api_workspace_pages, name='api_workspace_pages'),

    # Page API
    path('api/pages/<str:page_id>', views.api_page_detail, name='api_page_detail'),

    # Fonts API
    path('api/fonts', views.api_fonts, name='api_fonts'),

    # File Upload API
    path('api/upload', views.api_upload_file, name='api_upload_file'),
]
