from rest_framework import serializers
from .models import *


class TeamCreateSerializer(serializers.ModelSerializer):
    """Serializer for Team model."""
    
    class Meta:
        model = Team
        fields = ('name', 'description', 'creation_date')
        read_only_fields = ('creation_date',)

class TeamUserCreateSerializer(serializers.ModelSerializer):
    """Serializer for TeamUser model."""
    
    class Meta:
        model = TeamUser
        fields = ('team', 'user_id', 'user_full_name', 'joined_date', 'leads_team')
        read_only_fields = ('joined_date',)


class TeamUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Team model."""
    
    class Meta:
        model = Team
        fields = ('name', 'description')


class TeamListSerializer(serializers.ModelSerializer):
    """Serializer for listing teams with member count and leader info."""
    
    number_of_members = serializers.SerializerMethodField()
    leader_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ('id', 'name', 'number_of_members', 'leader_full_name')
    
    def get_number_of_members(self, obj):
        """Get the count of members in the team."""
        return obj.members.count()
    
    def get_leader_full_name(self, obj):
        """Get the full name of the team leader."""
        leader = obj.members.filter(leads_team=True).first()
        return leader.user_full_name if leader else None


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for team members in team details."""
    
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamUser
        fields = ('user_id', 'user_full_name', 'role')
    
    def get_role(self, obj):
        """Get the role of the member (Team Leader or Member)."""
        return 'Team Leader' if obj.leads_team else 'Member'


class TeamDetailsSerializer(serializers.ModelSerializer):
    """Serializer for team details with nested member list."""
    
    members = TeamMemberSerializer(many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = ('id', 'name', 'description', 'members')
