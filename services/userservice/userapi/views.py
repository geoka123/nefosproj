from re import T
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .serializers import *
from .permissions import IsTeamLeaderOrAdmin
from .models import Role

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer to include user details in response."""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user details to response
        serializer = UserSerializer(self.user)
        data['user'] = serializer.data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that returns user details along with tokens."""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """View for user registration/signup."""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the newly registered user
        token_serializer = CustomTokenObtainPairSerializer()
        token_data = token_serializer.get_token(user)
        refresh_token = str(token_data)
        access_token = str(token_data.access_token)
        
        # Get user data
        user_serializer = UserSerializer(user)
        
        return Response({
            'user': user_serializer.data,
            'tokens': {
                'refresh': refresh_token,
                'access': access_token,
            },
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user details."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([permissions.IsAdminUser])
def update_user_role(request, user_id):
    """Update user role (admin only)."""
    role_to_update = request.data['role']
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    serializer = UserRoleUpdateSerializer(user, data={'role': role_to_update})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([permissions.IsAdminUser])
def activate_deactivate_member(request, user_id):
    """Activate a member.(Admin only)"""
    try:
        user_to_activate = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if user_to_activate.is_active:
        serializer = UserActivateMemberSerializer(user_to_activate, data={'is_active': False})
    else:
        serializer = UserActivateMemberSerializer(user_to_activate, data={'is_active': True})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([permissions.IsAdminUser])
def delete_user(request, user_id):
    """Delete a user.(Admin only)"""
    try:
        user_to_delete = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    user_to_delete.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsTeamLeaderOrAdmin])
def get_all_users(request):
    """Get all users.(Team Leader or Admin only)
    
    - If Admin: returns all users
    - If Team Leader: returns only users with Member role
    """
    # Check if user is admin or team leader
    if request.user.is_admin() or request.user.is_superuser:
        # Admin gets all users
        users = User.objects.all()
    else:
        # Team leader gets only members
        users = User.objects.filter(role=Role.MEMBER)
    
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def get_users_by_ids(request):
    """Get users by their IDs (for display purposes, returns all users regardless of role).
    
    Accepts a list of user IDs in the request body:
    {
        "user_ids": [1, 2, 3]
    }
    
    Returns all users with matching IDs, regardless of the caller's role.
    This is useful for displaying user information in tasks/comments.
    All authenticated users (including members) can access this endpoint.
    """
    user_ids = request.data.get('user_ids', [])
    if not user_ids:
        return Response({'error': 'user_ids list is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    users = User.objects.filter(id__in=user_ids)
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)