# SGC Frontend

Frontend del Sistema Web de Gestion de Condominios (SGC), desarrollado con React + Vite.

Este directorio contiene el frontend del monorepo SGC. La API se encuentra en `../sgc-backend`.

## Estado actual

La base actual ya incluye:

- Arquitectura por capas (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).
- Router por features.
- Autenticacion integrada con backend (register/login).
- Guards de rutas para acceso publico/privado.
- Sesion persistida en `localStorage` con JWT (`access`, `refresh`, `user`).

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
3. Frontend guarda `user`, `access`, `refresh` en almacenamiento local.
4. Rutas privadas (`/resident/*`) quedan protegidas con `ProtectedRoute`.
5. Rutas publicas (`/login`, `/register`) usan `PublicOnlyRoute`.

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

## Pendientes recomendados

1. Agregar logout visible en layout.
2. Implementar refresh automatico de token al expirar access token.
3. Activar guard por rol real cuando backend exponga campo `role`.
