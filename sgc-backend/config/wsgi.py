import os

from django.core.wsgi import get_wsgi_application

from .environment import get_settings_module

if 'DJANGO_SETTINGS_MODULE' not in os.environ:
    os.environ['DJANGO_SETTINGS_MODULE'] = get_settings_module()

application = get_wsgi_application()
