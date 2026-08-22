# Seeds de Prueba (Backend SGC)

Este documento explica como poblar datos de prueba para el backend y que datos se crean.

## Comando de seed

Desde `sgc-backend/`:

```powershell
.\venv\Scripts\python manage.py seed_test_data
```

Opciones:

```powershell
# Borra primero los datos semilla y vuelve a crear todo
.\venv\Scripts\python manage.py seed_test_data --reset

# Cambia la contrasena comun de usuarios semilla
.\venv\Scripts\python manage.py seed_test_data --password "MiPasswordSeguro2026!"
```

## Dataset que genera

### 1) Usuarios (app `users`)

Todos con la misma contrasena (por defecto: `SgcSecure2026!`):

- `superadmin@sgc.cl` (`superadmin`)
- `admin@sgc.cl` (`admin`)
- `conserje@sgc.cl` (`conserje`)
- `residente1@sgc.cl` (`residente`)
- `residente2@sgc.cl` (`residente`)
- `residente3@sgc.cl` (`residente`)

### 2) Reservas legacy (app `reservations`)

- Espacios comunes: `pool`, `multi_use_room`, `gym`
- Reservas en distintos estados: `pending`, `approved`, `rejected`

Esto permite probar:
- `GET /api/v1/reservations/`
- `POST /api/v1/reservations/`
- `GET /api/v1/reservations/common-spaces/`

### 3) Billing (app `billing`)

Se crean datos relacionados para probar flujos reales:

- 2 condominios
- 3 unidades
- asignaciones residente-unidad activas
- 2 periodos de gasto comun (`generated` y `open`)
- gastos comunes con estado `pending`, `partial`, `paid`
- pagos (`pending`, `approved`)
- 2 espacios comunes de billing
- 2 reservas de billing (`pending`, `approved`)

Esto cubre endpoints como:

- `/api/v1/billing/condominiums/`
- `/api/v1/billing/units/`
- `/api/v1/billing/resident-assignments/`
- `/api/v1/billing/billing-periods/`
- `/api/v1/billing/common-expenses/`
- `/api/v1/billing/payments/`
- `/api/v1/billing/common-spaces/`
- `/api/v1/billing/reservations/`

## Flujo recomendado para probar rapido

1. Ejecutar migraciones:

```powershell
.\venv\Scripts\python manage.py migrate
```

2. Cargar seeds:

```powershell
.\venv\Scripts\python manage.py seed_test_data --reset
```

3. Loguear por API:

- `POST /api/v1/auth/login`
- Body:

```json
{
  "email": "admin@sgc.cl",
  "password": "SgcSecure2026!"
}
```

4. Usar el token `access` en `Authorization: Bearer <token>`.

## Notas tecnicas

- El comando es idempotente: si lo ejecutas varias veces, actualiza o reutiliza datos en lugar de duplicar la mayoria de registros.
- `--reset` elimina especificamente datos del set semilla y los vuelve a crear.
