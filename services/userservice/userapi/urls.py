from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import *

app_name = 'userapi'

urlpatterns = [
    path('signup/', UserRegistrationView.as_view(), name='signup'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', get_current_user, name='current_user'),
    path('users/<int:user_id>/role/', update_user_role, name='update_user_role'),
    path('users/<int:user_id>/activate/', activate_deactivate_member, name='activate_member'),
    path('users/<int:user_id>/delete/', delete_user, name='delete_user'),
    path('users/', get_all_users, name='get_all_users'),
    path('users/by-ids/', get_users_by_ids, name='get_users_by_ids'),
]

