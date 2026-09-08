from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.exceptions import UnsupportedMediaType
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from billing.access import TENANT_ADMIN_ROLES, accessible_condominium_ids

from .cookies import clear_refresh_cookie, set_refresh_cookie
from .permissions import IsAdminOrSuperAdmin, IsSuperAdmin
from .models import User
from .serializers import (
    AuthResponseSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from .throttles import LoginRateThrottle


def enforce_json_request(request):
    if request.content_type != JSONParser.media_type:
        raise UnsupportedMediaType(request.content_type)


class TenantUserQuerysetMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == User.Role.SUPERADMIN:
            return queryset

        condominium_ids = accessible_condominium_ids(
            self.request.user,
            roles=TENANT_ADMIN_ROLES,
        )
        return queryset.filter(
            condominium_memberships__condominium_id__in=condominium_ids,
            condominium_memberships__is_active=True,
        ).distinct()


class RegisterAPIView(APIView):
    permission_classes = (permissions.AllowAny,)
    parser_classes = (JSONParser,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'detail': 'Registro recibido. Tu cuenta quedo pendiente de aprobacion por administracion.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    permission_classes = (permissions.AllowAny,)
    parser_classes = (JSONParser,)
    throttle_classes = (LoginRateThrottle,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        payload, refresh_token = AuthResponseSerializer.build_for_user(serializer.validated_data['user'])
        response = Response(payload, status=status.HTTP_200_OK)
        set_refresh_cookie(response, refresh_token)
        return response


class RefreshTokenAPIView(APIView):
    permission_classes = (permissions.AllowAny,)
    parser_classes = (JSONParser,)

    def post(self, request):
        enforce_json_request(request)
        raw_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)

        try:
            refresh_token = RefreshToken(raw_token) if raw_token else None
            user_id = refresh_token.get(api_settings.USER_ID_CLAIM) if refresh_token else None
            user = User.objects.filter(id=user_id, is_active=True).first() if user_id else None
            if not refresh_token or not user:
                raise TokenError('Token de renovacion invalido.')
        except (TokenError, ValueError, TypeError):
            response = Response(
                {'detail': 'La sesion no es valida o ha expirado.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            clear_refresh_cookie(response)
            return response

        return Response(
            {
                'user': UserSerializer(user).data,
                'access': str(refresh_token.access_token),
            },
            status=status.HTTP_200_OK,
        )


class LogoutAPIView(APIView):
    permission_classes = (permissions.AllowAny,)
    parser_classes = (JSONParser,)

    def post(self, request):
        enforce_json_request(request)
        raw_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if raw_token:
            try:
                RefreshToken(raw_token).blacklist()
            except (TokenError, ValueError, TypeError):
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response


class UserListCreateAPIView(TenantUserQuerysetMixin, generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('id')

    def get_permissions(self):
        permission_classes = (IsSuperAdmin,) if self.request.method == 'POST' else (IsAdminOrSuperAdmin,)
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserRetrieveUpdateDestroyAPIView(TenantUserQuerysetMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()

    def get_permissions(self):
        permission_classes = (
            (IsAdminOrSuperAdmin,)
            if self.request.method == 'GET'
            else (IsSuperAdmin,)
        )
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
