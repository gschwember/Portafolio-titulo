import os

from django.core.asgi import get_asgi_application

from .environment import get_settings_module

if 'DJANGO_SETTINGS_MODULE' not in os.environ:
    os.environ['DJANGO_SETTINGS_MODULE'] = get_settings_module()

application = get_asgi_application()
