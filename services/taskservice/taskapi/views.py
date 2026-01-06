from rest_framework import status, permissions
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.http import FileResponse, Http404
from datetime import datetime
from bson.objectid import ObjectId
import os
import uuid
import mimetypes
from django.conf import settings
from pathlib import Path
from .models import Task, Comment, TaskFile, CommentFile
from .serializers import (
    TaskSerializer, TaskListSerializer, TaskDetailSerializer,
    CommentSerializer, TaskFileSerializer, CommentFileSerializer
)
from .authentication import JWTAuthenticationFromUserService
from .permissions import IsTeamLeader, IsTeamLeaderOrAssignedUser


@api_view(['POST'])
@permission_classes([IsTeamLeader])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_task(request):
    """
    Create a new task with optional file attachments.
    """
    serializer = TaskSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        task = serializer.save()
        
        uploaded_files = []
        if request.FILES:
            media_root = settings.MEDIA_ROOT
            uploads_dir = os.path.join(media_root, 'task_files')
            os.makedirs(uploads_dir, exist_ok=True)
            
            for file_key in request.FILES:
                file_list = request.FILES.getlist(file_key)
                for uploaded_file in file_list:
                    file_ext = os.path.splitext(uploaded_file.name)[1]
                    unique_filename = f"{uuid.uuid4()}{file_ext}"
                    file_path = os.path.join(uploads_dir, unique_filename)
                    
                    with open(file_path, 'wb+') as destination:
                        for chunk in uploaded_file.chunks():
                            destination.write(chunk)
                    
                    relative_path = f"task_files/{unique_filename}"
                    
                    task_file = TaskFile(
                        file=relative_path,
                        task_id=task.id,
                        uploaded_by_user_id=request.user.id
                    )
                    task_file.save()
                    uploaded_files.append(task_file)
        
        response_data = TaskSerializer(task).data
        if uploaded_files:
            response_data['files'] = TaskFileSerializer(uploaded_files, many=True).data
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsTeamLeader])
def delete_task(request, task_id):
    """
    Delete a task (Team Leader only).
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
        task.delete()
        return Response(
            {'message': 'Task deleted successfully'},
            status=status.HTTP_200_OK
        )
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_tasks(request):
    """
    List tasks with filtering options.
    """
    user_id = request.user.id
    user_role = getattr(request.user, 'role', None)
    
    if user_role == 'ADMIN':
        tasks = Task.objects.all()
    elif user_role == 'TEAM_LEADER':
        tasks = Task.objects.all()
    else:
        tasks = Task.objects.filter(assigned_to_user_id=user_id)
    
    team_id = request.query_params.get('team_id')
    if team_id:
        tasks = tasks.filter(team_id=int(team_id))
    
    assigned_to_user_id = request.query_params.get('assigned_to_user_id')
    if assigned_to_user_id:
        tasks = tasks.filter(assigned_to_user_id=int(assigned_to_user_id))
    
    status_filter = request.query_params.get('status')
    if status_filter:
        tasks = tasks.filter(status=status_filter)
    
    due_date_from = request.query_params.get('due_date_from')
    if due_date_from:
        try:
            due_date_from_dt = datetime.fromisoformat(due_date_from.replace('Z', '+00:00'))
            tasks = tasks.filter(due_date__gte=due_date_from_dt)
        except Exception:
            pass
    
    due_date_to = request.query_params.get('due_date_to')
    if due_date_to:
        try:
            due_date_to_dt = datetime.fromisoformat(due_date_to.replace('Z', '+00:00'))
            tasks = tasks.filter(due_date__lte=due_date_to_dt)
        except Exception:
            pass
    
    serializer = TaskListSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def task_details(request, task_id):
    """
    Get detailed task information including comments and files.
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    comments = Comment.objects.filter(task_id=ObjectId(task_id))
    comments_data = []
    for comment in comments:
        comment_data = CommentSerializer(comment).data
        comment_files = CommentFile.objects.filter(comment_id=comment.id)
        comment_data['files'] = CommentFileSerializer(comment_files, many=True).data
        comments_data.append(comment_data)
    
    files = TaskFile.objects.filter(task_id=ObjectId(task_id))
    files_data = TaskFileSerializer(files, many=True).data
    
    task_data = TaskSerializer(task).data
    task_data['comments'] = comments_data
    task_data['files'] = files_data
    
    return Response(task_data, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsTeamLeader])
