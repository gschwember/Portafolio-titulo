import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from billing.models import BillingPeriod, CommonExpense, CommonSpace, Condominium, Payment, Reservation, ResidentAssignment, Unit
from users.models import User


@pytest.mark.django_db
def test_admin_can_create_condominium_and_billing_period():
    client = APIClient()
    admin = User.objects.create_user(email='admin@sgc.cl', password='SgcSecure2026!', role=User.Role.ADMIN)
    client.force_authenticate(user=admin)

    condominium_response = client.post(
        '/api/v1/billing/condominiums/',
        {'name': 'Condominio Central', 'address': 'Av. Siempre Viva 123', 'city': 'Santiago'},
        format='json',
    )
    assert condominium_response.status_code == 201

    period_response = client.post(
        '/api/v1/billing/billing-periods/',
        {
            'condominium': condominium_response.data['id'],
            'start_date': '2026-04-01',
            'end_date': '2026-04-30',
            'status': 'open',
        },
        format='json',
    )

    assert period_response.status_code == 201
    assert BillingPeriod.objects.filter(condominium_id=condominium_response.data['id']).exists()


@pytest.mark.django_db
def test_resident_sees_only_own_common_expenses():
    client = APIClient()

    condominium = Condominium.objects.create(name='Condo Norte', address='Calle 1')
    period = BillingPeriod.objects.create(
        condominium=condominium,
        start_date='2026-05-01',
        end_date='2026-05-31',
        status='generated',
    )

    resident_a = User.objects.create_user(email='a@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)
    resident_b = User.objects.create_user(email='b@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)

    unit_a = Unit.objects.create(condominium=condominium, number='101')
    unit_b = Unit.objects.create(condominium=condominium, number='102')

    ResidentAssignment.objects.create(user=resident_a, unit=unit_a, start_date='2026-01-01', is_primary=True)
    ResidentAssignment.objects.create(user=resident_b, unit=unit_b, start_date='2026-01-01', is_primary=True)

    CommonExpense.objects.create(period=period, unit=unit_a, fixed_amount=80000, variable_amount=10000)
    CommonExpense.objects.create(period=period, unit=unit_b, fixed_amount=90000, variable_amount=15000)

    client.force_authenticate(user=resident_a)
    response = client.get('/api/v1/billing/common-expenses/')

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['unit'] == unit_a.id


@pytest.mark.django_db
def test_resident_can_create_payment_and_receipt_for_assigned_unit():
    client = APIClient()

    resident = User.objects.create_user(email='res@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)
    admin = User.objects.create_user(email='admin2@sgc.cl', password='SgcSecure2026!', role=User.Role.ADMIN)

    condominium = Condominium.objects.create(name='Condo Sur', address='Calle 2')
    unit = Unit.objects.create(condominium=condominium, number='201')
    period = BillingPeriod.objects.create(
        condominium=condominium,
        start_date='2026-06-01',
        end_date='2026-06-30',
        status='generated',
    )
    ResidentAssignment.objects.create(user=resident, unit=unit, start_date='2026-01-01', is_primary=True)

    client.force_authenticate(user=resident)
    payment_response = client.post(
        '/api/v1/billing/payments/',
        {
            'unit': unit.id,
            'period': period.id,
            'amount': '95000.00',
            'payment_method': 'transfer',
        },
        format='json',
    )

    assert payment_response.status_code == 201
    assert payment_response.data['status'] == 'pending'

    receipt_file = SimpleUploadedFile('comprobante.pdf', b'pdf-content', content_type='application/pdf')
    receipt_response = client.post(
        '/api/v1/billing/payment-receipts/',
        {
            'payment': payment_response.data['id'],
            'file': receipt_file,
            'original_name': 'comprobante.pdf',
        },
        format='multipart',
    )

    assert receipt_response.status_code == 201
    assert receipt_response.data['user'] == resident.id

    client.force_authenticate(user=admin)
    approve_response = client.patch(
        f"/api/v1/billing/payments/{payment_response.data['id']}/",
        {'status': 'approved', 'validation_date': '2026-06-15'},
        format='json',
    )

    assert approve_response.status_code == 200
    assert Payment.objects.get(id=payment_response.data['id']).status == 'approved'


@pytest.mark.django_db
def test_resident_can_manage_own_reservations_and_overlap_is_blocked():
    client = APIClient()

    resident = User.objects.create_user(email='reserva@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)
    condominium = Condominium.objects.create(name='Condo Reserva', address='Calle 10')
    unit = Unit.objects.create(condominium=condominium, number='801')
    space = CommonSpace.objects.create(condominium=condominium, name='Quincho A', space_type='quincho', block_duration=60)

    ResidentAssignment.objects.create(user=resident, unit=unit, start_date='2026-01-01', is_primary=True)

    client.force_authenticate(user=resident)
    create_response = client.post(
        '/api/v1/billing/reservations/',
        {
            'common_space': space.id,
            'reservation_date': '2026-08-15',
            'start_time': '18:00',
            'end_time': '20:00',
        },
        format='json',
    )

    assert create_response.status_code == 201
    assert create_response.data['status'] == Reservation.Status.PENDING
    assert create_response.data['user'] == resident.id

    overlap_response = client.post(
        '/api/v1/billing/reservations/',
        {
            'common_space': space.id,
            'reservation_date': '2026-08-15',
            'start_time': '19:00',
            'end_time': '21:00',
        },
        format='json',
    )

    assert overlap_response.status_code == 400
    assert 'start_time' in overlap_response.data


@pytest.mark.django_db
def test_admin_can_filter_reservations_by_condominium():
    client = APIClient()
    admin = User.objects.create_user(email='adminfiltro@sgc.cl', password='SgcSecure2026!', role=User.Role.ADMIN)
    resident = User.objects.create_user(email='resfiltro@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)

    condo_a = Condominium.objects.create(name='Condo A', address='A')
    condo_b = Condominium.objects.create(name='Condo B', address='B')
    Unit.objects.create(condominium=condo_a, number='101')
    Unit.objects.create(condominium=condo_b, number='202')
    space_a = CommonSpace.objects.create(condominium=condo_a, name='Piscina A', space_type='piscina')
    space_b = CommonSpace.objects.create(condominium=condo_b, name='Piscina B', space_type='piscina')

    Reservation.objects.create(common_space=space_a, user=resident, reservation_date='2026-09-01', start_time='10:00', end_time='11:00')
    Reservation.objects.create(common_space=space_b, user=resident, reservation_date='2026-09-02', start_time='12:00', end_time='13:00')

    client.force_authenticate(user=admin)
    response = client.get(f'/api/v1/billing/reservations/?condominium={condo_a.id}')

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['condominium_id'] == condo_a.id


@pytest.mark.django_db
def test_conserje_can_approve_reservation():
    client = APIClient()
    conserje = User.objects.create_user(email='conserje@sgc.cl', password='SgcSecure2026!', role=User.Role.CONSERJE)
    resident = User.objects.create_user(email='res2@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)

    condo = Condominium.objects.create(name='Condo C', address='C')
    space = CommonSpace.objects.create(condominium=condo, name='Sala Multiuso', space_type='sala')
    reservation = Reservation.objects.create(
        common_space=space,
        user=resident,
        reservation_date='2026-10-10',
        start_time='09:00',
        end_time='10:00',
        status=Reservation.Status.PENDING,
    )

    client.force_authenticate(user=conserje)
    response = client.patch(
        f'/api/v1/billing/reservations/{reservation.id}/',
        {'status': Reservation.Status.APPROVED},
        format='json',
    )

    assert response.status_code == 200
    reservation.refresh_from_db()
    assert reservation.status == Reservation.Status.APPROVED
