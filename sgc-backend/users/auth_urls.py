from django.urls import path
from .views import LoginAPIView, RefreshTokenAPIView, RegisterAPIView

urlpatterns = [
    path('register', RegisterAPIView.as_view(), name='auth-register'),
    path('login', LoginAPIView.as_view(), name='auth-login'),
    path('token/refresh', RefreshTokenAPIView.as_view(), name='auth-refresh'),
]
