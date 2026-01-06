"""
Django management command to initialize MongoDB collections for MongoEngine models.

Since MongoEngine doesn't use Django migrations, this command ensures that
collections are created by importing the models (which registers them with MongoEngine).
"""
from django.core.management.base import BaseCommand
from taskapi.models import Task, Comment, TaskFile, CommentFile


class Command(BaseCommand):
    help = 'Initialize MongoDB collections for MongoEngine models'

    def handle(self, *args, **options):
        """Create collections by ensuring models are registered."""
        self.stdout.write(self.style.SUCCESS('Initializing MongoDB collections...'))
        
        # Import models to register them with MongoEngine
        # Collections will be created when first document is saved
        # But we can ensure they exist by creating indexes
        try:
            # Ensure collections exist by creating indexes
            Task.ensure_indexes()
            Comment.ensure_indexes()
            TaskFile.ensure_indexes()
            CommentFile.ensure_indexes()
            
            self.stdout.write(self.style.SUCCESS('✓ Task collection initialized'))
            self.stdout.write(self.style.SUCCESS('✓ Comment collection initialized'))
            self.stdout.write(self.style.SUCCESS('✓ TaskFile collection initialized'))
            self.stdout.write(self.style.SUCCESS('✓ CommentFile collection initialized'))
            
            self.stdout.write(self.style.SUCCESS('\nAll collections initialized successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error initializing collections: {e}'))
            raise

