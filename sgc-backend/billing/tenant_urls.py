from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BillingPeriodViewSet,
    CommonExpenseViewSet,
    CommonSpaceViewSet,
    CondominiumMembershipViewSet,
    MeterReadingViewSet,
    PaymentReceiptViewSet,
    PaymentViewSet,
    ReservationViewSet,
    ResidentAssignmentViewSet,
    UnitViewSet,
)


router = DefaultRouter()
router.register('members', CondominiumMembershipViewSet, basename='tenant-members')
router.register('units', UnitViewSet, basename='tenant-units')
router.register('resident-assignments', ResidentAssignmentViewSet, basename='tenant-resident-assignments')
router.register('billing-periods', BillingPeriodViewSet, basename='tenant-billing-periods')
router.register('common-expenses', CommonExpenseViewSet, basename='tenant-common-expenses')
router.register('payments', PaymentViewSet, basename='tenant-payments')
router.register('payment-receipts', PaymentReceiptViewSet, basename='tenant-payment-receipts')
router.register('common-spaces', CommonSpaceViewSet, basename='tenant-common-spaces')
router.register('reservations', ReservationViewSet, basename='tenant-reservations')
router.register('meter-readings', MeterReadingViewSet, basename='tenant-meter-readings')

urlpatterns = [
    path('', include(router.urls)),
]
