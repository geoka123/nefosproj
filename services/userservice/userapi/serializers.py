from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label='Confirm Password'
    )

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        """Create and return a new user with is_active=False."""
        validated_data.pop('password2')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=False,  # Explicitly set to False for new registrations
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'role_display', 'date_joined', 'is_active')
        read_only_fields = ('id', 'date_joined', 'is_active')


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user role (admin only)."""
    
    class Meta:
        model = User
        fields = ('role',)

class UserActivateMemberSerializer(serializers.ModelSerializer):
    """Serializer for activating a member."""
    
    class Meta:
        model = User
        fields = ('is_active',)

