from rest_framework import permissions
from .models import Role


class IsAdmin(permissions.BasePermission):
    """Permission check for admin users."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin() or request.user.is_superuser)
        )


class IsTeamLeaderOrAdmin(permissions.BasePermission):
    """Permission check for team leader or admin users."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_team_leader() or 
             request.user.is_admin() or 
             request.user.is_superuser)
        )

