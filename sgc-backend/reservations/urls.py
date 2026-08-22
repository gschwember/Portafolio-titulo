from django.urls import path

from .views import CommonSpaceListAPIView, ReservationListCreateAPIView, ReservationRetrieveUpdateDestroyAPIView

urlpatterns = [
    path('', ReservationListCreateAPIView.as_view(), name='reservations-list-create'),
    path('<int:pk>', ReservationRetrieveUpdateDestroyAPIView.as_view(), name='reservations-detail'),
    path('common-spaces/', CommonSpaceListAPIView.as_view(), name='common-spaces-list'),
]
