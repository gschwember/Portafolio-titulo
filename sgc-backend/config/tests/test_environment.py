import pytest

from config.environment import get_settings_module


def test_production_environment_selects_secure_settings(monkeypatch):
    monkeypatch.setenv('DJANGO_ENV', 'production')

    assert get_settings_module() == 'config.settings.prod'


def test_unknown_environment_is_rejected(monkeypatch):
    monkeypatch.setenv('DJANGO_ENV', 'unknown')

    with pytest.raises(RuntimeError, match='DJANGO_ENV debe ser'):
        get_settings_module()
