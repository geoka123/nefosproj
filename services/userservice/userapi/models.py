from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone


class Role(models.TextChoices):
    """User role choices."""
    MEMBER = 'MEMBER', 'Member'
    TEAM_LEADER = 'TEAM_LEADER', 'Team Leader'
    ADMIN = 'ADMIN', 'Admin'


class CustomUserManager(BaseUserManager):
    """Custom user manager where email is the unique identifier."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        # Set is_active=False by default for new users unless explicitly set
        extra_fields.setdefault('is_active', False)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', Role.ADMIN)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    """Custom user model that uses email instead of username."""
    
    email = models.EmailField(unique=True, max_length=255)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER
    )
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email is already required as USERNAME_FIELD
    
    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
    
    def __str__(self):
        return self.email
    
    def save(self, *args, **kwargs):
        """Override save to sync role with is_staff for Admin role."""
        # If role is ADMIN, ensure is_staff is True
        if self.role == Role.ADMIN:
            self.is_staff = True
        # If role is not ADMIN but is_staff is True, set role to ADMIN
        elif self.is_staff and self.role != Role.ADMIN:
            self.role = Role.ADMIN
        super().save(*args, **kwargs)
    
    def is_admin(self):
        """Check if user is an admin."""
        return self.role == Role.ADMIN
    
    def is_team_leader(self):
        """Check if user is a team leader."""
        return self.role == Role.TEAM_LEADER
    
    def is_member(self):
        """Check if user is a member."""
        return self.role == Role.MEMBER
    
    def has_perm(self, perm, obj=None):
        """Does the user have a specific permission?"""
        return self.is_superuser or self.is_admin()
    
    def has_module_perms(self, app_label):
        """Does the user have permissions to view the app `app_label`?"""
        return self.is_superuser or self.is_admin()
