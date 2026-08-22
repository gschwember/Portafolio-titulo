from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import BillingPeriod, CommonExpense, MeterReading, Unit, Condominium
from users.models import User
from .serializers import MeterReadingSerializer
import calendar
import datetime

from .models import (
    BillingPeriod,
    CommonExpense,
    CommonSpace,
    Condominium,
    Payment,
    PaymentReceipt,
    Reservation,
    ResidentAssignment,
    Unit,
)
from .permissions import IsAdminOrSuperAdmin, IsBackofficeRole
from .serializers import (
    BillingPeriodSerializer,
    CommonExpenseSerializer,
    CommonSpaceSerializer,
    CondominiumSerializer,
    PaymentReceiptSerializer,
    PaymentSerializer,
    ReservationSerializer,
    ResidentAssignmentSerializer,
    UnitSerializer,
)


class CondominiumViewSet(viewsets.ModelViewSet):
    queryset = Condominium.objects.all()
    serializer_class = CondominiumSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrSuperAdmin()]


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.select_related('condominium').all()
    serializer_class = UnitSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrSuperAdmin()]


class ResidentAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ResidentAssignment.objects.select_related('user', 'unit', 'unit__condominium').all()
    serializer_class = ResidentAssignmentSerializer
    permission_classes = (IsAdminOrSuperAdmin,)


class BillingPeriodViewSet(viewsets.ModelViewSet):
    queryset = BillingPeriod.objects.select_related('condominium').all()
    serializer_class = BillingPeriodSerializer
    permission_classes = (IsAdminOrSuperAdmin,)

    def get_queryset(self):
        queryset = super().get_queryset()
        condominium_id = self.request.query_params.get('condominium')
        if condominium_id:
            queryset = queryset.filter(condominium_id=condominium_id)
        return queryset


    @action(detail=True, methods=['post'], url_path='close-period')
    def close_period(self, request, pk=None):
        period = self.get_object()

        if period.status != BillingPeriod.Status.OPEN:
            return Response({'detail': 'Este periodo ya fue cerrado o generado.'}, status=status.HTTP_400_BAD_REQUEST)

        units = Unit.objects.filter(condominium=period.condominium, is_active=True)
        
        PRECIO_POR_CONSUMO = 1200  # $1.200 por unidad de consumo
        GASTO_FIJO_BASE = 50000    # $50.000 base de gastos del edificio

        expenses_created = 0

        for unit in units:
            fixed_amount = GASTO_FIJO_BASE * unit.proration_factor

            readings = MeterReading.objects.filter(
                unit=unit,
                date_recorded__month=period.end_date.month,
                date_recorded__year=period.end_date.year
            )
            
            total_consumption = sum(reading.consumption for reading in readings if reading.consumption)
            variable_amount = total_consumption * PRECIO_POR_CONSUMO

            CommonExpense.objects.create(
                period=period,
                unit=unit,
                fixed_amount=fixed_amount,
                variable_amount=variable_amount,
                status=CommonExpense.Status.PENDING
            )
            expenses_created += 1

        period.status = BillingPeriod.Status.GENERATED
        period.close_date = timezone.localdate()
        period.save()
        
        if period.start_date.month == 12:
            next_month = 1
            next_year = period.start_date.year + 1
        else:
            next_month = period.start_date.month + 1
            next_year = period.start_date.year

        _, last_day = calendar.monthrange(next_year, next_month)
        next_start_date = datetime.date(next_year, next_month, 1)
        next_end_date = datetime.date(next_year, next_month, last_day)

        BillingPeriod.objects.create(
            condominium=period.condominium,
            start_date=next_start_date,
            end_date=next_end_date,
            status=BillingPeriod.Status.OPEN
        )

        return Response({
            'detail': 'Cierre de mes ejecutado exitosamente.',
            'expenses_generated': expenses_created
        }, status=status.HTTP_201_CREATED)


