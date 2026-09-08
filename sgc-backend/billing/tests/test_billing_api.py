import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from billing.models import (
    BillingPeriod,
    CommonExpense,
    CommonSpace,
    Condominium,
    CondominiumMembership,
    MeterReading,
    Payment,
    Reservation,
    ResidentAssignment,
    Unit,
)
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
    CondominiumMembership.objects.create(
        user=admin,
        condominium=condominium,
        role=CondominiumMembership.Role.ADMIN,
    )
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
    CondominiumMembership.objects.create(
        user=admin,
        condominium=condo_a,
        role=CondominiumMembership.Role.ADMIN,
    )
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
    CondominiumMembership.objects.create(
        user=conserje,
        condominium=condo,
        role=CondominiumMembership.Role.CONSERJE,
    )
    unit = Unit.objects.create(condominium=condo, number='301')
    ResidentAssignment.objects.create(
        user=resident,
        unit=unit,
        start_date='2026-01-01',
        is_primary=True,
    )
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


@pytest.mark.django_db
def test_admin_cannot_access_resources_from_another_condominium():
    client = APIClient()
    admin = User.objects.create_user(
        email='admin-aislado@sgc.cl',
        password='SgcSecure2026!',
        role=User.Role.ADMIN,
    )
    condo_allowed = Condominium.objects.create(name='Condo Permitido', address='A')
    condo_blocked = Condominium.objects.create(name='Condo Bloqueado', address='B')
    CondominiumMembership.objects.create(
        user=admin,
        condominium=condo_allowed,
        role=CondominiumMembership.Role.ADMIN,
    )
    unit_allowed = Unit.objects.create(condominium=condo_allowed, number='101')
    unit_blocked = Unit.objects.create(condominium=condo_blocked, number='202')
    period_allowed = BillingPeriod.objects.create(
        condominium=condo_allowed,
        start_date='2026-11-01',
        end_date='2026-11-30',
    )
    period_blocked = BillingPeriod.objects.create(
        condominium=condo_blocked,
        start_date='2026-11-01',
        end_date='2026-11-30',
    )
    expense_allowed = CommonExpense.objects.create(
        period=period_allowed,
        unit=unit_allowed,
        fixed_amount=50000,
    )
    expense_blocked = CommonExpense.objects.create(
        period=period_blocked,
        unit=unit_blocked,
        fixed_amount=50000,
    )
    payment_allowed = Payment.objects.create(unit=unit_allowed, period=period_allowed, amount=50000)
    payment_blocked = Payment.objects.create(unit=unit_blocked, period=period_blocked, amount=50000)
    space_allowed = CommonSpace.objects.create(
        condominium=condo_allowed,
        name='Quincho Permitido',
        space_type='quincho',
    )
    space_blocked = CommonSpace.objects.create(
        condominium=condo_blocked,
        name='Quincho Bloqueado',
        space_type='quincho',
    )
    resident = User.objects.create_user(
        email='residente-aislado@sgc.cl',
        password='SgcSecure2026!',
        role=User.Role.RESIDENTE,
    )
    reservation_allowed = Reservation.objects.create(
        common_space=space_allowed,
        user=resident,
        reservation_date='2026-11-15',
        start_time='10:00',
        end_time='11:00',
    )
    reservation_blocked = Reservation.objects.create(
        common_space=space_blocked,
        user=resident,
        reservation_date='2026-11-15',
        start_time='10:00',
        end_time='11:00',
    )

    client.force_authenticate(user=admin)

    condominiums_response = client.get('/api/v1/billing/condominiums/')
    assert condominiums_response.status_code == 200
    assert [item['id'] for item in condominiums_response.data] == [condo_allowed.id]

    units_response = client.get('/api/v1/billing/units/')
    assert units_response.status_code == 200
    assert [item['id'] for item in units_response.data] == [unit_allowed.id]

    nested_allowed_response = client.get(f'/api/v1/condominiums/{condo_allowed.id}/units/')
    assert nested_allowed_response.status_code == 200
    assert [item['id'] for item in nested_allowed_response.data] == [unit_allowed.id]

    nested_blocked_response = client.get(f'/api/v1/condominiums/{condo_blocked.id}/units/')
    assert nested_blocked_response.status_code == 404

    blocked_detail_response = client.get(f'/api/v1/billing/units/{unit_blocked.id}/')
    assert blocked_detail_response.status_code == 404

    scoped_resources = (
        ('billing-periods', period_allowed, period_blocked),
        ('common-expenses', expense_allowed, expense_blocked),
        ('payments', payment_allowed, payment_blocked),
        ('common-spaces', space_allowed, space_blocked),
        ('reservations', reservation_allowed, reservation_blocked),
    )
    for endpoint, allowed_resource, blocked_resource in scoped_resources:
        list_response = client.get(f'/api/v1/billing/{endpoint}/')
        detail_response = client.get(f'/api/v1/billing/{endpoint}/{blocked_resource.id}/')
        nested_response = client.get(f'/api/v1/condominiums/{condo_blocked.id}/{endpoint}/')

        assert list_response.status_code == 200
        assert {item['id'] for item in list_response.data} == {allowed_resource.id}
        assert detail_response.status_code == 404
        assert nested_response.status_code == 404

    blocked_create_response = client.post(
        '/api/v1/billing/units/',
        {'condominium': condo_blocked.id, 'number': '203'},
        format='json',
    )
    assert blocked_create_response.status_code == 400
    assert 'condominium' in blocked_create_response.data


