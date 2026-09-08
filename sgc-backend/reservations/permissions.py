from rest_framework.permissions import BasePermission

from users.models import User


class CanManageReservations(BasePermission):
    message = 'Esta API heredada solo esta disponible para superadministradores.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.SUPERADMIN
        )

    def has_object_permission(self, request, view, obj):
        return request.user.role == User.Role.SUPERADMIN
