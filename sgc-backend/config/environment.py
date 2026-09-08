import os
from pathlib import Path

from dotenv import load_dotenv


SETTINGS_BY_ENVIRONMENT = {
    'dev': 'config.settings.dev',
    'development': 'config.settings.dev',
    'prod': 'config.settings.prod',
    'production': 'config.settings.prod',
}


def get_settings_module():
    load_dotenv(Path(__file__).resolve().parent.parent / '.env')
    environment = os.getenv('DJANGO_ENV', 'development').strip().lower()

    try:
        return SETTINGS_BY_ENVIRONMENT[environment]
    except KeyError as exc:
        supported = ', '.join(sorted(SETTINGS_BY_ENVIRONMENT))
        raise RuntimeError(
            f'DJANGO_ENV debe ser uno de estos valores: {supported}.'
        ) from exc
