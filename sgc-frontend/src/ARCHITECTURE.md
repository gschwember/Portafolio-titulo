# Arquitectura Frontend (Foundation)

Este proyecto usa una base por capas para escalar por modulos:

- `app`: bootstrap, router, providers globales.
- `pages`: composicion por ruta.
- `widgets`: bloques UI compuestos de alto nivel.
- `features`: casos de uso (ej: informar pago, actualizar contacto).
- `entities`: modelos de dominio y acceso a datos por entidad.
- `shared`: UI kit, utilidades, config y cliente API.

## Reglas practicas

- `shared` no debe depender de otras capas.
- `entities` puede depender de `shared`.
- `features` puede depender de `entities` y `shared`.
- `widgets` puede depender de `features`, `entities`, `shared`.
- `pages` compone `widgets/features/entities`.
- `app` solo orquesta rutas y configuracion global.

## Aliases

Definidos en `vite.config.js` y `jsconfig.json`:

- `@app/*`
- `@pages/*`
- `@widgets/*`
- `@features/*`
- `@entities/*`
- `@shared/*`
