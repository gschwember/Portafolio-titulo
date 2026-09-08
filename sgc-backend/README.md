# SGC Backend

Backend de SGC construido con Django + Django REST Framework.

Este directorio contiene la API REST y la lógica de negocio del monorepo SGC.

## Estado actual

Implementado:

- Settings por entorno (`base`, `dev`, `prod`).
- Usuario custom autenticado por email.
- JWT (SimpleJWT) para login seguro.
- Endpoints de auth versionados (`/api/v1/auth/*`).
- Membresias y aislamiento de datos por condominio.
- CORS y CSRF configurados para frontend local.
- Pruebas de autenticacion, permisos y aislamiento entre condominios.

## Stack

- Django
- Django REST Framework
- djangorestframework-simplejwt
- django-cors-headers
- pytest + pytest-django

## Estructura

```text
sgc-backend/
  config/
    settings/
      base.py
      dev.py
      prod.py
    api.py
    urls.py
  users/
    migrations/
    managers.py
    models.py
    serializers.py
    urls.py
    views.py
    tests/
  billing/
    access.py
    models.py
    serializers.py
    tenant_urls.py
    views.py
    tests/
  requirements/
    base.txt
    dev.txt
```

## Preparacion

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements\dev.txt
Copy-Item .env.example .env
```

## Migraciones y ejecucion

```powershell
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py runserver
```

## Endpoints disponibles

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/token/refresh`
- `GET /api/v1/health`

## Payloads de integracion

### Register

```json
{
  "email": "usuario@correo.com",
  "password": "SgcSecure2026!",
  "password_confirmation": "SgcSecure2026!",
  "first_name": "Juan",
  "last_name": "Perez"
}
```

### Login

```json
{
  "email": "usuario@correo.com",
  "password": "SgcSecure2026!"
}
```

## Variables de entorno (.env)

Base recomendada:

```env
DJANGO_ENV=development
DJANGO_SECRET_KEY=sgc-dev-secret-key-2026-min-32-chars
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
```

## Pruebas

```powershell
.\.venv\Scripts\python manage.py check
.\.venv\Scripts\python -m pytest
```

## Seeds de prueba

- Documentacion completa: `README_SEEDS.md`
- Comando: `.\venv\Scripts\python manage.py seed_test_data`
- Opcion de reinicio de datos: `.\venv\Scripts\python manage.py seed_test_data --reset`

## MER de Base de Datos

- Documento completo: docs/MER.md
- Incluye MER actual (implementado) y MER futuro (proyectado).

## Nuevo modulo: Billing alineado al MER

Se actualizo el app `billing` para reflejar la estructura del MER del proyecto.

Modelos implementados:
- `Condominium`
- `CondominiumMembership`
- `Unit`
- `ResidentAssignment`
- `BillingPeriod`
- `CommonExpense`
- `Payment`
- `PaymentReceipt`
- `CommonSpace`
- `Reservation`

Endpoints base (`/api/v1/billing/`):
- `condominiums/`
- `units/`
- `resident-assignments/`
- `billing-periods/`
- `common-expenses/`
- `payments/`
- `payment-receipts/`
- `common-spaces/`
- `reservations/`
- `meter-readings/`

Los mismos recursos tambien se pueden consultar con alcance explicito mediante
`/api/v1/condominiums/{id}/`. Esta variante incluye `members/`, `units/`,
`billing-periods/`, `payments/`, `reservations/` y `meter-readings/`, entre otros.

Notas de acceso:
- `superadmin`: acceso global.
- `admin`: gestiona solamente los condominios donde tiene una membresia activa de administrador.
- `conserje`: consulta reservas y registra lecturas dentro de sus condominios asignados.
- `residente`: consulta gastos, pagos, comprobantes, reservas y lecturas asociados a sus unidades.
- La API heredada `/api/v1/reservations/` queda limitada a `superadmin` mientras se completa su retiro.

Estado de pruebas:
- Suite backend: `22 passed`.
