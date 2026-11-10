# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

SGC atiende dos tipos de clientes que pueden contratar el producto:

- Comunidades y administraciones de condominios que necesitan gestionar su operación diaria.
- Empresas administradoras que operan uno o varios condominios y necesitan separar correctamente los datos y permisos de cada comunidad.

Dentro de cada condominio, la implementación actual contempla cuatro perfiles: superadministrador, administrador, conserje y residente.

## Product Purpose

Centralizar la administración financiera, operativa y comunitaria de condominios en una aplicación web. El producto reúne gastos comunes, pagos, reservas de espacios, lecturas de medidores, usuarios y comunicación para reducir el trabajo fragmentado y dar a cada perfil una experiencia acorde con sus responsabilidades.

El objetivo es evolucionar gradualmente desde un proyecto académico funcional hacia un SaaS comercial real, seguro, moderno y apto para presentarse a clientes.

## Positioning

La propuesta actual combina flujos financieros y operativos con permisos por rol y aislamiento por condominio dentro de una misma plataforma. La evolución comercial debe servir tanto a una comunidad individual como a una empresa administradora con múltiples condominios, sin mezclar información entre ellos.

## Operating Context

- Administradores revisan el estado financiero, validan pagos, gestionan unidades y residentes, y cierran periodos de gastos comunes.
- Conserjes consultan reservas e ingresan lecturas de medidores.
- Residentes consultan deudas e historial, presentan comprobantes y reservan espacios comunes.
- Superadministradores gestionan condominios, usuarios, roles, pagos y reservas a nivel global.
- La implementación actual utiliza español, montos en pesos chilenos y terminología propia de la administración de condominios en Chile.

## Capabilities and Constraints

- Aplicación full stack con React, Vite, Django REST Framework y persistencia preparada para PostgreSQL.
- Autenticación con access token en memoria, refresh token en cookie `HttpOnly`, protección CSRF y autorización por rol y membresía de condominio.
- La migración hacia SaaS debe ser gradual y preservar los flujos funcionales existentes durante cada mejora.
- El alcance geográfico inicial es Chile; una futura adaptación a otros países permanece abierta.
- El modelo comercial, precios, facturación de suscripciones y condiciones legales todavía no están definidos.

## Brand Commitments

- `SGC` es el nombre de trabajo actual y existe un logotipo implementado.
- El nombre, el logotipo y la identidad visual pueden modernizarse o reemplazarse después de revisar diferenciación de mercado, dominios y marcas registradas.
- Mientras no exista una decisión de rebranding confirmada, las mejoras deben preservar el reconocimiento y el funcionamiento actual de SGC.

## Evidence on Hand

- Código funcional del frontend y backend.
- Demostración pública enlazada desde `README.md`.
- Flujos diferenciados para cuatro perfiles de usuario.
- Suite automatizada del backend y comprobaciones de lint y build del frontend en CI.
- Recursos visuales actuales en `sgc-frontend/src/assets/`.
- No existen todavía clientes de pago, testimonios, métricas comerciales ni afirmaciones de cumplimiento normativo que puedan utilizarse como prueba de mercado.

## Product Principles

1. Aislar siempre los datos y permisos de cada condominio.
2. Convertir procesos administrativos fragmentados en flujos claros y trazables.
3. Servir tanto a comunidades individuales como a operadores multi-condominio sin duplicar el producto.
4. Evolucionar por etapas verificables, manteniendo los flujos existentes operativos.
5. No presentar como comercialmente validada, certificada o regulatoriamente conforme una capacidad que todavía no tenga evidencia.

## Accessibility & Inclusion

La experiencia debe ser utilizable en escritorio y dispositivos móviles por los distintos perfiles operativos. El estándar formal de accesibilidad aún está por definir antes del lanzamiento comercial.
