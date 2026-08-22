from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from .permissions import IsAdminOrSuperAdmin
from .models import User
from .serializers import (
    AuthResponseSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


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


class UserListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = (IsAdminOrSuperAdmin,)
    queryset = User.objects.all().order_by('id')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAdminOrSuperAdmin,)
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
