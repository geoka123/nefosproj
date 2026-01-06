from rest_framework import serializers
from .models import Task, Comment, TaskFile, CommentFile
from bson.objectid import ObjectId


class TaskSerializer(serializers.Serializer):
    """Serializer for Task model."""
    id = serializers.SerializerMethodField()
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    status = serializers.ChoiceField(choices=['TODO', 'IN_PROGRESS', 'DONE'], default='TODO')
    priority = serializers.ChoiceField(choices=['LOW', 'MEDIUM', 'HIGH'], default='MEDIUM')
    due_date = serializers.DateTimeField()
    created_by_user_id = serializers.IntegerField(read_only=True)
    assigned_to_user_id = serializers.IntegerField()
    team_id = serializers.IntegerField()
    created_at = serializers.DateTimeField(read_only=True)
    
    def get_id(self, obj):
        """Convert ObjectId to string."""
        if hasattr(obj, 'id'):
            return str(obj.id)
        return None
    
    def create(self, validated_data):
        """Create a new Task."""
        validated_data['created_by_user_id'] = self.context['request'].user.id
        task = Task(**validated_data)
        task.save()
        return task
    
    def update(self, instance, validated_data):
        """Update an existing Task."""
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class TaskListSerializer(serializers.Serializer):
    """Serializer for listing tasks (simplified)."""
    id = serializers.SerializerMethodField()
    title = serializers.CharField()
    description = serializers.CharField()
    status = serializers.CharField()
    priority = serializers.CharField()
    due_date = serializers.DateTimeField()
    assigned_to_user_id = serializers.IntegerField()
    team_id = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    
    def get_id(self, obj):
        """Convert ObjectId to string."""
        if hasattr(obj, 'id'):
            return str(obj.id)
        return None


class CommentSerializer(serializers.Serializer):
    """Serializer for Comment model."""
    id = serializers.SerializerMethodField()
    text = serializers.CharField()
    task_id = serializers.SerializerMethodField()
    created_by_user_id = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    def get_id(self, obj):
        """Convert ObjectId to string."""
        if hasattr(obj, 'id'):
            return str(obj.id)
        return None
    
    def get_task_id(self, obj):
        """Convert ObjectId to string."""
        if hasattr(obj, 'task_id'):
            return str(obj.task_id)
        return None
    
    def create(self, validated_data):
        """Create a new Comment."""
        # Get task_id from context (passed from view)
        task_id = self.context.get('task_id')
        if not task_id:
            # Fallback: try to get from validated_data
            task_id = validated_data.pop('task_id', None)
        
        if not task_id:
            raise serializers.ValidationError({'task_id': 'Task ID is required'})
        
        validated_data['task_id'] = ObjectId(task_id)
        validated_data['created_by_user_id'] = self.context['request'].user.id
        comment = Comment(**validated_data)
        comment.save()
        return comment


class TaskFileSerializer(serializers.Serializer):
    """Serializer for TaskFile model."""
    id = serializers.SerializerMethodField()
    file = serializers.CharField()
    task_id = serializers.SerializerMethodField()
    uploaded_by_user_id = serializers.IntegerField(read_only=True)
    uploaded_at = serializers.DateTimeField(read_only=True)
    
    def get_id(self, obj):
        """Convert ObjectId to string."""
        if hasattr(obj, 'id'):
            return str(obj.id)
        return None
    
    def get_task_id(self, obj):
        """Convert ObjectId to string."""
        if hasattr(obj, 'task_id'):
            return str(obj.task_id)
        return None
    
    def create(self, validated_data):
        """Create a new TaskFile."""
        task_id = validated_data.pop('task_id')
        validated_data['task_id'] = ObjectId(task_id)
        validated_data['uploaded_by_user_id'] = self.context['request'].user.id
        task_file = TaskFile(**validated_data)
        task_file.save()
        return task_file


class CommentFileSerializer(serializers.Serializer):
    """Serializer for CommentFile model."""
    id = serializers.SerializerMethodField()
    file = serializers.CharField()
    comment_id = serializers.SerializerMethodField()
    uploaded_by_user_id = serializers.IntegerField(read_only=True)
    uploaded_at = serializers.DateTimeField(read_only=True)
    
    def get_id(self, obj):
        """Convert ObjectId to string."""
        if hasattr(obj, 'id'):
            return str(obj.id)
        return None
    
    def get_comment_id(self, obj):
        """Convert ObjectId to string."""
        if hasattr(obj, 'comment_id'):
            return str(obj.comment_id)
        return None
    
    def create(self, validated_data):
        """Create a new CommentFile."""
        comment_id = validated_data.pop('comment_id')
        validated_data['comment_id'] = ObjectId(comment_id)
        validated_data['uploaded_by_user_id'] = self.context['request'].user.id
        comment_file = CommentFile(**validated_data)
        comment_file.save()
        return comment_file


class TaskDetailSerializer(serializers.Serializer):
    """Serializer for detailed task view including comments and files."""
    id = serializers.SerializerMethodField()
    title = serializers.CharField()
    description = serializers.CharField()
    status = serializers.CharField()
    priority = serializers.CharField()
    due_date = serializers.DateTimeField()
    created_by_user_id = serializers.IntegerField()
    assigned_to_user_id = serializers.IntegerField()
    team_id = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    comments = CommentSerializer(many=True, read_only=True)
    files = TaskFileSerializer(many=True, read_only=True)
    
    def get_id(self, obj):
        """Convert ObjectId to string."""
        if hasattr(obj, 'id'):
            return str(obj.id)
        return None

