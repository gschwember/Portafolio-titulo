import pytest
from rest_framework.test import APIClient

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
    User.objects.create_user(email='residente2@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)

    client.force_authenticate(user=admin)
    response = client.get('/api/v1/users/')

    assert response.status_code == 200
    assert len(response.data) >= 2


@pytest.mark.django_db
def test_resident_cannot_list_users():
    client = APIClient()
    resident = User.objects.create_user(email='residente@sgc.cl', password='SgcSecure2026!', role=User.Role.RESIDENTE)

    client.force_authenticate(user=resident)
    response = client.get('/api/v1/users/')

    assert response.status_code == 403
