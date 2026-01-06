from django.db import models
from django.utils import timezone


class Team(models.Model):
    """Team model for managing teams."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    creation_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'team'
        verbose_name_plural = 'teams'
        ordering = ['-creation_date']
    
    def __str__(self):
        return self.name


class TeamUser(models.Model):
    """Helper table for many-to-many relationship between users and teams."""
    
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user_id = models.IntegerField(help_text="User ID from userservice")
    user_full_name = models.CharField(max_length=255)
    joined_date = models.DateTimeField(default=timezone.now)
    leads_team = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'team user'
        verbose_name_plural = 'team users'
        unique_together = [['team', 'user_id']]  # Prevent duplicate memberships
        ordering = ['-joined_date']
    
    def __str__(self):
        return f"User {self.user_id} in Team {self.team.name}"
