from rest_framework import generics, permissions

from users.models import User

from .models import CommonSpace, Reservation
from .permissions import CanManageReservations
from .serializers import CommonSpaceSerializer, ReservationSerializer


class CommonSpaceListAPIView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = CommonSpaceSerializer
    queryset = CommonSpace.objects.filter(is_active=True).order_by('name')


class ReservationListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = (CanManageReservations,)
    serializer_class = ReservationSerializer

    def get_queryset(self):
        queryset = Reservation.objects.select_related('common_space', 'requester').all()

        if self.request.user.role == User.Role.RESIDENTE:
            return queryset.filter(requester=self.request.user)

        return queryset


class ReservationRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (CanManageReservations,)
    serializer_class = ReservationSerializer

    def get_queryset(self):
        queryset = Reservation.objects.select_related('common_space', 'requester').all()

        if self.request.user.role == User.Role.RESIDENTE:
            return queryset.filter(requester=self.request.user)

        return queryset