class CommonExpenseViewSet(viewsets.ModelViewSet):
    queryset = CommonExpense.objects.select_related('period', 'period__condominium', 'unit').all()
    serializer_class = CommonExpenseSerializer

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            permission_classes = (IsAdminOrSuperAdmin,)
        else:
            permission_classes = (permissions.IsAuthenticated,)
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == User.Role.RESIDENTE:
            unit_ids = ResidentAssignment.objects.filter(user=user, is_active=True).values_list('unit_id', flat=True)
            queryset = queryset.filter(unit_id__in=unit_ids)

        period_id = self.request.query_params.get('period')
        unit_id = self.request.query_params.get('unit')
        status = self.request.query_params.get('status')

        if period_id:
            queryset = queryset.filter(period_id=period_id)
        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)
        if status:
            queryset = queryset.filter(status=status)

        return queryset


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('period', 'unit').all()
    serializer_class = PaymentSerializer

    def get_permissions(self):
        if self.action in {'update', 'partial_update', 'destroy'}:
            permission_classes = (IsAdminOrSuperAdmin,)
        else:
            permission_classes = (permissions.IsAuthenticated,)
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == User.Role.RESIDENTE:
            unit_ids = ResidentAssignment.objects.filter(user=user, is_active=True).values_list('unit_id', flat=True)
            queryset = queryset.filter(unit_id__in=unit_ids)

        period_id = self.request.query_params.get('period')
        unit_id = self.request.query_params.get('unit')
        status = self.request.query_params.get('status')

        if period_id:
            queryset = queryset.filter(period_id=period_id)
        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)
        if status:
            queryset = queryset.filter(status=status)

        return queryset


class PaymentReceiptViewSet(viewsets.ModelViewSet):
    queryset = PaymentReceipt.objects.select_related('payment', 'payment__unit', 'user').all()
    serializer_class = PaymentReceiptSerializer

    def get_permissions(self):
        if self.action in {'update', 'partial_update', 'destroy'}:
            permission_classes = (IsAdminOrSuperAdmin,)
        else:
            permission_classes = (permissions.IsAuthenticated,)
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == User.Role.RESIDENTE:
            unit_ids = ResidentAssignment.objects.filter(user=user, is_active=True).values_list('unit_id', flat=True)
            queryset = queryset.filter(payment__unit_id__in=unit_ids)

        payment_id = self.request.query_params.get('payment')
        if payment_id:
            queryset = queryset.filter(payment_id=payment_id)

        return queryset


class CommonSpaceViewSet(viewsets.ModelViewSet):
    queryset = CommonSpace.objects.select_related('condominium').all()
    serializer_class = CommonSpaceSerializer

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            permission_classes = (IsAdminOrSuperAdmin,)
        else:
            permission_classes = (permissions.IsAuthenticated,)
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        condominium_id = self.request.query_params.get('condominium')
        if condominium_id:
            queryset = queryset.filter(condominium_id=condominium_id)
        return queryset


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related('common_space', 'common_space__condominium', 'user').all()
    serializer_class = ReservationSerializer

    def get_permissions(self):
        if self.action in {'update', 'partial_update'}:
            permission_classes = (IsBackofficeRole,)
        elif self.action == 'destroy':
            permission_classes = (IsAdminOrSuperAdmin,)
        else:
            permission_classes = (permissions.IsAuthenticated,)
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == User.Role.RESIDENTE:
            queryset = queryset.filter(user=user)

        common_space_id = self.request.query_params.get('common_space')
        condominium_id = self.request.query_params.get('condominium')
        status = self.request.query_params.get('status')

        if common_space_id:
            queryset = queryset.filter(common_space_id=common_space_id)
        if condominium_id:
            queryset = queryset.filter(common_space__condominium_id=condominium_id)
        if status:
            queryset = queryset.filter(status=status)

        return queryset

class MeterReadingViewSet(viewsets.ModelViewSet):
    queryset = MeterReading.objects.all()
    serializer_class = MeterReadingSerializer
    permission_classes = [permissions.IsAuthenticated]