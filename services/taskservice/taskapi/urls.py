from django.urls import path
from . import views

urlpatterns = [
    # Task CRUD operations
    path('tasks/', views.list_tasks, name='list_tasks'),
    path('tasks/create/', views.create_task, name='create_task'),
    path('tasks/<str:task_id>/', views.task_details, name='task_details'),
    path('tasks/<str:task_id>/update/', views.update_task, name='update_task'),
    path('tasks/<str:task_id>/delete/', views.delete_task, name='delete_task'),
    path('tasks/<str:task_id>/status/', views.update_task_status, name='update_task_status'),
    
    # Comments
    path('tasks/<str:task_id>/comments/', views.list_comments, name='list_comments'),
    path('tasks/<str:task_id>/comments/add/', views.add_comment, name='add_comment'),
    path('tasks/<str:task_id>/comments/<str:comment_id>/delete/', views.delete_comment, name='delete_comment'),
    path('tasks/<str:task_id>/comments/<str:comment_id>/files/attach/', views.attach_comment_file, name='attach_comment_file'),
    path('tasks/<str:task_id>/comments/<str:comment_id>/files/<str:file_id>/', views.download_comment_file, name='download_comment_file'),
    path('tasks/<str:task_id>/comments/<str:comment_id>/files/<str:file_id>/delete/', views.delete_comment_file, name='delete_comment_file'),
    
    # Files
    path('tasks/<str:task_id>/files/', views.list_files, name='list_files'),
    path('tasks/<str:task_id>/files/attach/', views.attach_file, name='attach_file'),
    path('tasks/<str:task_id>/files/<str:file_id>/', views.download_file, name='download_file'),
    path('tasks/<str:task_id>/files/<str:file_id>/delete/', views.delete_file, name='delete_file'),
]

