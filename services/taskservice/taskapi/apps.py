from django.apps import AppConfig


class TaskapiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'taskapi'
    
    def ready(self):
        """Import models when app is ready to ensure they're registered with MongoEngine."""
        import taskapi.models  # noqa
