from django.contrib import admin

from .models import (
    BillingPeriod,
    CommonExpense,
    CommonSpace,
    Condominium,
    Payment,
    PaymentReceipt,
    Reservation,
    ResidentAssignment,
    Unit,
)


admin.site.register(Condominium)
admin.site.register(Unit)
admin.site.register(ResidentAssignment)
admin.site.register(BillingPeriod)
admin.site.register(CommonExpense)
admin.site.register(Payment)
admin.site.register(PaymentReceipt)
admin.site.register(CommonSpace)
admin.site.register(Reservation)
