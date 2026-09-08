import calendar
import datetime

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from users.models import User

from .access import TENANT_ADMIN_ROLES, accessible_condominium_ids, has_condominium_access
from .models import (
    BillingPeriod,
    CommonExpense,
    CommonSpace,
    Condominium,
    CondominiumMembership,
    MeterReading,
    Payment,
    PaymentReceipt,
    Reservation,
    ResidentAssignment,
    Unit,
)
from .permissions import IsAdminOrSuperAdmin, IsBackofficeRole, IsFinancialRole
from .serializers import (
    BillingPeriodSerializer,
    CommonExpenseSerializer,
    CommonSpaceSerializer,
    CondominiumSerializer,
    CondominiumMembershipSerializer,
    MeterReadingSerializer,
    PaymentReceiptSerializer,
    PaymentSerializer,
    ReservationSerializer,
    ResidentAssignmentSerializer,
    UnitSerializer,
)


class TenantScopedQuerysetMixin:
    condominium_lookup = 'condominium_id'
    tenant_access_roles = None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        condominium_id = self.kwargs.get('condominium_id')
        if condominium_id and not has_condominium_access(
            request.user,
            condominium_id,
            roles=self.tenant_access_roles,
        ):
            raise NotFound('Condominio no encontrado.')

    def get_queryset(self):
        queryset = super().get_queryset()
        condominium_ids = accessible_condominium_ids(
            self.request.user,
            roles=self.tenant_access_roles,
        )
        condominium_id = self.kwargs.get('condominium_id')

        if condominium_id:
            return queryset.filter(**{self.condominium_lookup: condominium_id})
        return queryset.filter(**{f'{self.condominium_lookup}__in': condominium_ids})


class CondominiumViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Condominium.objects.all()
    serializer_class = CondominiumSerializer
    condominium_lookup = 'id'
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrSuperAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.role != User.Role.SUPERADMIN:
            condominium_ids = accessible_condominium_ids(
                self.request.user,
                roles=TENANT_ADMIN_ROLES,
            )
            return queryset.filter(id__in=condominium_ids)
        return queryset

    def perform_create(self, serializer):
        condominium = serializer.save()
        if self.request.user.role == User.Role.ADMIN:
            CondominiumMembership.objects.update_or_create(
                user=self.request.user,
                condominium=condominium,
                defaults={
                    'role': CondominiumMembership.Role.ADMIN,
                    'is_active': True,
                },
            )


class UnitViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Unit.objects.select_related('condominium').all()
    serializer_class = UnitSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrSuperAdmin()]


class CondominiumMembershipViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = CondominiumMembership.objects.select_related('user', 'condominium').all()
    serializer_class = CondominiumMembershipSerializer
    permission_classes = (IsAdminOrSuperAdmin,)
    tenant_access_roles = TENANT_ADMIN_ROLES


class ResidentAssignmentViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ResidentAssignment.objects.select_related('user', 'unit', 'unit__condominium').all()
    serializer_class = ResidentAssignmentSerializer
    permission_classes = (IsAdminOrSuperAdmin,)
    condominium_lookup = 'unit__condominium_id'
    tenant_access_roles = TENANT_ADMIN_ROLES


class BillingPeriodViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = BillingPeriod.objects.select_related('condominium').all()
    serializer_class = BillingPeriodSerializer
    permission_classes = (IsAdminOrSuperAdmin,)
    tenant_access_roles = TENANT_ADMIN_ROLES

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


class CommonExpenseViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = CommonExpense.objects.select_related('period', 'period__condominium', 'unit').all()
    serializer_class = CommonExpenseSerializer
    condominium_lookup = 'unit__condominium_id'

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            permission_classes = (IsAdminOrSuperAdmin,)
        else:
            permission_classes = (IsFinancialRole,)
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


class PaymentViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('period', 'unit').all()
    serializer_class = PaymentSerializer
    condominium_lookup = 'unit__condominium_id'

    def get_permissions(self):
        if self.action in {'update', 'partial_update', 'destroy'}:
            permission_classes = (IsAdminOrSuperAdmin,)
        else:
            permission_classes = (IsFinancialRole,)
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


class PaymentReceiptViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = PaymentReceipt.objects.select_related('payment', 'payment__unit', 'user').all()
    serializer_class = PaymentReceiptSerializer
    condominium_lookup = 'payment__unit__condominium_id'

    def get_permissions(self):
        if self.action in {'update', 'partial_update', 'destroy'}:
            permission_classes = (IsAdminOrSuperAdmin,)
        else:
            permission_classes = (IsFinancialRole,)
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


class CommonSpaceViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
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


class ReservationViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related('common_space', 'common_space__condominium', 'user').all()
    serializer_class = ReservationSerializer
    condominium_lookup = 'common_space__condominium_id'

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

class MeterReadingViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = MeterReading.objects.select_related('unit', 'unit__condominium').all()
    serializer_class = MeterReadingSerializer
    condominium_lookup = 'unit__condominium_id'

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            permission_classes = (IsBackofficeRole,)
        else:
            permission_classes = (permissions.IsAuthenticated,)
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == User.Role.RESIDENTE:
            unit_ids = ResidentAssignment.objects.filter(
                user=self.request.user,
                is_active=True,
            ).values_list('unit_id', flat=True)
            queryset = queryset.filter(unit_id__in=unit_ids)
        return queryset