@pytest.mark.django_db
def test_membership_role_must_match_user_role_to_grant_access():
    client = APIClient()
    admin = User.objects.create_user(
        email='admin-rol-invalido@sgc.cl',
        password='SgcSecure2026!',
        role=User.Role.ADMIN,
    )
    condominium = Condominium.objects.create(name='Condo Rol Invalido', address='A')
    CondominiumMembership.objects.create(
        user=admin,
        condominium=condominium,
        role=CondominiumMembership.Role.CONSERJE,
    )
    Unit.objects.create(condominium=condominium, number='501')
    client.force_authenticate(user=admin)

    list_response = client.get('/api/v1/billing/condominiums/')
    nested_response = client.get(f'/api/v1/condominiums/{condominium.id}/units/')

    assert list_response.status_code == 200
    assert list_response.data == []
    assert nested_response.status_code == 404


@pytest.mark.django_db
def test_meter_readings_enforce_tenant_and_role_boundaries():
    client = APIClient()
    conserje = User.objects.create_user(
        email='conserje-aislado@sgc.cl',
        password='SgcSecure2026!',
        role=User.Role.CONSERJE,
    )
    resident = User.objects.create_user(
        email='residente-medidor@sgc.cl',
        password='SgcSecure2026!',
        role=User.Role.RESIDENTE,
    )
    condo_allowed = Condominium.objects.create(name='Condo Medidor A', address='A')
    condo_blocked = Condominium.objects.create(name='Condo Medidor B', address='B')
    unit_allowed = Unit.objects.create(condominium=condo_allowed, number='301')
    unit_blocked = Unit.objects.create(condominium=condo_blocked, number='401')
    CondominiumMembership.objects.create(
        user=conserje,
        condominium=condo_allowed,
        role=CondominiumMembership.Role.CONSERJE,
    )
    ResidentAssignment.objects.create(
        user=resident,
        unit=unit_allowed,
        start_date='2026-01-01',
        is_primary=True,
    )
    reading_allowed = MeterReading.objects.create(
        unit=unit_allowed,
        reading_type=MeterReading.Type.WATER,
        previous_reading=10,
        current_reading=15,
    )
    MeterReading.objects.create(
        unit=unit_blocked,
        reading_type=MeterReading.Type.WATER,
        previous_reading=20,
        current_reading=25,
    )

    client.force_authenticate(user=conserje)
    conserje_list_response = client.get('/api/v1/billing/meter-readings/')
    assert conserje_list_response.status_code == 200
    assert [item['id'] for item in conserje_list_response.data] == [reading_allowed.id]

    blocked_write_response = client.post(
        '/api/v1/billing/meter-readings/',
        {
            'unit': unit_blocked.id,
            'type': MeterReading.Type.WATER,
            'previousReading': '25.00',
            'currentReading': '30.00',
        },
        format='json',
    )
    assert blocked_write_response.status_code == 400
    assert 'unit' in blocked_write_response.data

    client.force_authenticate(user=resident)
    resident_list_response = client.get('/api/v1/billing/meter-readings/')
    assert resident_list_response.status_code == 200
    assert [item['id'] for item in resident_list_response.data] == [reading_allowed.id]

    resident_write_response = client.post(
        '/api/v1/billing/meter-readings/',
        {
            'unit': unit_allowed.id,
            'type': MeterReading.Type.WATER,
            'previousReading': '15.00',
            'currentReading': '20.00',
        },
        format='json',
    )
    assert resident_write_response.status_code == 403
