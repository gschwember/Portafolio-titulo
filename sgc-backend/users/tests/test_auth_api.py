import pytest
from rest_framework.test import APIClient

from users.models import User


@pytest.mark.django_db
def test_register_creates_pending_resident_user():
    client = APIClient()
    password = 'SgcSecure2026!'

    response = client.post(
        '/api/v1/auth/register',
        {
            'email': 'nuevo@correo.com',
            'password': password,
            'password_confirmation': password,
            'first_name': 'Nuevo',
            'last_name': 'Usuario',
        },
        format='json',
    )

    assert response.status_code == 201
    assert response.data['user']['email'] == 'nuevo@correo.com'
    assert response.data['user']['role'] == 'residente'
    assert response.data['user']['is_active'] is False
    assert 'access' not in response.data
    assert 'refresh' not in response.data
    assert User.objects.filter(email='nuevo@correo.com', role='residente', is_active=False).exists()


@pytest.mark.django_db
def test_login_returns_tokens_for_valid_credentials():
    client = APIClient()
    password = 'SgcSecure2026!'
    User.objects.create_user(email='login@correo.com', password=password, first_name='Login', role='conserje')

    response = client.post(
        '/api/v1/auth/login',
        {'email': 'login@correo.com', 'password': password},
        format='json',
    )

    assert response.status_code == 200
    assert response.data['user']['email'] == 'login@correo.com'
    assert response.data['user']['role'] == 'conserje'
    assert 'access' in response.data
    assert 'refresh' in response.data


@pytest.mark.django_db
def test_login_rejects_invalid_credentials():
    client = APIClient()
    User.objects.create_user(email='fail@correo.com', password='SgcSecure2026!')

    response = client.post(
        '/api/v1/auth/login',
        {'email': 'fail@correo.com', 'password': 'incorrecta'},
        format='json',
    )

    assert response.status_code == 400
    assert 'non_field_errors' in response.data or 'detail' in response.data
