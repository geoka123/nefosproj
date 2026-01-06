from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Permission check for admin users based on JWT token role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has admin role from JWT token
        user_role = getattr(request.user, 'role', None)
        return user_role == 'ADMIN'


class IsTeamLeader(permissions.BasePermission):
    """Permission check for team leader users based on JWT token role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has team leader role from JWT token
        user_role = getattr(request.user, 'role', None)
        return user_role == 'TEAM_LEADER'


class IsTeamLeaderOrAdmin(permissions.BasePermission):
    """Permission check for team leader or admin users based on JWT token role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has team leader or admin role from JWT token
        user_role = getattr(request.user, 'role', None)
        return user_role in ('TEAM_LEADER', 'ADMIN')

