from django.conf import settings
from django.db import models
from django.utils import timezone

from users.models import User


class Condominium(models.Model):
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=255, default='')
    city = models.CharField(max_length=120, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name


class Unit(models.Model):
    condominium = models.ForeignKey(Condominium, on_delete=models.CASCADE, related_name='units')
    number = models.CharField(max_length=30)
    floor = models.IntegerField(null=True, blank=True)
    proration_factor = models.DecimalField(max_digits=8, decimal_places=4, default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ('condominium_id', 'number')
        constraints = [
            models.UniqueConstraint(fields=('condominium', 'number'), name='unique_unit_per_condominium'),
        ]

    def __str__(self):
        return f'{self.condominium.name} - {self.number}'


class ResidentAssignment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resident_assignments')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='resident_assignments')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_owner = models.BooleanField(default=False)
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ('-start_date',)

    def __str__(self):
        return f'{self.user.email} -> {self.unit}'


class BillingPeriod(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Abierto'
        CLOSED = 'closed', 'Cerrado'
        GENERATED = 'generated', 'Generado'

    condominium = models.ForeignKey(Condominium, on_delete=models.CASCADE, related_name='billing_periods')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    close_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ('-start_date',)
        constraints = [
            models.UniqueConstraint(fields=('condominium', 'start_date', 'end_date'), name='unique_billing_period_range_per_condo'),
        ]

    def __str__(self):
        return f'{self.condominium.name} {self.start_date} - {self.end_date}'


class CommonExpense(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        PARTIAL = 'partial', 'Parcial'
        PAID = 'paid', 'Pagado'
        OVERDUE = 'overdue', 'Vencido'

    period = models.ForeignKey(BillingPeriod, on_delete=models.CASCADE, related_name='common_expenses')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='common_expenses')
    fixed_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    variable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    generated_at = models.DateField(default=timezone.localdate)

    class Meta:
        ordering = ('-generated_at',)
        constraints = [
            models.UniqueConstraint(fields=('period', 'unit'), name='unique_common_expense_per_period_unit'),
        ]

    def __str__(self):
        return f'{self.unit} - {self.period}'

    def save(self, *args, **kwargs):
        self.total_amount = (self.fixed_amount or 0) + (self.variable_amount or 0)
        super().save(*args, **kwargs)


class Payment(models.Model):
    class Method(models.TextChoices):
        TRANSFER = 'transfer', 'Transferencia'
        CARD = 'card', 'Tarjeta'
        CASH = 'cash', 'Efectivo'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        APPROVED = 'approved', 'Aprobado'
        REJECTED = 'rejected', 'Rechazado'

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    period = models.ForeignKey(BillingPeriod, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField(default=timezone.localdate)
    payment_method = models.CharField(max_length=15, choices=Method.choices, default=Method.TRANSFER)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    validation_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ('-payment_date',)

    def __str__(self):
        return f'Pago {self.id} - {self.amount}'


class PaymentReceipt(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='receipts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_receipts')
    file = models.FileField(upload_to='payment_receipts/')
    original_name = models.CharField(max_length=255)
    uploaded_at = models.DateField(default=timezone.localdate)

    class Meta:
        ordering = ('-uploaded_at',)

    def __str__(self):
        return f'Comprobante {self.id} - Pago {self.payment_id}'


class CommonSpace(models.Model):
    condominium = models.ForeignKey(Condominium, on_delete=models.CASCADE, related_name='common_spaces')
    name = models.CharField(max_length=120)
    space_type = models.CharField(max_length=80)
    block_duration = models.PositiveSmallIntegerField(default=60)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ('condominium_id', 'name')
        constraints = [
            models.UniqueConstraint(fields=('condominium', 'name'), name='unique_common_space_per_condo'),
        ]

    def __str__(self):
        return f'{self.condominium.name} - {self.name}'


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        APPROVED = 'approved', 'Aprobada'
        REJECTED = 'rejected', 'Rechazada'
        CANCELLED = 'cancelled', 'Cancelada'

    common_space = models.ForeignKey(CommonSpace, on_delete=models.CASCADE, related_name='reservations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='billing_reservations')
    reservation_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-reservation_date', '-start_time')

    def __str__(self):
        return f'{self.common_space.name} - {self.reservation_date} {self.start_time}'


def validate_resident_role(user):
    return user.role == User.Role.RESIDENTE


class MeterReading(models.Model):
    class Type(models.TextChoices):
        WATER = 'agua', 'Agua'
        ELECTRICITY = 'luz', 'Luz'
        GAS = 'gas', 'Gas'
        HEATING = 'calefaccion', 'Calefacción'

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='meter_readings')
    reading_type = models.CharField(max_length=20, choices=Type.choices, default=Type.WATER)
    previous_reading = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    current_reading = models.DecimalField(max_digits=10, decimal_places=2)
    consumption = models.DecimalField(max_digits=10, decimal_places=2, blank=True)
    date_recorded = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=20, default='registrado')

    class Meta:
        ordering = ('-date_recorded',)

    def __str__(self):
        return f'{self.unit} - {self.reading_type} - {self.current_reading}'

    def save(self, *args, **kwargs):
        # Calculamos el consumo automáticamente en el backend por seguridad
        if self.current_reading and self.previous_reading is not None:
            self.consumption = self.current_reading - self.previous_reading
        super().save(*args, **kwargs)
