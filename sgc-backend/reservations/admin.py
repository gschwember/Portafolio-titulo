from django.contrib import admin

from .models import CommonSpace, Reservation


@admin.register(CommonSpace)
class CommonSpaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'capacity', 'is_active')
    list_filter = ('is_active', 'code')
    search_fields = ('name', 'code')


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('id', 'requester_name', 'requester_role', 'common_space', 'reservation_date', 'start_time', 'end_time', 'status')
    list_filter = ('status', 'requester_role', 'common_space')
    search_fields = ('requester_name', 'requester__email', 'notes')
