from datetime import date, time
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from billing.models import (
    BillingPeriod,
    CommonExpense,
    CommonSpace,
    Condominium,
    Payment,
    Reservation as BillingReservation,
    ResidentAssignment,
    Unit,
)
from reservations.models import CommonSpace as LegacyCommonSpace
from reservations.models import Reservation as LegacyReservation
from users.models import User


DEFAULT_PASSWORD = "SgcSecure2026!"


class Command(BaseCommand):
    help = "Genera datos de prueba para usuarios, gastos comunes y reservas."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Borra los datos semilla antes de volver a crearlos.",
        )
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help=f"Contrasena comun para usuarios seed (default: {DEFAULT_PASSWORD}).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]
        self._validate_seed_password(password)

        if options["reset"]:
            self._reset_seed_data()
            self.stdout.write(self.style.WARNING("Datos previos de seed eliminados."))

        users = self._seed_users(password=password)
        legacy_data = self._seed_legacy_reservations(users=users)
        billing_data = self._seed_billing(users=users)

        self.stdout.write(self.style.SUCCESS("Seed completado correctamente."))
        self.stdout.write(f"Usuarios creados/actualizados: {len(users)}")
        self.stdout.write(f"Reservas legacy creadas/actualizadas: {legacy_data['reservations_count']}")
        self.stdout.write(f"Condominios activos seed: {billing_data['condominiums_count']}")
        self.stdout.write(f"Reservas billing creadas/actualizadas: {billing_data['reservations_count']}")
        self.stdout.write(f"Contrasena comun: {password}")

    def _validate_seed_password(self, password):
        try:
            validate_password(password)
        except ValidationError as exc:
            messages = " ".join(exc.messages)
            raise CommandError(f"Password invalida para seed: {messages}") from exc

    def _seed_users(self, password):
        users_seed = [
            {
                "email": "superadmin@sgc.cl",
                "rut": "11.111.111-1",
                "first_name": "Sofia",
                "last_name": "Superadmin",
                "role": User.Role.SUPERADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "email": "admin@sgc.cl",
                "rut": "22.222.222-2",
                "first_name": "Adrian",
                "last_name": "Admin",
                "role": User.Role.ADMIN,
            },
            {
                "email": "conserje@sgc.cl",
                "rut": "33.333.333-3",
                "first_name": "Camila",
                "last_name": "Conserje",
                "role": User.Role.CONSERJE,
            },
            {
                "email": "residente1@sgc.cl",
                "rut": "44.444.444-4",
                "first_name": "Ricardo",
                "last_name": "Residente",
                "role": User.Role.RESIDENTE,
            },
            {
                "email": "residente2@sgc.cl",
                "rut": "55.555.555-5",
                "first_name": "Rebeca",
                "last_name": "Residente",
                "role": User.Role.RESIDENTE,
            },
            {
                "email": "residente3@sgc.cl",
                "rut": "66.666.666-6",
                "first_name": "Rafael",
                "last_name": "Residente",
                "role": User.Role.RESIDENTE,
            },
            {
                "email": "residente4@sgc.cl",
                "rut": "77.777.777-7",
                "first_name": "Rocio",
                "last_name": "Residente",
                "role": User.Role.RESIDENTE,
            },
            {
                "email": "residente5@sgc.cl",
                "rut": "88.888.888-8",
                "first_name": "Renato",
                "last_name": "Residente",
                "role": User.Role.RESIDENTE,
            },
            {
                "email": "conserje2@sgc.cl",
                "rut": "99.999.999-9",
                "first_name": "Carlos",
                "last_name": "Conserje",
                "role": User.Role.CONSERJE,
            },
        ]

        users = {}
        for payload in users_seed:
            email = payload["email"]
            defaults = payload.copy()
            defaults.pop("email")

            user, _ = User.objects.update_or_create(
                email=email,
                defaults=defaults,
            )
            user.set_password(password)
            user.save(update_fields=["password"])
            users[email] = user

        return users

    def _seed_legacy_reservations(self, users):
        pool, _ = LegacyCommonSpace.objects.update_or_create(
            code=LegacyCommonSpace.Code.POOL,
            defaults={"name": "Piscina", "capacity": 12, "is_active": True},
        )
        multi_use_room, _ = LegacyCommonSpace.objects.update_or_create(
            code=LegacyCommonSpace.Code.MULTI_USE_ROOM,
            defaults={"name": "Sala Multiuso", "capacity": 25, "is_active": True},
        )
        gym, _ = LegacyCommonSpace.objects.update_or_create(
            code=LegacyCommonSpace.Code.GYM,
            defaults={"name": "Gimnasio", "capacity": 15, "is_active": True},
        )

        reservations_seed = [
            {
                "common_space": pool,
                "requester": users["residente1@sgc.cl"],
                "requester_name": "Ricardo Residente",
                "requester_role": User.Role.RESIDENTE,
                "reservation_date": date(2026, 4, 24),
                "start_time": time(18, 0),
                "end_time": time(20, 0),
                "status": LegacyReservation.Status.PENDING,
                "notes": "Cumpleanos familiar",
                "extra_data": {"guestCount": 8},
            },
            {
                "common_space": multi_use_room,
                "requester": users["residente2@sgc.cl"],
                "requester_name": "Rebeca Residente",
                "requester_role": User.Role.RESIDENTE,
                "reservation_date": date(2026, 4, 26),
                "start_time": time(15, 0),
                "end_time": time(17, 0),
                "status": LegacyReservation.Status.APPROVED,
                "notes": "Reunion de comite",
                "extra_data": {"requiresProjector": True},
            },
            {
                "common_space": gym,
                "requester": users["residente3@sgc.cl"],
                "requester_name": "Rafael Residente",
                "requester_role": User.Role.RESIDENTE,
                "reservation_date": date(2026, 4, 27),
                "start_time": time(7, 0),
                "end_time": time(8, 0),
                "status": LegacyReservation.Status.REJECTED,
                "notes": "Mantenimiento preventivo",
                "extra_data": {"reason": "Horario bloqueado"},
            },
            {
                "common_space": multi_use_room,
                "requester": users["residente4@sgc.cl"],
                "requester_name": "Rocio Residente",
                "requester_role": User.Role.RESIDENTE,
                "reservation_date": date(2026, 4, 18),
                "start_time": time(19, 0),
                "end_time": time(22, 0),
                "status": LegacyReservation.Status.APPROVED,
                "notes": "Celebracion familiar",
                "extra_data": {"guestCount": 16, "requiresProjector": False},
            },
            {
                "common_space": pool,
                "requester": users["residente5@sgc.cl"],
                "requester_name": "Renato Residente",
                "requester_role": User.Role.RESIDENTE,
                "reservation_date": date(2026, 3, 29),
                "start_time": time(11, 0),
                "end_time": time(13, 0),
                "status": LegacyReservation.Status.APPROVED,
                "notes": "Invitados de fin de semana",
                "extra_data": {"guestCount": 10},
            },
            {
                "common_space": gym,
                "requester": users["residente2@sgc.cl"],
                "requester_name": "Rebeca Residente",
                "requester_role": User.Role.RESIDENTE,
                "reservation_date": date(2026, 3, 21),
                "start_time": time(8, 0),
                "end_time": time(9, 0),
                "status": LegacyReservation.Status.PENDING,
                "notes": "Entrenamiento grupal",
                "extra_data": {"guestCount": 4},
            },
        ]

        for payload in reservations_seed:
            LegacyReservation.objects.update_or_create(
                common_space=payload["common_space"],
                requester=payload["requester"],
                reservation_date=payload["reservation_date"],
                start_time=payload["start_time"],
                defaults=payload,
            )

        return {"reservations_count": len(reservations_seed)}

    def _seed_billing(self, users):
        condo_central, _ = Condominium.objects.update_or_create(
            name="Condominio Central",
            defaults={
                "address": "Av. Providencia 1000",
                "city": "Santiago",
                "latitude": Decimal("-33.4255200"),
                "longitude": Decimal("-70.6158400"),
                "is_active": True,
            },
        )
        condo_oriente, _ = Condominium.objects.update_or_create(
            name="Condominio Oriente",
            defaults={
                "address": "Av. Apoquindo 3500",
                "city": "Santiago",
                "latitude": Decimal("-33.4148600"),
                "longitude": Decimal("-70.5762800"),
                "is_active": True,
            },
        )

        unit_101, _ = Unit.objects.update_or_create(
            condominium=condo_central,
            number="101",
            defaults={"floor": 1, "proration_factor": Decimal("1.0000"), "is_active": True},
        )
        unit_102, _ = Unit.objects.update_or_create(
            condominium=condo_central,
            number="102",
            defaults={"floor": 1, "proration_factor": Decimal("1.1000"), "is_active": True},
        )
        unit_801, _ = Unit.objects.update_or_create(
            condominium=condo_oriente,
            number="801",
            defaults={"floor": 8, "proration_factor": Decimal("1.3000"), "is_active": True},
        )
        unit_103, _ = Unit.objects.update_or_create(
            condominium=condo_central,
            number="103",
            defaults={"floor": 1, "proration_factor": Decimal("0.9800"), "is_active": True},
        )
        unit_802, _ = Unit.objects.update_or_create(
            condominium=condo_oriente,
            number="802",
            defaults={"floor": 8, "proration_factor": Decimal("1.1800"), "is_active": True},
        )

        ResidentAssignment.objects.update_or_create(
            user=users["residente1@sgc.cl"],
            unit=unit_101,
            start_date=date(2026, 1, 1),
            defaults={
                "is_owner": True,
                "is_primary": True,
                "is_active": True,
                "end_date": None,
            },
        )
        ResidentAssignment.objects.update_or_create(
            user=users["residente2@sgc.cl"],
            unit=unit_102,
            start_date=date(2026, 1, 1),
            defaults={
                "is_owner": False,
                "is_primary": True,
                "is_active": True,
                "end_date": None,
            },
        )
        ResidentAssignment.objects.update_or_create(
            user=users["residente3@sgc.cl"],
            unit=unit_801,
            start_date=date(2026, 2, 1),
            defaults={
                "is_owner": True,
                "is_primary": True,
                "is_active": True,
                "end_date": None,
            },
        )
        ResidentAssignment.objects.update_or_create(
            user=users["residente4@sgc.cl"],
            unit=unit_103,
            start_date=date(2025, 10, 1),
            defaults={
                "is_owner": False,
                "is_primary": True,
                "is_active": True,
                "end_date": None,
            },
        )
        ResidentAssignment.objects.update_or_create(
            user=users["residente5@sgc.cl"],
            unit=unit_802,
            start_date=date(2025, 11, 15),
            defaults={
                "is_owner": True,
                "is_primary": True,
                "is_active": True,
                "end_date": None,
            },
        )

        periods_seed = [
            {
                "condominium": condo_central,
                "start_date": date(2026, 2, 1),
                "end_date": date(2026, 2, 28),
                "status": BillingPeriod.Status.CLOSED,
                "close_date": date(2026, 3, 5),
            },
            {
                "condominium": condo_central,
                "start_date": date(2026, 3, 1),
                "end_date": date(2026, 3, 31),
                "status": BillingPeriod.Status.CLOSED,
                "close_date": date(2026, 4, 4),
            },
            {
                "condominium": condo_central,
                "start_date": date(2026, 4, 1),
                "end_date": date(2026, 4, 30),
                "status": BillingPeriod.Status.GENERATED,
                "close_date": date(2026, 5, 3),
            },
            {
                "condominium": condo_oriente,
                "start_date": date(2026, 3, 1),
                "end_date": date(2026, 3, 31),
                "status": BillingPeriod.Status.CLOSED,
                "close_date": date(2026, 4, 6),
            },
            {
                "condominium": condo_oriente,
                "start_date": date(2026, 4, 1),
                "end_date": date(2026, 4, 30),
                "status": BillingPeriod.Status.GENERATED,
                "close_date": date(2026, 5, 6),
            },
            {
                "condominium": condo_oriente,
                "start_date": date(2026, 5, 1),
                "end_date": date(2026, 5, 31),
                "status": BillingPeriod.Status.OPEN,
                "close_date": None,
            },
        ]
        periods = {}
        for payload in periods_seed:
            period, _ = BillingPeriod.objects.update_or_create(
                condominium=payload["condominium"],
                start_date=payload["start_date"],
                end_date=payload["end_date"],
                defaults={"status": payload["status"], "close_date": payload["close_date"]},
            )
            periods[(payload["condominium"].name, payload["start_date"])] = period

        expenses_seed = [
            {"period": periods[("Condominio Central", date(2026, 2, 1))], "unit": unit_101, "fixed": "80000.00", "variable": "9000.00", "status": CommonExpense.Status.PAID, "generated_at": date(2026, 2, 28)},
            {"period": periods[("Condominio Central", date(2026, 2, 1))], "unit": unit_102, "fixed": "89000.00", "variable": "12000.00", "status": CommonExpense.Status.PAID, "generated_at": date(2026, 2, 28)},
            {"period": periods[("Condominio Central", date(2026, 2, 1))], "unit": unit_103, "fixed": "78000.00", "variable": "8500.00", "status": CommonExpense.Status.PAID, "generated_at": date(2026, 2, 28)},
            {"period": periods[("Condominio Central", date(2026, 3, 1))], "unit": unit_101, "fixed": "84000.00", "variable": "11000.00", "status": CommonExpense.Status.PAID, "generated_at": date(2026, 3, 31)},
            {"period": periods[("Condominio Central", date(2026, 3, 1))], "unit": unit_102, "fixed": "91000.00", "variable": "14000.00", "status": CommonExpense.Status.PARTIAL, "generated_at": date(2026, 3, 31)},
            {"period": periods[("Condominio Central", date(2026, 3, 1))], "unit": unit_103, "fixed": "79000.00", "variable": "10000.00", "status": CommonExpense.Status.PAID, "generated_at": date(2026, 3, 31)},
            {"period": periods[("Condominio Central", date(2026, 4, 1))], "unit": unit_101, "fixed": "85000.00", "variable": "12000.00", "status": CommonExpense.Status.PENDING, "generated_at": date(2026, 4, 30)},
            {"period": periods[("Condominio Central", date(2026, 4, 1))], "unit": unit_102, "fixed": "92000.00", "variable": "15000.00", "status": CommonExpense.Status.PARTIAL, "generated_at": date(2026, 4, 30)},
            {"period": periods[("Condominio Central", date(2026, 4, 1))], "unit": unit_103, "fixed": "81000.00", "variable": "11000.00", "status": CommonExpense.Status.PAID, "generated_at": date(2026, 4, 30)},
            {"period": periods[("Condominio Oriente", date(2026, 3, 1))], "unit": unit_801, "fixed": "106000.00", "variable": "9000.00", "status": CommonExpense.Status.PAID, "generated_at": date(2026, 3, 31)},
            {"period": periods[("Condominio Oriente", date(2026, 3, 1))], "unit": unit_802, "fixed": "98000.00", "variable": "7000.00", "status": CommonExpense.Status.PAID, "generated_at": date(2026, 3, 31)},
            {"period": periods[("Condominio Oriente", date(2026, 4, 1))], "unit": unit_801, "fixed": "108000.00", "variable": "8500.00", "status": CommonExpense.Status.PAID, "generated_at": date(2026, 4, 30)},
            {"period": periods[("Condominio Oriente", date(2026, 4, 1))], "unit": unit_802, "fixed": "99500.00", "variable": "7600.00", "status": CommonExpense.Status.PARTIAL, "generated_at": date(2026, 4, 30)},
            {"period": periods[("Condominio Oriente", date(2026, 5, 1))], "unit": unit_801, "fixed": "110000.00", "variable": "8000.00", "status": CommonExpense.Status.PAID, "generated_at": timezone.localdate()},
            {"period": periods[("Condominio Oriente", date(2026, 5, 1))], "unit": unit_802, "fixed": "100000.00", "variable": "9500.00", "status": CommonExpense.Status.PENDING, "generated_at": timezone.localdate()},
        ]
        for item in expenses_seed:
            CommonExpense.objects.update_or_create(
                period=item["period"],
                unit=item["unit"],
                defaults={
                    "fixed_amount": Decimal(item["fixed"]),
                    "variable_amount": Decimal(item["variable"]),
                    "status": item["status"],
                    "generated_at": item["generated_at"],
                },
            )

        payments_seed = [
            {"unit": unit_101, "period": periods[("Condominio Central", date(2026, 2, 1))], "amount": "89000.00", "payment_date": date(2026, 3, 2), "method": Payment.Method.TRANSFER, "status": Payment.Status.APPROVED, "validation_date": date(2026, 3, 3)},
            {"unit": unit_102, "period": periods[("Condominio Central", date(2026, 2, 1))], "amount": "101000.00", "payment_date": date(2026, 3, 4), "method": Payment.Method.CARD, "status": Payment.Status.APPROVED, "validation_date": date(2026, 3, 5)},
            {"unit": unit_103, "period": periods[("Condominio Central", date(2026, 2, 1))], "amount": "86500.00", "payment_date": date(2026, 3, 6), "method": Payment.Method.TRANSFER, "status": Payment.Status.APPROVED, "validation_date": date(2026, 3, 6)},
            {"unit": unit_102, "period": periods[("Condominio Central", date(2026, 4, 1))], "amount": "50000.00", "payment_date": date(2026, 4, 20), "method": Payment.Method.TRANSFER, "status": Payment.Status.PENDING, "validation_date": None},
            {"unit": unit_801, "period": periods[("Condominio Oriente", date(2026, 5, 1))], "amount": "118000.00", "payment_date": date(2026, 5, 18), "method": Payment.Method.CARD, "status": Payment.Status.APPROVED, "validation_date": date(2026, 5, 19)},
            {"unit": unit_802, "period": periods[("Condominio Oriente", date(2026, 4, 1))], "amount": "53000.00", "payment_date": date(2026, 5, 8), "method": Payment.Method.TRANSFER, "status": Payment.Status.PENDING, "validation_date": None},
        ]
        for item in payments_seed:
            Payment.objects.update_or_create(
                unit=item["unit"],
                period=item["period"],
                amount=Decimal(item["amount"]),
                payment_date=item["payment_date"],
                defaults={
                    "payment_method": item["method"],
                    "status": item["status"],
                    "validation_date": item["validation_date"],
                },
            )

        quincho_a, _ = CommonSpace.objects.update_or_create(
            condominium=condo_central,
            name="Quincho A",
            defaults={"space_type": "quincho", "block_duration": 60, "is_active": True},
        )
        sala_multiuso, _ = CommonSpace.objects.update_or_create(
            condominium=condo_oriente,
            name="Sala Multiuso",
            defaults={"space_type": "sala", "block_duration": 60, "is_active": True},
        )
        gimnasio_oriente, _ = CommonSpace.objects.update_or_create(
            condominium=condo_oriente,
            name="Gimnasio Oriente",
            defaults={"space_type": "gym", "block_duration": 60, "is_active": True},
        )

        billing_reservations_seed = [
            {
                "common_space": quincho_a,
                "user": users["residente1@sgc.cl"],
                "reservation_date": date(2026, 5, 3),
                "start_time": time(20, 0),
                "end_time": time(22, 0),
                "status": BillingReservation.Status.PENDING,
            },
            {
                "common_space": sala_multiuso,
                "user": users["residente3@sgc.cl"],
                "reservation_date": date(2026, 5, 5),
                "start_time": time(10, 0),
                "end_time": time(12, 0),
                "status": BillingReservation.Status.APPROVED,
            },
            {
                "common_space": quincho_a,
                "user": users["residente4@sgc.cl"],
                "reservation_date": date(2026, 4, 20),
                "start_time": time(19, 0),
                "end_time": time(21, 0),
                "status": BillingReservation.Status.APPROVED,
            },
            {
                "common_space": sala_multiuso,
                "user": users["residente2@sgc.cl"],
                "reservation_date": date(2026, 3, 30),
                "start_time": time(18, 0),
                "end_time": time(20, 0),
                "status": BillingReservation.Status.REJECTED,
            },
            {
                "common_space": gimnasio_oriente,
                "user": users["residente5@sgc.cl"],
                "reservation_date": date(2026, 5, 7),
                "start_time": time(7, 0),
                "end_time": time(8, 0),
                "status": BillingReservation.Status.PENDING,
            },
        ]

        for payload in billing_reservations_seed:
            BillingReservation.objects.update_or_create(
                common_space=payload["common_space"],
                user=payload["user"],
                reservation_date=payload["reservation_date"],
                start_time=payload["start_time"],
                defaults=payload,
            )

        return {
            "condominiums_count": 2,
            "reservations_count": len(billing_reservations_seed),
        }

    def _reset_seed_data(self):
        billing_emails = [
            "superadmin@sgc.cl",
            "admin@sgc.cl",
            "conserje@sgc.cl",
            "residente1@sgc.cl",
            "residente2@sgc.cl",
            "residente3@sgc.cl",
            "residente4@sgc.cl",
            "residente5@sgc.cl",
            "conserje2@sgc.cl",
        ]

        BillingReservation.objects.filter(user__email__in=billing_emails).delete()
        LegacyReservation.objects.filter(requester__email__in=billing_emails).delete()
        Payment.objects.filter(unit__number__in=["101", "102", "103", "801", "802"]).delete()
        CommonExpense.objects.filter(unit__number__in=["101", "102", "103", "801", "802"]).delete()
        ResidentAssignment.objects.filter(user__email__in=billing_emails).delete()
        Unit.objects.filter(number__in=["101", "102", "103", "801", "802"]).delete()
        BillingPeriod.objects.filter(
            start_date__in=[date(2026, 2, 1), date(2026, 3, 1), date(2026, 4, 1), date(2026, 5, 1)],
            end_date__in=[date(2026, 2, 28), date(2026, 3, 31), date(2026, 4, 30), date(2026, 5, 31)],
        ).delete()
        CommonSpace.objects.filter(name__in=["Quincho A", "Sala Multiuso", "Gimnasio Oriente"]).delete()
        Condominium.objects.filter(name__in=["Condominio Central", "Condominio Oriente"]).delete()
        LegacyCommonSpace.objects.filter(code__in=[LegacyCommonSpace.Code.POOL, LegacyCommonSpace.Code.MULTI_USE_ROOM, LegacyCommonSpace.Code.GYM]).delete()
        User.objects.filter(email__in=billing_emails).delete()