def update_task(request, task_id):
    """
    Update a task (Team Leader only).
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = TaskSerializer(task, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([IsTeamLeaderOrAssignedUser])
def update_task_status(request, task_id):
    """
    Update task status (Team Leader or assigned user only).
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user_role = getattr(request.user, 'role', None)
    if user_role != 'TEAM_LEADER' and task.assigned_to_user_id != request.user.id:
        return Response(
            {'error': 'You do not have permission to update this task'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    new_status = request.data.get('status')
    if new_status not in ['TODO', 'IN_PROGRESS', 'DONE']:
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    task.status = new_status
    task.save()
    
    serializer = TaskSerializer(task)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_comments(request, task_id):
    """
    List comments for a task.
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    comments = Comment.objects.filter(task_id=ObjectId(task_id))
    comments_data = []
    for comment in comments:
        comment_data = CommentSerializer(comment).data
        comment_files = CommentFile.objects.filter(comment_id=comment.id)
        comment_data['files'] = CommentFileSerializer(comment_files, many=True).data
        comments_data.append(comment_data)
    
    return Response(comments_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def add_comment(request, task_id):
    """
    Add a comment to a task, with optional file attachments.
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    comment_data = request.data.copy()
    
    serializer = CommentSerializer(data=comment_data, context={'request': request, 'task_id': task_id})
    if serializer.is_valid():
        comment = serializer.save()
        comment_id = str(comment.id)
        
        uploaded_files = []
        if request.FILES:
            media_root = settings.MEDIA_ROOT
            uploads_dir = os.path.join(media_root, 'comment_files')
            os.makedirs(uploads_dir, exist_ok=True)
            
            for file_key in request.FILES:
                file_list = request.FILES.getlist(file_key)
                for uploaded_file in file_list:
                    file_ext = os.path.splitext(uploaded_file.name)[1]
                    unique_filename = f"{uuid.uuid4()}{file_ext}"
                    file_path = os.path.join(uploads_dir, unique_filename)
                    
                    with open(file_path, 'wb+') as destination:
                        for chunk in uploaded_file.chunks():
                            destination.write(chunk)
                    
                    relative_path = f"comment_files/{unique_filename}"
                    
                    comment_file = CommentFile(
                        file=relative_path,
                        comment_id=ObjectId(comment_id),
                        uploaded_by_user_id=request.user.id
                    )
                    comment_file.save()
                    uploaded_files.append(comment_file)
        
        response_data = serializer.data
        if uploaded_files:
            files_data = CommentFileSerializer(uploaded_files, many=True).data
            response_data['files'] = files_data
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_comment(request, task_id, comment_id):
    """
    Delete a comment (comment creator only).
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        comment = Comment.objects.get(id=ObjectId(comment_id), task_id=ObjectId(task_id))
    except (Comment.DoesNotExist, Exception):
        return Response(
            {'error': 'Comment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if comment.created_by_user_id != request.user.id:
        return Response(
            {'error': 'You can only delete your own comments'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    comment_files = CommentFile.objects.filter(comment_id=ObjectId(comment_id))
    for comment_file in comment_files:
        file_path = os.path.join(settings.MEDIA_ROOT, comment_file.file)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
        comment_file.delete()
    
    comment.delete()
    
    return Response(
        {'message': 'Comment deleted successfully'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def attach_comment_file(request, task_id, comment_id):
    """
    Attach a file to a comment (comment creator only).
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        comment = Comment.objects.get(id=ObjectId(comment_id), task_id=ObjectId(task_id))
    except (Comment.DoesNotExist, Exception):
        return Response(
            {'error': 'Comment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.user.id != comment.created_by_user_id:
        return Response(
            {'error': 'You do not have permission to attach files to this comment'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    uploaded_files = []
    if request.FILES:
        media_root = settings.MEDIA_ROOT
        uploads_dir = os.path.join(media_root, 'comment_files')
        os.makedirs(uploads_dir, exist_ok=True)
        
        for file_key in request.FILES:
            file_list = request.FILES.getlist(file_key)
            for uploaded_file in file_list:
                file_ext = os.path.splitext(uploaded_file.name)[1]
                unique_filename = f"{uuid.uuid4()}{file_ext}"
                file_path = os.path.join(uploads_dir, unique_filename)
                
                with open(file_path, 'wb+') as destination:
                    for chunk in uploaded_file.chunks():
                        destination.write(chunk)
                
                relative_path = f"comment_files/{unique_filename}"
                
                comment_file = CommentFile(
                    file=relative_path,
                    comment_id=ObjectId(comment_id),
                    uploaded_by_user_id=request.user.id
                )
                comment_file.save()
                uploaded_files.append(comment_file)
        
        if uploaded_files:
            files_data = CommentFileSerializer(uploaded_files, many=True).data
            return Response(files_data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': 'No files were uploaded'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(
        {'error': 'No files provided'},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def download_comment_file(request, task_id, comment_id, file_id):
    """
    Download or view a file attached to a comment.
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        comment = Comment.objects.get(id=ObjectId(comment_id), task_id=ObjectId(task_id))
    except (Comment.DoesNotExist, Exception):
        return Response(
            {'error': 'Comment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        comment_file = CommentFile.objects.get(id=ObjectId(file_id), comment_id=ObjectId(comment_id))
    except (CommentFile.DoesNotExist, Exception):
        return Response(
            {'error': 'File not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    file_path = os.path.join(settings.MEDIA_ROOT, comment_file.file)
    
    if not os.path.exists(file_path):
        return Response(
            {'error': 'File not found on server'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    download = request.query_params.get('download', 'false').lower() == 'true'
    
    try:
        file_handle = open(file_path, 'rb')
        response = FileResponse(file_handle, content_type='application/octet-stream')
        
        filename = os.path.basename(comment_file.file)
        if download:
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
        else:
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type:
                response['Content-Type'] = content_type
            response['Content-Disposition'] = f'inline; filename="{filename}"'
        
        return response
    except Exception as e:
        return Response(
            {'error': f'Error serving file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_comment_file(request, task_id, comment_id, file_id):
    """
    Delete a file attached to a comment (comment creator only).
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        comment = Comment.objects.get(id=ObjectId(comment_id), task_id=ObjectId(task_id))
    except (Comment.DoesNotExist, Exception):
        return Response(
            {'error': 'Comment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if comment.created_by_user_id != request.user.id:
        return Response(
            {'error': 'You can only delete files from your own comments'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        comment_file = CommentFile.objects.get(id=ObjectId(file_id), comment_id=ObjectId(comment_id))
    except (CommentFile.DoesNotExist, Exception):
        return Response(
            {'error': 'File not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    file_path = os.path.join(settings.MEDIA_ROOT, comment_file.file)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass
    
    comment_file.delete()
    
    return Response(
        {'message': 'File deleted successfully'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_files(request, task_id):
    """
    List files attached to a task.
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    files = TaskFile.objects.filter(task_id=ObjectId(task_id))
    serializer = TaskFileSerializer(files, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsTeamLeader])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def attach_file(request, task_id):
    """
    Attach files to an existing task (Team Leader only).
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    uploaded_files = []
    if request.FILES:
        media_root = settings.MEDIA_ROOT
        uploads_dir = os.path.join(media_root, 'task_files')
        os.makedirs(uploads_dir, exist_ok=True)
        
        for file_key in request.FILES:
            file_list = request.FILES.getlist(file_key)
            for uploaded_file in file_list:
                file_ext = os.path.splitext(uploaded_file.name)[1]
                unique_filename = f"{uuid.uuid4()}{file_ext}"
                file_path = os.path.join(uploads_dir, unique_filename)
                
                with open(file_path, 'wb+') as destination:
                    for chunk in uploaded_file.chunks():
                        destination.write(chunk)
                
                relative_path = f"task_files/{unique_filename}"
                
                task_file = TaskFile(
                    file=relative_path,
                    task_id=ObjectId(task_id),
                    uploaded_by_user_id=request.user.id
                )
                task_file.save()
                uploaded_files.append(task_file)
        
        if uploaded_files:
            files_data = TaskFileSerializer(uploaded_files, many=True).data
            return Response(files_data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': 'No files were uploaded'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(
        {'error': 'No files provided'},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def download_file(request, task_id, file_id):
    """
    Download or view a file attached to a task.
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        task_file = TaskFile.objects.get(id=ObjectId(file_id), task_id=ObjectId(task_id))
    except (TaskFile.DoesNotExist, Exception):
        return Response(
            {'error': 'File not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    file_path = os.path.join(settings.MEDIA_ROOT, task_file.file)
    
    if not os.path.exists(file_path):
        return Response(
            {'error': 'File not found on server'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    download = request.query_params.get('download', 'false').lower() == 'true'
    
    try:
        file_handle = open(file_path, 'rb')
        response = FileResponse(file_handle, content_type='application/octet-stream')
        
        filename = os.path.basename(task_file.file)
        if download:
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
        else:
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type:
                response['Content-Type'] = content_type
            response['Content-Disposition'] = f'inline; filename="{filename}"'
        
        return response
    except Exception as e:
        return Response(
            {'error': f'Error serving file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsTeamLeader])
def delete_file(request, task_id, file_id):
    """
    Delete a file attached to a task (Team Leader only).
    """
    try:
        task = Task.objects.get(id=ObjectId(task_id))
    except (Task.DoesNotExist, Exception):
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        task_file = TaskFile.objects.get(id=ObjectId(file_id), task_id=ObjectId(task_id))
    except (TaskFile.DoesNotExist, Exception):
        return Response(
            {'error': 'File not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    file_path = os.path.join(settings.MEDIA_ROOT, task_file.file)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass
    
    task_file.delete()
    
    return Response(
        {'message': 'File deleted successfully'},
        status=status.HTTP_200_OK
    )
