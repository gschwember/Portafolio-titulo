from django.db import models

from users.models import User


class CommonSpace(models.Model):
    class Code(models.TextChoices):
        POOL = 'pool', 'Piscina'
        MULTI_USE_ROOM = 'multi_use_room', 'Sala multiuso'
        GYM = 'gym', 'Gimnasio'

    code = models.CharField(max_length=40, choices=Code.choices, unique=True)
    name = models.CharField(max_length=120)
    capacity = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        APPROVED = 'approved', 'Aprobada'
        REJECTED = 'rejected', 'Rechazada'

    common_space = models.ForeignKey(CommonSpace, on_delete=models.PROTECT, related_name='reservations')
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    requester_name = models.CharField(max_length=120)
    requester_role = models.CharField(max_length=20, choices=User.Role.choices)
    reservation_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-reservation_date', '-start_time', '-id')

    def __str__(self):
        return f'{self.requester_name} - {self.common_space.name} ({self.reservation_date})'
