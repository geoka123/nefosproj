from datetime import datetime
from mongoengine import Document, StringField, IntField, DateTimeField, ObjectIdField

"""
MongoDB Document Models using MongoEngine
MongoEngine provides Django-like ORM for MongoDB
"""


class Task(Document):
    """
    Task model representing a task document in MongoDB.
    
    Required fields:
    - title: Task title
    - description: Task description
    - created_by_user_id: ID of user who created the task (from userservice)
    - assigned_to_user_id: ID of user to whom the task is assigned (from userservice)
    - status: Task status (TODO, IN_PROGRESS, DONE)
    - due_date: Completion deadline (datetime)
    - priority: Task priority (LOW, MEDIUM, HIGH)
    - created_at: Creation date (datetime)
    - team_id: ID of the team this task belongs to (from teamservice)
    """
    
    title = StringField(required=True, max_length=255)
    description = StringField(required=True)
    created_by_user_id = IntField(required=True)
    assigned_to_user_id = IntField(required=True)
    status = StringField(required=True, choices=['TODO', 'IN_PROGRESS', 'DONE'], default='TODO')
    due_date = DateTimeField(required=True)
    priority = StringField(required=True, choices=['LOW', 'MEDIUM', 'HIGH'], default='MEDIUM')
    team_id = IntField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'tasks',
        'indexes': ['team_id', 'created_by_user_id', 'assigned_to_user_id', 'status']
    }
    
    def __str__(self):
        return f"Task: {self.title} ({self.status})"


class Comment(Document):
    """
    Comment model representing a comment document in MongoDB.
    
    Required fields:
    - text: Comment text content
    - created_at: Date when the comment was written (datetime)
    - created_by_user_id: ID of user who wrote the comment (from userservice)
    - task_id: ID of the task this comment belongs to (ObjectId of Task)
    """
    
    text = StringField(required=True)
    created_by_user_id = IntField(required=True)
    task_id = ObjectIdField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'comments',
        'indexes': ['task_id', 'created_by_user_id']
    }
    
    def __str__(self):
        return f"Comment by user {self.created_by_user_id} on task {self.task_id}"


class TaskFile(Document):
    """
    TaskFile model representing a file attached to a task in MongoDB.
    
    Fields:
    - file: File path or reference (string)
    - task_id: ID of the task this file belongs to (ObjectId of Task)
    - uploaded_at: Upload date (datetime)
    - uploaded_by_user_id: ID of user who uploaded the file (from userservice)
    """
    
    file = StringField(required=True)
    task_id = ObjectIdField(required=True)
    uploaded_by_user_id = IntField(required=True)
    uploaded_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'taskfiles',
        'indexes': ['task_id', 'uploaded_by_user_id']
    }
    
    def __str__(self):
        return f"TaskFile: {self.file} for task {self.task_id}"


class CommentFile(Document):
    """
    CommentFile model representing a file attached to a comment in MongoDB.
    
    Fields:
    - file: File path or reference (string)
    - comment_id: ID of the comment this file belongs to (ObjectId of Comment)
    - uploaded_at: Upload date (datetime)
    - uploaded_by_user_id: ID of user who uploaded the file (from userservice)
    """
    
    file = StringField(required=True)
    comment_id = ObjectIdField(required=True)
    uploaded_by_user_id = IntField(required=True)
    uploaded_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'commentfiles',
        'indexes': ['comment_id', 'uploaded_by_user_id']
    }
    
    def __str__(self):
        return f"CommentFile: {self.file} for comment {self.comment_id}"
