from rest_framework import generics

from .models import CommonSpace, Reservation
from .permissions import CanManageReservations
from .serializers import CommonSpaceSerializer, ReservationSerializer


class CommonSpaceListAPIView(generics.ListAPIView):
    permission_classes = (CanManageReservations,)
    serializer_class = CommonSpaceSerializer
    queryset = CommonSpace.objects.filter(is_active=True).order_by('name')


class ReservationListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = (CanManageReservations,)
    serializer_class = ReservationSerializer

    def get_queryset(self):
        return Reservation.objects.select_related('common_space', 'requester').all()


class ReservationRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (CanManageReservations,)
    serializer_class = ReservationSerializer

    def get_queryset(self):
        return Reservation.objects.select_related('common_space', 'requester').all()
