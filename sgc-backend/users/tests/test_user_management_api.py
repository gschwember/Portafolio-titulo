import pytest
from rest_framework.test import APIClient

from billing.models import Condominium, CondominiumMembership
from users.models import User


@pytest.mark.django_db
def test_superadmin_can_list_users():
    client = APIClient()
    superadmin = User.objects.create_user(email='root@sgc.cl', password='SgcSecure2026!', role=User.Role.SUPERADMIN)
    User.objects.create_user(email='residente@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)

    client.force_authenticate(user=superadmin)
    response = client.get('/api/v1/users/')

    assert response.status_code == 200
    assert len(response.data) >= 2


@pytest.mark.django_db
def test_admin_can_list_users():
    client = APIClient()
    admin = User.objects.create_user(email='admin@sgc.cl', password='SgcSecure2026!', role=User.Role.ADMIN)
    resident_allowed = User.objects.create_user(
        email='residente2@sgc.cl',
        password='SgcSecure2026!',
        role=User.Role.RESIDENTE,
    )
    resident_blocked = User.objects.create_user(
        email='residente3@sgc.cl',
        password='SgcSecure2026!',
        role=User.Role.RESIDENTE,
    )
    condo_allowed = Condominium.objects.create(name='Condo Usuarios A', address='A')
    condo_blocked = Condominium.objects.create(name='Condo Usuarios B', address='B')
    CondominiumMembership.objects.create(
        user=admin,
        condominium=condo_allowed,
        role=CondominiumMembership.Role.ADMIN,
    )
    CondominiumMembership.objects.create(
        user=resident_allowed,
        condominium=condo_allowed,
        role=CondominiumMembership.Role.RESIDENTE,
    )
    CondominiumMembership.objects.create(
        user=resident_blocked,
        condominium=condo_blocked,
        role=CondominiumMembership.Role.RESIDENTE,
    )

    client.force_authenticate(user=admin)
    response = client.get('/api/v1/users/')

    assert response.status_code == 200
    assert {item['id'] for item in response.data} == {admin.id, resident_allowed.id}


@pytest.mark.django_db
def test_admin_cannot_create_global_users_or_grant_admin_membership():
    client = APIClient()
    admin = User.objects.create_user(email='admin-limitado@sgc.cl', password='SgcSecure2026!', role=User.Role.ADMIN)
    other_admin = User.objects.create_user(email='otro-admin@sgc.cl', password='SgcSecure2026!', role=User.Role.ADMIN)
    condominium = Condominium.objects.create(name='Condo Membresias', address='A')
    CondominiumMembership.objects.create(
        user=admin,
        condominium=condominium,
        role=CondominiumMembership.Role.ADMIN,
    )
    client.force_authenticate(user=admin)

    create_user_response = client.post(
        '/api/v1/users/',
        {
            'email': 'nuevo@sgc.cl',
            'first_name': 'Nuevo',
            'last_name': 'Usuario',
            'role': User.Role.RESIDENTE,
            'password': 'SgcSecure2026!',
            'password_confirmation': 'SgcSecure2026!',
            'is_active': True,
        },
        format='json',
    )
    assert create_user_response.status_code == 403

    grant_admin_response = client.post(
        f'/api/v1/condominiums/{condominium.id}/members/',
        {
            'user': other_admin.id,
            'condominium': condominium.id,
            'role': CondominiumMembership.Role.ADMIN,
            'is_active': True,
        },
        format='json',
    )
    assert grant_admin_response.status_code == 400
    assert 'role' in grant_admin_response.data


@pytest.mark.django_db
def test_admin_cannot_move_a_user_from_another_condominium():
    client = APIClient()
    admin = User.objects.create_user(
        email='admin-origen@sgc.cl',
        password='SgcSecure2026!',
        role=User.Role.ADMIN,
    )
    resident = User.objects.create_user(
        email='residente-ajeno@sgc.cl',
        password='SgcSecure2026!',
        role=User.Role.RESIDENTE,
    )
    condominium = Condominium.objects.create(name='Condo Origen', address='A')
    other_condominium = Condominium.objects.create(name='Condo Ajeno', address='B')
    CondominiumMembership.objects.create(
        user=admin,
        condominium=condominium,
        role=CondominiumMembership.Role.ADMIN,
    )
    CondominiumMembership.objects.create(
        user=resident,
        condominium=other_condominium,
        role=CondominiumMembership.Role.RESIDENTE,
    )
    client.force_authenticate(user=admin)

    response = client.post(
        f'/api/v1/condominiums/{condominium.id}/members/',
        {
            'user': resident.id,
            'condominium': condominium.id,
            'role': CondominiumMembership.Role.RESIDENTE,
            'is_active': True,
        },
        format='json',
    )

    assert response.status_code == 400
    assert 'user' in response.data


@pytest.mark.django_db
def test_resident_cannot_list_users():
    client = APIClient()
    resident = User.objects.create_user(email='residente@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)

    client.force_authenticate(user=resident)
    response = client.get('/api/v1/users/')

    assert response.status_code == 403
