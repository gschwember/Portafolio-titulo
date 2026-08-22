from django.urls import path

from .views import UserListCreateAPIView, UserRetrieveUpdateDestroyAPIView

urlpatterns = [
    path('', UserListCreateAPIView.as_view(), name='users-list-create'),
    path('<int:pk>', UserRetrieveUpdateDestroyAPIView.as_view(), name='users-detail'),
]
