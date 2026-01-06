from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Team, TeamUser
from .serializers import *
from .authentication import JWTAuthenticationFromUserService
from .permissions import *


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_teams(request):
    """
    List teams based on user role.
    
    - Admin: Returns all teams
    - Member/Team Leader: Returns only teams the user leads or is part of
    
    Returns teams with: name, description, number_of_members, leader_full_name
    """
    user_role = getattr(request.user, 'role', None)
    user_id = request.user.id
    
    if user_role == 'ADMIN':
        # Admin sees all teams
        teams = Team.objects.all()
    else:
        # Members and Team Leaders see only teams they're part of
        # Get team IDs where user is a member
        user_team_ids = TeamUser.objects.filter(user_id=user_id).values_list('team_id', flat=True)
        teams = Team.objects.filter(id__in=user_team_ids)
    
    serializer = TeamListSerializer(teams, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def team_details(request, pk):
    """
    Get details of a team.
    
    Requires team id.
    """
    team = Team.objects.get(id=pk)
    serializer = TeamDetailsSerializer(team)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def create_team(request):
    """
    Create a new team(Admin only).
    
    Requires team name & description.
    Requires also user full name and leader_id.

    Returns 201 if ok, else 400/500.
    """
    data = request.data
    team_name = data['name']
    team_description = data['description']
    team_leader_id = data.get('leader_id', request.user.id)  # Use provided leader_id or fallback to authenticated user
    team_leader_full_name = data['full_name']

    team_serializer = TeamCreateSerializer(data={
        'name': team_name,
        'description': team_description,
    })
    if team_serializer.is_valid():
        team = team_serializer.save()
    else:
        return Response(team_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    team_user_serializer = TeamUserCreateSerializer(data={
        'team': team.id,
        'user_id': team_leader_id,
        'user_full_name': team_leader_full_name,
        'leads_team': True,
    })
    if team_user_serializer.is_valid():
        team_user_serializer.save()
    else:
        return Response(team_user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated, IsTeamLeaderOrAdmin])
def update_team_info(request, pk):
    """
    Update a team(Admin or Team Leader).
    
    Requires team name & description.
    Optional: leader_id and full_name to change the team leader.
    """
    data = request.data
    team = Team.objects.get(id=pk)
    team_serializer = TeamUpdateSerializer(team, data=data)
    if team_serializer.is_valid():
        team_serializer.save()
    else:
        return Response(team_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle leader change if provided
    leader_id = data.get('leader_id')
    leader_full_name = data.get('full_name')
    
    if leader_id and leader_full_name:
        # Find current leader and set leads_team=False
        current_leader = team.members.filter(leads_team=True).first()
        if current_leader:
            current_leader.leads_team = False
            current_leader.save()
        
        # Find or create the new leader TeamUser entry
        new_leader, created = TeamUser.objects.get_or_create(
            team=team,
            user_id=leader_id,
            defaults={
                'user_full_name': leader_full_name,
                'leads_team': True,
            }
        )
        
        # If the TeamUser already exists, update it to be the leader
        if not created:
            new_leader.leads_team = True
            new_leader.user_full_name = leader_full_name  # Update full name in case it changed
            new_leader.save()
    
    return Response(status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated, IsTeamLeader])
def add_member_to_team(request, pk):
    """
    Add a member to a team(Team leader only).
    
    Requires member id & member full name.
    """
    data = request.data
    member_id = data['member_id']
    member_full_name = data['member_full_name']
    team = Team.objects.get(id=pk)
    team_user_serializer = TeamUserCreateSerializer(data={
        'team': team.id,
        'user_id': member_id,
        'user_full_name': member_full_name,
        'leads_team': False,
    })
    if team_user_serializer.is_valid():
        team_user_serializer.save()
    else:
        return Response(team_user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated, IsTeamLeader])
def remove_member_from_team(request, pk):
    """
    Remove a member from a team(Team leader only).
    
    Requires member id.
    """
    data = request.data
    member_id = data['member_id']
    team = Team.objects.get(id=pk)
    team_user = TeamUser.objects.get(team=team, user_id=member_id)
    team_user.delete()
    return Response(status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def delete_team(request, pk):
    """
    Delete a team(Admin only).
    
    Requires team id.
    """
    team = Team.objects.get(id=pk)
    team.delete()
    return Response(status=status.HTTP_200_OK)