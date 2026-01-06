from rest_framework import permissions


class IsTeamLeader(permissions.BasePermission):
    """Permission check for team leader users based on JWT token role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has team leader role from JWT token
        user_role = getattr(request.user, 'role', None)
        return user_role == 'TEAM_LEADER'


class IsTeamLeaderOrAssignedUser(permissions.BasePermission):
    """
    Permission check for team leader or the user assigned to the task.
    This is used for operations like changing task status.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = getattr(request.user, 'role', None)
        user_id = request.user.id
        
        # Team leaders always have permission
        if user_role == 'TEAM_LEADER':
            return True
        
        # For object-level permissions, check if user is assigned to the task
        # This will be checked in has_object_permission
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check if user is team leader or assigned to the task."""
        user_role = getattr(request.user, 'role', None)
        user_id = request.user.id
        
        # Team leaders always have permission
        if user_role == 'TEAM_LEADER':
            return True
        
        # Check if user is assigned to the task
        return obj.assigned_to_user_id == user_id

