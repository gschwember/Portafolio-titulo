# SGC Frontend

Frontend del Sistema Web de Gestion de Condominios (SGC), desarrollado con React + Vite.

Este directorio contiene el frontend del monorepo SGC. La API se encuentra en `../sgc-backend`.

## Estado actual

La base actual ya incluye:

- Arquitectura por capas (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).
- Router por features.
- Autenticacion integrada con backend (register/login/refresh/logout).
- Guards de rutas para acceso publico/privado.
- Access token mantenido en memoria y refresh token protegido por cookie `HttpOnly`.
- Persistencia local limitada a los datos publicos del usuario.

## Stack

- React 19
- Vite 8
- TailwindCSS 3
- React Router DOM 7
- ESLint 9

## Arquitectura

```text
src/
  app/                    # bootstrap, provider de auth, router
  pages/                  # paginas de login/register y modulos residentes
  widgets/                # composicion de bloques visuales
  features/               # casos de uso (auth, pagos, contacto)
  entities/               # dominio y acceso a datos por entidad
  shared/                 # ui kit, utilidades, cliente API y configuracion
```

Aliases habilitados:

- `@app/*`
- `@pages/*`
- `@widgets/*`
- `@features/*`
- `@entities/*`
- `@shared/*`

## Flujo de autenticacion implementado

1. Usuario se registra en `/register` (`POST /api/v1/auth/register`).
2. Usuario inicia sesion en `/login` (`POST /api/v1/auth/login`).
3. Frontend mantiene el access token en memoria y solo persiste los datos del usuario.
4. Al recargar, renueva la sesion mediante la cookie `HttpOnly` y programa la siguiente renovacion antes del vencimiento.
5. Al cerrar sesion, el backend revoca el refresh token y elimina la cookie.
6. Rutas privadas quedan protegidas con `ProtectedRoute` y permisos por rol.
7. Rutas publicas (`/login`, `/register`) usan `PublicOnlyRoute`.

## Rutas frontend

- Publicas:
  - `/login`
  - `/register`
  - `/unauthorized`
- Privadas:
  - `/resident/dashboard`
  - `/resident/pagos`
  - `/resident/perfil`

## Configuracion

Crear archivo `.env` (opcional) para apuntar al backend:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Si no se define, usa por defecto `http://localhost:8000/api`.

## Ejecucion

```bash
npm install
npm run dev
```

## Validacion

```bash
npm run lint
npm run build
```

## Archivos clave de auth

- `src/features/auth/context/AuthProvider.jsx`
- `src/features/auth/hooks/useAuth.js`
- `src/features/auth/guards/ProtectedRoute.jsx`
- `src/features/auth/guards/PublicOnlyRoute.jsx`
- `src/features/auth/services/auth.service.js`
- `src/pages/LoginPage.jsx`
- `src/pages/RegisterPage.jsx`

## Siguiente mejora recomendada

Agregar pruebas de componentes y flujos completos para la autenticacion.
