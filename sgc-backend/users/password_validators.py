import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class ContainsLetterAndNumberValidator:
    def validate(self, password, user=None):
        if not re.search(r"[A-Za-z]", password or "") or not re.search(r"\d", password or ""):
            raise ValidationError(
                _("La contrasena debe contener al menos una letra y un numero."),
                code="password_no_letter_or_number",
            )

    def get_help_text(self):
        return _("Tu contrasena debe contener al menos una letra y un numero.")
