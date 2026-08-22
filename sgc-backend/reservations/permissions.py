from rest_framework.permissions import SAFE_METHODS, BasePermission

from users.models import User


class CanManageReservations(BasePermission):
    message = 'No tienes permisos para realizar esta accion en reservas.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = request.user.role

        if request.method in SAFE_METHODS:
            return role in {
                User.Role.SUPERADMIN,
                User.Role.ADMIN,
                User.Role.CONSERJE,
                User.Role.RESIDENTE,
            }

        if request.method == 'POST':
            return role in {User.Role.SUPERADMIN, User.Role.ADMIN, User.Role.RESIDENTE}

        if request.method in {'PUT', 'PATCH', 'DELETE'}:
            return role in {User.Role.SUPERADMIN, User.Role.ADMIN, User.Role.RESIDENTE}

        return False

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        role = request.user.role

        if role in {User.Role.SUPERADMIN, User.Role.ADMIN}:
            return True

        if role == User.Role.RESIDENTE:
            is_owner = obj.requester_id == request.user.id
            return is_owner and obj.status == obj.Status.PENDING

        return False
