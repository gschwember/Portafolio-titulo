import pytest
from django.conf import settings
from django.core.cache import cache
from django.test import override_settings
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
@override_settings(AUTH_REFRESH_COOKIE_SECURE=True, AUTH_REFRESH_COOKIE_SAMESITE='None')
def test_login_returns_access_token_and_sets_secure_refresh_cookie():
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
    assert 'refresh' not in response.data

    refresh_cookie = response.cookies[settings.AUTH_REFRESH_COOKIE_NAME]
    assert refresh_cookie['httponly'] is True
    assert refresh_cookie['secure'] is True
    assert refresh_cookie['samesite'] == 'None'
    assert refresh_cookie['path'] == settings.AUTH_REFRESH_COOKIE_PATH
    assert refresh_cookie.value


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


@pytest.mark.django_db
def test_refresh_uses_cookie_and_ignores_tokens_sent_in_body():
    client = APIClient()
    password = 'SgcSecure2026!'
    User.objects.create_user(email='refresh@correo.com', password=password, role='residente')
    login_response = client.post(
        '/api/v1/auth/login',
        {'email': 'refresh@correo.com', 'password': password},
        format='json',
    )
    raw_refresh_token = login_response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value

    refresh_response = client.post('/api/v1/auth/token/refresh', {}, format='json')
    body_only_client = APIClient()
    body_only_response = body_only_client.post(
        '/api/v1/auth/token/refresh',
        {'refresh': raw_refresh_token},
        format='json',
    )

    assert refresh_response.status_code == 200
    assert refresh_response.data['user']['email'] == 'refresh@correo.com'
    assert 'access' in refresh_response.data
    assert 'refresh' not in refresh_response.data
    assert body_only_response.status_code == 401


@pytest.mark.django_db
def test_logout_revokes_refresh_token_and_clears_cookie():
    client = APIClient()
    password = 'SgcSecure2026!'
    User.objects.create_user(email='logout@correo.com', password=password, role='residente')
    login_response = client.post(
        '/api/v1/auth/login',
        {'email': 'logout@correo.com', 'password': password},
        format='json',
    )
    raw_refresh_token = login_response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value

    logout_response = client.post('/api/v1/auth/logout', {}, format='json')
    replay_client = APIClient()
    replay_client.cookies[settings.AUTH_REFRESH_COOKIE_NAME] = raw_refresh_token
    replay_response = replay_client.post('/api/v1/auth/token/refresh', {}, format='json')

    assert logout_response.status_code == 204
    assert logout_response.cookies[settings.AUTH_REFRESH_COOKIE_NAME]['max-age'] == 0
    assert replay_response.status_code == 401


@pytest.mark.django_db
def test_cookie_auth_endpoints_reject_form_posts():
    client = APIClient()
    password = 'SgcSecure2026!'
    User.objects.create_user(email='csrf@correo.com', password=password, role='residente')
    client.post(
        '/api/v1/auth/login',
        {'email': 'csrf@correo.com', 'password': password},
        format='json',
    )

    refresh_form_response = client.post('/api/v1/auth/token/refresh', {'source': 'external-form'})
    logout_form_response = client.post('/api/v1/auth/logout', {'source': 'external-form'})
    valid_refresh_response = client.post('/api/v1/auth/token/refresh', {}, format='json')

    assert refresh_form_response.status_code == 415
    assert logout_form_response.status_code == 415
    assert valid_refresh_response.status_code == 200


@pytest.mark.django_db
def test_login_is_throttled_after_repeated_attempts():
    cache.clear()
    client = APIClient()
    User.objects.create_user(
        email='limite@correo.com',
        password='SgcSecure2026!',
        role='residente',
    )

    responses = [
        client.post(
            '/api/v1/auth/login',
            {'email': 'limite@correo.com', 'password': 'ClaveIncorrecta1'},
            format='json',
        )
        for _ in range(6)
    ]

    assert [response.status_code for response in responses[:5]] == [400] * 5
    assert responses[5].status_code == 429
    cache.clear()


@pytest.mark.django_db
def test_register_rejects_password_shorter_than_policy():
    client = APIClient()

    response = client.post(
        '/api/v1/auth/register',
        {
            'email': 'clave-corta@correo.com',
            'password': 'Clave123456',
            'password_confirmation': 'Clave123456',
            'first_name': 'Clave',
            'last_name': 'Corta',
        },
        format='json',
    )

    assert response.status_code == 400
    assert 'password' in response.data
