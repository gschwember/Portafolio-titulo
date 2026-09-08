from decimal import Decimal

from rest_framework import serializers
from django.utils import timezone
from users.models import User

from .access import (
    TENANT_ADMIN_ROLES,
    TENANT_BACKOFFICE_ROLES,
    has_active_membership_outside,
    has_condominium_access,
)
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


def validate_condominium_access(serializer, condominium_id, roles, field_name='condominium'):
    if not condominium_id:
        return

    view = serializer.context.get('view')
    nested_condominium_id = view.kwargs.get('condominium_id') if view else None
    if nested_condominium_id and int(nested_condominium_id) != int(condominium_id):
        raise serializers.ValidationError(
            {field_name: 'El recurso no pertenece al condominio indicado en la ruta.'}
        )

    request = serializer.context.get('request')
    if not request or not has_condominium_access(request.user, condominium_id, roles=roles):
        raise serializers.ValidationError(
            {field_name: 'No tienes permisos para gestionar recursos de este condominio.'}
        )


class CondominiumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condominium
        fields = ('id', 'name', 'address', 'city', 'latitude', 'longitude', 'is_active')


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ('id', 'condominium', 'number', 'floor', 'proration_factor', 'is_active')

    def validate(self, attrs):
        condominium = attrs.get('condominium') or getattr(self.instance, 'condominium', None)
        if condominium:
            validate_condominium_access(self, condominium.id, TENANT_ADMIN_ROLES)
        return attrs


class CondominiumMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = CondominiumMembership
        fields = ('id', 'user', 'condominium', 'role', 'is_active', 'created_at')
        read_only_fields = ('created_at',)

    def validate(self, attrs):
        request = self.context['request']
        user = attrs.get('user') or getattr(self.instance, 'user', None)
        condominium = attrs.get('condominium') or getattr(self.instance, 'condominium', None)
        role = attrs.get('role') or getattr(self.instance, 'role', None)
        target_changed = bool(
            not self.instance
            or (user and user.id != self.instance.user_id)
            or (condominium and condominium.id != self.instance.condominium_id)
        )

        if condominium:
            validate_condominium_access(self, condominium.id, TENANT_ADMIN_ROLES)

        if user and user.role == User.Role.SUPERADMIN:
            raise serializers.ValidationError({'user': 'El superadministrador no requiere membresia.'})
        if user and role and user.role != role:
            raise serializers.ValidationError(
                {'role': 'El rol de la membresia debe coincidir con el rol global del usuario.'}
            )
        if request.user.role == User.Role.ADMIN and role == CondominiumMembership.Role.ADMIN:
            raise serializers.ValidationError(
                {'role': 'Solo un superadministrador puede asignar administradores.'}
            )
        if (
            request.user.role == User.Role.ADMIN
            and target_changed
            and user
            and condominium
            and has_active_membership_outside(user, condominium.id)
        ):
            raise serializers.ValidationError(
                {'user': 'No puedes incorporar un usuario asociado a otro condominio.'}
            )

        return attrs


class ResidentAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResidentAssignment
        fields = ('id', 'user', 'unit', 'start_date', 'end_date', 'is_owner', 'is_primary', 'is_active')

    def validate_user(self, value):
        if value.role != User.Role.RESIDENTE:
            raise serializers.ValidationError('La asignacion solo permite usuarios con rol residente.')
        return value

    def validate(self, attrs):
        request = self.context['request']
        user = attrs.get('user') or getattr(self.instance, 'user', None)
        unit = attrs.get('unit') or getattr(self.instance, 'unit', None)
        target_changed = bool(
            not self.instance
            or (user and user.id != self.instance.user_id)
            or (unit and unit.id != self.instance.unit_id)
        )
        if unit:
            validate_condominium_access(self, unit.condominium_id, TENANT_ADMIN_ROLES, 'unit')
        if (
            request.user.role == User.Role.ADMIN
            and target_changed
            and user
            and unit
            and has_active_membership_outside(user, unit.condominium_id)
        ):
            raise serializers.ValidationError(
                {'user': 'No puedes asignar un residente asociado a otro condominio.'}
            )
        return attrs


class BillingPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingPeriod
        fields = ('id', 'condominium', 'start_date', 'end_date', 'status', 'close_date')

    def validate(self, attrs):
        condominium = attrs.get('condominium') or getattr(self.instance, 'condominium', None)
        if condominium:
            validate_condominium_access(self, condominium.id, TENANT_ADMIN_ROLES)
        return attrs


class CommonExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommonExpense
        fields = (
            'id',
            'period',
            'unit',
            'fixed_amount',
            'variable_amount',
            'total_amount',
            'status',
            'generated_at',
        )
        read_only_fields = ('total_amount',)

    def validate(self, attrs):
        period = attrs.get('period') or getattr(self.instance, 'period', None)
        unit = attrs.get('unit') or getattr(self.instance, 'unit', None)

        if period and unit and period.condominium_id != unit.condominium_id:
            raise serializers.ValidationError({'unit': 'La unidad debe pertenecer al condominio del periodo.'})

        if period:
            validate_condominium_access(self, period.condominium_id, TENANT_ADMIN_ROLES, 'period')

        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id',
            'unit',
            'period',
            'amount',
            'payment_date',
            'payment_method',
            'status',
            'validation_date',
        )

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError('El monto debe ser mayor que cero.')
        return value

    def validate(self, attrs):
        request = self.context['request']
        unit = attrs.get('unit') or getattr(self.instance, 'unit', None)
        period = attrs.get('period') or getattr(self.instance, 'period', None)
        payment_date = attrs.get('payment_date') or getattr(self.instance, 'payment_date', None)

        if unit and period and unit.condominium_id != period.condominium_id:
            raise serializers.ValidationError({'unit': 'La unidad debe pertenecer al condominio del periodo.'})

        if payment_date and payment_date > timezone.localdate():
            raise serializers.ValidationError({'payment_date': 'La fecha de pago no puede ser futura.'})

        if request.user.role == User.Role.RESIDENTE:
            has_assignment = ResidentAssignment.objects.filter(
                user=request.user,
                unit=unit,
                is_active=True,
            ).exists()
            if not has_assignment:
                raise serializers.ValidationError({'unit': 'No tienes asignacion activa para esta unidad.'})
            if request.method in ('POST', 'PUT', 'PATCH'):
                attrs['status'] = Payment.Status.PENDING
                attrs['validation_date'] = None
        elif unit:
            validate_condominium_access(self, unit.condominium_id, TENANT_ADMIN_ROLES, 'unit')

        return attrs


class PaymentReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentReceipt
        fields = ('id', 'payment', 'user', 'file', 'original_name', 'uploaded_at')
        read_only_fields = ('uploaded_at',)
        extra_kwargs = {
            'user': {'required': False},
        }

    def validate(self, attrs):
        request = self.context['request']
        payment = attrs.get('payment') or getattr(self.instance, 'payment', None)
        uploaded_file = attrs.get('file') or getattr(self.instance, 'file', None)
        original_name = attrs.get('original_name') or getattr(self.instance, 'original_name', '')

        if not payment:
            raise serializers.ValidationError({'payment': 'Debes asociar este comprobante a un pago.'})

        if not uploaded_file:
            raise serializers.ValidationError({'file': 'Debes adjuntar el archivo del comprobante.'})

        if not str(original_name).strip():
            raise serializers.ValidationError({'original_name': 'Debes indicar el nombre del comprobante.'})

        if request.user.role == User.Role.RESIDENTE:
            has_assignment = ResidentAssignment.objects.filter(
                user=request.user,
                unit=payment.unit,
                is_active=True,
            ).exists()
            if not has_assignment:
                raise serializers.ValidationError({'payment': 'No puedes subir comprobantes para esta unidad.'})
            attrs['user'] = request.user
        elif payment.unit:
            validate_condominium_access(self, payment.unit.condominium_id, TENANT_ADMIN_ROLES, 'payment')

        return attrs


class CommonSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommonSpace
        fields = ('id', 'condominium', 'name', 'space_type', 'block_duration', 'is_active')

    def validate(self, attrs):
        condominium = attrs.get('condominium') or getattr(self.instance, 'condominium', None)
        if condominium:
            validate_condominium_access(self, condominium.id, TENANT_ADMIN_ROLES)
        return attrs


