from decimal import Decimal

from rest_framework import serializers
from django.utils import timezone
from .models import MeterReading
from users.models import User

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


class CondominiumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condominium
        fields = ('id', 'name', 'address', 'city', 'latitude', 'longitude', 'is_active')


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ('id', 'condominium', 'number', 'floor', 'proration_factor', 'is_active')


class ResidentAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResidentAssignment
        fields = ('id', 'user', 'unit', 'start_date', 'end_date', 'is_owner', 'is_primary', 'is_active')

    def validate_user(self, value):
        if value.role != User.Role.RESIDENTE:
            raise serializers.ValidationError('La asignacion solo permite usuarios con rol residente.')
        return value


class BillingPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingPeriod
        fields = ('id', 'condominium', 'start_date', 'end_date', 'status', 'close_date')


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

        return attrs


class CommonSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommonSpace
        fields = ('id', 'condominium', 'name', 'space_type', 'block_duration', 'is_active')


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

        if request.method == 'POST' and user and user.role == User.Role.RESIDENTE and request.user.role in {User.Role.ADMIN, User.Role.SUPERADMIN}:
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
