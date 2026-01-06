from rest_framework import authentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
import jwt


class JWTAuthenticationFromUserService(authentication.BaseAuthentication):
    """
    Custom JWT authentication that verifies tokens from userservice.
    Since taskservice doesn't have User model, we only verify the token
    and extract user information from it.
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # Get signing key - use the same as userservice
            # Try JWT_SECRET_KEY first, then fall back to SECRET_KEY
            signing_key = settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY)
            algorithm = settings.SIMPLE_JWT.get('ALGORITHM', 'HS256')
            
            # Decode and validate token
            decoded_token = jwt.decode(
                token,
                key=signing_key,
                algorithms=[algorithm],
                options={"verify_signature": True}
            )
            
            # Create a simple user-like object with user_id and role
            class TokenUser:
                def __init__(self, user_id, role=None):
                    self.id = user_id
                    self.user_id = user_id
                    self.role = role
                    self.is_authenticated = True
            
            user_id = decoded_token.get('user_id')
            if not user_id:
                return None
            
            # Extract role from token (added by userservice)
            role = decoded_token.get('role')
            
            return (TokenUser(user_id, role), token)
            
        except (jwt.DecodeError, jwt.InvalidTokenError, jwt.ExpiredSignatureError, jwt.InvalidSignatureError) as e:
            return None
    
    def authenticate_header(self, request):
        return 'Bearer'

