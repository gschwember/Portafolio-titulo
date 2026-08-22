from rest_framework.permissions import BasePermission

from .models import User


class IsSuperAdmin(BasePermission):
    message = 'No tienes permisos para gestionar usuarios.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.SUPERADMIN
        )


class IsAdminOrSuperAdmin(BasePermission):
    message = 'No tienes permisos para gestionar usuarios.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {User.Role.SUPERADMIN, User.Role.ADMIN}
        )
