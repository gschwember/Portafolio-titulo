import pytest
from rest_framework.test import APIClient

from reservations.models import CommonSpace, Reservation
from users.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def common_space_pool(db):
    common_space, _ = CommonSpace.objects.get_or_create(
        code=CommonSpace.Code.POOL,
        defaults={'name': 'Piscina', 'capacity': 6},
    )
    return common_space


@pytest.fixture
def users(db):
    return {
        'resident': User.objects.create_user(
            email='residente@sgc.cl',
            password='SgcSecure2026!',
            role=User.Role.RESIDENTE,
        ),
        'conserje': User.objects.create_user(
            email='conserje@sgc.cl',
            password='SgcSecure2026!',
            role=User.Role.CONSERJE,
        ),
        'admin': User.objects.create_user(
            email='admin@sgc.cl',
            password='SgcSecure2026!',
            role=User.Role.ADMIN,
        ),
        'superadmin': User.objects.create_user(
            email='superadmin@sgc.cl',
            password='SgcSecure2026!',
            role=User.Role.SUPERADMIN,
        ),
    }


@pytest.mark.django_db
@pytest.mark.parametrize('role', ['resident', 'conserje', 'admin'])
def test_tenant_roles_cannot_use_legacy_reservations_api(api_client, common_space_pool, users, role):
    Reservation.objects.create(
        common_space=common_space_pool,
        requester=users['resident'],
        requester_name='Residente',
        requester_role=User.Role.RESIDENTE,
        reservation_date='2026-04-20',
        start_time='10:00',
        end_time='12:00',
    )
    api_client.force_authenticate(user=users[role])

    reservations_response = api_client.get('/api/v1/reservations/')
    common_spaces_response = api_client.get('/api/v1/reservations/common-spaces/')

    assert reservations_response.status_code == 403
    assert common_spaces_response.status_code == 403


@pytest.mark.django_db
def test_resident_cannot_create_in_legacy_reservations_api(api_client, common_space_pool, users):
    api_client.force_authenticate(user=users['resident'])

    response = api_client.post(
        '/api/v1/reservations/',
        {
            'common_space': common_space_pool.code,
            'requester_name': 'Residente',
            'requester_role': User.Role.RESIDENTE,
            'reservation_date': '2026-04-22',
            'start_time': '18:00',
            'end_time': '20:00',
            'status': Reservation.Status.PENDING,
            'notes': 'Reserva familiar',
            'extra_data': {},
        },
        format='json',
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_superadmin_keeps_legacy_reservation_management(api_client, common_space_pool, users):
    api_client.force_authenticate(user=users['superadmin'])

    common_spaces_response = api_client.get('/api/v1/reservations/common-spaces/')
    create_response = api_client.post(
        '/api/v1/reservations/',
        {
            'common_space': common_space_pool.code,
            'requester_name': 'Visita administrativa',
            'requester_role': User.Role.ADMIN,
            'reservation_date': '2026-04-23',
            'start_time': '09:00',
            'end_time': '10:00',
            'status': Reservation.Status.PENDING,
            'notes': '',
            'extra_data': {},
        },
        format='json',
    )

    assert common_spaces_response.status_code == 200
    assert create_response.status_code == 201

    update_response = api_client.patch(
        f"/api/v1/reservations/{create_response.data['id']}",
        {'status': Reservation.Status.APPROVED},
        format='json',
    )

    assert update_response.status_code == 200
    assert update_response.data['status'] == Reservation.Status.APPROVED
