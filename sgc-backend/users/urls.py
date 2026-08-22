from django.urls import path

from .views import (
    LoginAPIView,
    RefreshTokenAPIView,
    RegisterAPIView,
    UserListCreateAPIView,
    UserRetrieveUpdateDestroyAPIView,
)

urlpatterns = [
    path('register', RegisterAPIView.as_view(), name='auth-register'),
    path('login', LoginAPIView.as_view(), name='auth-login'),
    path('token/refresh', RefreshTokenAPIView.as_view(), name='auth-refresh'),

    path('users', UserListCreateAPIView.as_view(), name='users-list-create'),
    path('users/<int:pk>', UserRetrieveUpdateDestroyAPIView.as_view(), name='users-detail'),
]
