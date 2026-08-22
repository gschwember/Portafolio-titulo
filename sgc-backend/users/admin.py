from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ('email',)
    list_display = ('email', 'rut', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    search_fields = ('email', 'rut', 'first_name', 'last_name')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informacion personal', {'fields': ('rut', 'first_name', 'last_name', 'role')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas importantes', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'rut', 'first_name', 'last_name', 'role', 'password1', 'password2', 'is_staff', 'is_active'),
            },
        ),
    )
