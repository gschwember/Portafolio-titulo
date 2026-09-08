from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from billing.access import TENANT_ADMIN_ROLES, accessible_condominium_ids

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

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        payload = AuthResponseSerializer.build_for_user(serializer.validated_data['user'])
        return Response(payload, status=status.HTTP_200_OK)


class RefreshTokenAPIView(TokenRefreshView):
    permission_classes = (permissions.AllowAny,)


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
