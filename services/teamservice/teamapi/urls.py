from django.urls import path
from .views import *

app_name = 'teamapi'

urlpatterns = [
    path('teams/', list_teams, name='team-list'),
    path('teams/create', create_team, name='team-create'),
    path('teams/update/<int:pk>', update_team_info, name='team-update'),
    path('teams/add-member/<int:pk>', add_member_to_team, name='add-member'),
    path('teams/remove-member/<int:pk>', remove_member_from_team, name='remove-member'),
    path('teams/delete/<int:pk>', delete_team, name='delete-team'),
    path('teams/<int:pk>/', team_details, name='team-details'),
]