class ReservationSerializer(serializers.ModelSerializer):
    common_space_name = serializers.CharField(source='common_space.name', read_only=True)
    common_space_type = serializers.CharField(source='common_space.space_type', read_only=True)
    condominium_id = serializers.IntegerField(source='common_space.condominium_id', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = Reservation
        fields = (
            'id',
            'common_space',
            'common_space_name',
            'common_space_type',
            'condominium_id',
            'user',
            'user_name',
            'user_role',
            'reservation_date',
            'start_time',
            'end_time',
            'status',
            'created_at',
        )
        read_only_fields = ('created_at',)
        extra_kwargs = {
            'user': {'required': False},
        }

    def get_user_name(self, obj):
        full_name = f'{obj.user.first_name or ""} {obj.user.last_name or ""}'.strip()
        return full_name or obj.user.email

    def validate(self, attrs):
        request = self.context['request']
        user = attrs.get('user') or getattr(self.instance, 'user', None)
        common_space = attrs.get('common_space') or getattr(self.instance, 'common_space', None)
        reservation_date = attrs.get('reservation_date') or getattr(self.instance, 'reservation_date', None)
        start_time = attrs.get('start_time') or getattr(self.instance, 'start_time', None)
        end_time = attrs.get('end_time') or getattr(self.instance, 'end_time', None)

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({'end_time': 'La hora de termino debe ser mayor al inicio.'})

        if request.user.role == User.Role.RESIDENTE:
            attrs['user'] = request.user
            attrs['status'] = Reservation.Status.PENDING
            user = request.user

            has_active_assignment = ResidentAssignment.objects.filter(
                user=request.user,
                unit__condominium_id=common_space.condominium_id,
                is_active=True,
            ).exists()
            if not has_active_assignment:
                raise serializers.ValidationError(
                    {'common_space': 'No tienes asignacion activa en el condominio de este espacio comun.'}
                )
        elif common_space:
            validate_condominium_access(
                self,
                common_space.condominium_id,
                TENANT_BACKOFFICE_ROLES,
                'common_space',
            )

        overlapping_query = Reservation.objects.filter(
            common_space=common_space,
            reservation_date=reservation_date,
            status__in=[Reservation.Status.PENDING, Reservation.Status.APPROVED],
            start_time__lt=end_time,
            end_time__gt=start_time,
        )

        if self.instance:
            overlapping_query = overlapping_query.exclude(pk=self.instance.pk)

        if overlapping_query.exists():
            raise serializers.ValidationError(
                {'start_time': 'Ya existe una reserva en ese horario para el espacio comun seleccionado.'}
            )

        if request.user.role != User.Role.RESIDENTE and not user:
            raise serializers.ValidationError({'user': 'Debes seleccionar al residente de la reserva.'})

        if request.user.role != User.Role.RESIDENTE and user and user.role != User.Role.RESIDENTE:
            raise serializers.ValidationError({'user': 'La reserva debe pertenecer a un residente.'})

        if request.user.role != User.Role.RESIDENTE and user and common_space:
            has_active_assignment = ResidentAssignment.objects.filter(
                user=user,
                unit__condominium_id=common_space.condominium_id,
                is_active=True,
            ).exists()
            if not has_active_assignment:
                raise serializers.ValidationError(
                    {'user': 'El residente no tiene asignacion activa en el condominio del espacio.'}
                )

        return attrs



class MeterReadingSerializer(serializers.ModelSerializer):
    # Mapeamos los nombres del front (camelCase) al back (snake_case)
    previousReading = serializers.DecimalField(source='previous_reading', max_digits=10, decimal_places=2, required=False)
    currentReading = serializers.DecimalField(source='current_reading', max_digits=10, decimal_places=2)
    dateRecorded = serializers.DateField(source='date_recorded', read_only=True)
    type = serializers.CharField(source='reading_type')

    class Meta:
        model = MeterReading
        fields = ['id', 'unit', 'type', 'previousReading', 'currentReading', 'consumption', 'dateRecorded', 'status']
        read_only_fields = ['id', 'consumption', 'dateRecorded', 'status']

    def validate(self, attrs):
        unit = attrs.get('unit') or getattr(self.instance, 'unit', None)
        if unit:
            validate_condominium_access(self, unit.condominium_id, TENANT_BACKOFFICE_ROLES, 'unit')
        return attrs
