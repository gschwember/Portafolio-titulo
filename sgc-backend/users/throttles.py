import hashlib

from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        email = str(request.data.get('email', '')).strip().lower()
        email_digest = hashlib.sha256(email.encode('utf-8')).hexdigest()
        identifier = f'{self.get_ident(request)}:{email_digest}'
        return self.cache_format % {'scope': self.scope, 'ident': identifier}
