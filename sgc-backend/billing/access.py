from users.models import User

from .models import Condominium, CondominiumMembership


TENANT_ADMIN_ROLES = (CondominiumMembership.Role.ADMIN,)
TENANT_BACKOFFICE_ROLES = (
    CondominiumMembership.Role.ADMIN,
    CondominiumMembership.Role.CONSERJE,
)


def is_superadmin(user):
    return bool(user and user.is_authenticated and user.role == User.Role.SUPERADMIN)


def accessible_condominium_ids(user, roles=None):
    if not user or not user.is_authenticated:
        return Condominium.objects.none().values_list('id', flat=True)

    if is_superadmin(user):
        return Condominium.objects.values_list('id', flat=True)
    if roles and user.role not in roles:
        return Condominium.objects.none().values_list('id', flat=True)

    memberships = CondominiumMembership.objects.filter(
        user=user,
        role=user.role,
        is_active=True,
    )
    return memberships.values_list('condominium_id', flat=True)


def has_condominium_access(user, condominium_id, roles=None):
    if not user or not user.is_authenticated or not condominium_id:
        return False
    if is_superadmin(user):
        return True
    if roles and user.role not in roles:
        return False

    memberships = CondominiumMembership.objects.filter(
        user=user,
        condominium_id=condominium_id,
        role=user.role,
        is_active=True,
    )
    return memberships.exists()


def has_active_membership_outside(user, condominium_id):
    return user.condominium_memberships.filter(is_active=True).exclude(
        condominium_id=condominium_id,
    ).exists()
