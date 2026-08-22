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
        'resident_a': User.objects.create_user(email='residente.a@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE),
        'resident_b': User.objects.create_user(email='residente.b@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE),
        'conserje': User.objects.create_user(email='conserje@sgc.cl', password='SgcSecure2026!', role=User.Role.CONSERJE),
        'admin': User.objects.create_user(email='admin@sgc.cl', password='SgcSecure2026!', role=User.Role.ADMIN),
    }


@pytest.mark.django_db
def test_resident_only_lists_own_reservations(api_client, common_space_pool, users):
    Reservation.objects.create(
        common_space=common_space_pool,
        requester=users['resident_a'],
        requester_name='Residente A',
        requester_role=User.Role.RESIDENTE,
        reservation_date='2026-04-20',
        start_time='10:00',
        end_time='12:00',
    )
    Reservation.objects.create(
        common_space=common_space_pool,
        requester=users['resident_b'],
        requester_name='Residente B',
        requester_role=User.Role.RESIDENTE,
        reservation_date='2026-04-21',
        start_time='14:00',
        end_time='16:00',
    )

    api_client.force_authenticate(user=users['resident_a'])
    response = api_client.get('/api/v1/reservations/')

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['requester_name'] == 'Residente A'


@pytest.mark.django_db
def test_conserje_can_list_all_reservations(api_client, common_space_pool, users):
    Reservation.objects.create(
        common_space=common_space_pool,
        requester=users['resident_a'],
        requester_name='Residente A',
        requester_role=User.Role.RESIDENTE,
        reservation_date='2026-04-20',
        start_time='10:00',
        end_time='12:00',
    )
    Reservation.objects.create(
        common_space=common_space_pool,
        requester=users['resident_b'],
        requester_name='Residente B',
        requester_role=User.Role.RESIDENTE,
        reservation_date='2026-04-21',
        start_time='14:00',
        end_time='16:00',
    )

    api_client.force_authenticate(user=users['conserje'])
    response = api_client.get('/api/v1/reservations/')

    assert response.status_code == 200
    assert len(response.data) == 2


@pytest.mark.django_db
def test_resident_can_create_own_reservation(api_client, common_space_pool, users):
    api_client.force_authenticate(user=users['resident_a'])

    response = api_client.post(
        '/api/v1/reservations/',
        {
            'common_space': common_space_pool.code,
            'requester_name': 'Nombre inventado',
            'requester_role': User.Role.ADMIN,
            'reservation_date': '2026-04-22',
            'start_time': '18:00',
            'end_time': '20:00',
            'status': Reservation.Status.PENDING,
            'notes': 'Reserva familiar',
            'extra_data': {'guestCount': 4},
        },
        format='json',
    )

    assert response.status_code == 201
    assert response.data['requester_role'] == User.Role.RESIDENTE
    assert response.data['requester_name'] == users['resident_a'].email


@pytest.mark.django_db
def test_conserje_cannot_create_or_update_reservation(api_client, common_space_pool, users):
    reservation = Reservation.objects.create(
        common_space=common_space_pool,
        requester=users['resident_a'],
        requester_name='Residente A',
        requester_role=User.Role.RESIDENTE,
        reservation_date='2026-04-20',
        start_time='10:00',
        end_time='12:00',
    )

    api_client.force_authenticate(user=users['conserje'])

    create_response = api_client.post(
        '/api/v1/reservations/',
        {
            'common_space': common_space_pool.code,
            'requester_name': 'Conserje',
            'requester_role': User.Role.CONSERJE,
            'reservation_date': '2026-04-23',
            'start_time': '09:00',
            'end_time': '10:00',
            'status': Reservation.Status.PENDING,
            'notes': '',
            'extra_data': {},
        },
        format='json',
    )
    update_response = api_client.patch(
        f'/api/v1/reservations/{reservation.id}',
        {'status': Reservation.Status.APPROVED},
        format='json',
    )

    assert create_response.status_code == 403
    assert update_response.status_code == 403


@pytest.mark.django_db
def test_common_spaces_endpoint_returns_seeded_spaces(api_client, users, db):
    api_client.force_authenticate(user=users['admin'])
    response = api_client.get('/api/v1/reservations/common-spaces/')

    assert response.status_code == 200
    assert len(response.data) >= 3
    codes = {row['code'] for row in response.data}
    assert {'pool', 'multi_use_room', 'gym'}.issubset(codes)
