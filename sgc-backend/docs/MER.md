# MER - Modelo Entidad Relacion (SGC)

Este documento resume el modelo de datos del proyecto en dos etapas:

1. Estado actual (lo implementado hoy)
2. Estado futuro (lo proyectado para cubrir el alcance completo)

## 1) MER actual (implementado)

Actualmente solo existe la entidad de autenticacion de usuarios.

```mermaid
erDiagram
    USER {
        bigint id PK
        string email UNIQUE
        string password
        string first_name
        string last_name
        boolean is_active
        boolean is_staff
        boolean is_superuser
        datetime date_joined
        datetime last_login
    }
```

### Notas del estado actual

- `User` es un modelo custom basado en `AbstractUser`.
- Se usa `email` como identificador principal de login.
- Ya soporta JWT para `register/login/refresh`.

## 2) MER futuro (propuesto)

Este MER proyecta el alcance funcional definido para el sistema de gestion de condominios.

```mermaid
erDiagram
    ROLE {
        bigint id PK
        string code UNIQUE
        string name
        string description
        boolean is_active
    }

    USER {
        bigint id PK
        string email UNIQUE
        string password
        string first_name
        string last_name
        boolean is_active
        datetime date_joined
        bigint role_id FK
    }

    CONDOMINIUM {
        bigint id PK
        string name
        string address
        string city
        string status
        datetime created_at
    }

    TOWER {
        bigint id PK
        bigint condominium_id FK
        string name
        int floors
    }

    UNIT {
        bigint id PK
        bigint condominium_id FK
        bigint tower_id FK
        string unit_number
        int floor
        float proration_factor
        boolean is_active
    }

    RESIDENT_ASSIGNMENT {
        bigint id PK
        bigint user_id FK
        bigint unit_id FK
        date start_date
        date end_date
        boolean is_owner
        boolean is_primary
        boolean is_active
    }

    METER_TYPE {
        bigint id PK
        string code UNIQUE
        string name
        string unit
        boolean is_active
    }

    METER {
        bigint id PK
        bigint unit_id FK
        bigint meter_type_id FK
        string serial_number
        boolean is_active
    }

    METER_READING {
        bigint id PK
        bigint meter_id FK
        bigint period_id FK
        decimal previous_value
        decimal current_value
        decimal consumption
        bigint created_by FK
        datetime created_at
    }

    BILLING_PERIOD {
        bigint id PK
        bigint condominium_id FK
        date period_start
        date period_end
        string status
        datetime closed_at
    }

    ECONOMIC_INDICATOR {
        bigint id PK
        date indicator_date
        decimal uf_value
        decimal utm_value
        string source
    }

    COMMON_EXPENSE {
        bigint id PK
        bigint period_id FK
        bigint unit_id FK
        decimal fixed_amount
        decimal variable_amount
        decimal total_amount
        bigint indicator_id FK
        string status
        datetime generated_at
    }

    PAYMENT {
        bigint id PK
        bigint unit_id FK
        bigint period_id FK
        decimal amount
        date payment_date
        string payment_method
        string status
        bigint validated_by FK
        datetime validated_at
    }

    PAYMENT_RECEIPT {
        bigint id PK
        bigint payment_id FK
        string file_url
        string original_name
        datetime uploaded_at
        bigint uploaded_by FK
    }

    COMMON_SPACE {
        bigint id PK
        bigint condominium_id FK
        string name
        string type
        int slot_duration_minutes
        boolean is_active
    }

    RESERVATION {
        bigint id PK
        bigint common_space_id FK
        bigint user_id FK
        date reservation_date
        time start_time
        time end_time
        string status
        datetime created_at
    }

    NOTICE_PDF {
        bigint id PK
        bigint period_id FK
        bigint unit_id FK
        string file_url
        datetime generated_at
        bigint generated_by FK
    }

    %% Relaciones
    ROLE ||--o{ USER : "assigns"
    CONDOMINIUM ||--o{ TOWER : "contains"
    CONDOMINIUM ||--o{ UNIT : "contains"
    TOWER ||--o{ UNIT : "groups"

    USER ||--o{ RESIDENT_ASSIGNMENT : "belongs"
    UNIT ||--o{ RESIDENT_ASSIGNMENT : "has"

    UNIT ||--o{ METER : "has"
    METER_TYPE ||--o{ METER : "classifies"
    METER ||--o{ METER_READING : "records"
    BILLING_PERIOD ||--o{ METER_READING : "groups"
    USER ||--o{ METER_READING : "created_by"

    CONDOMINIUM ||--o{ BILLING_PERIOD : "opens"
    BILLING_PERIOD ||--o{ COMMON_EXPENSE : "generates"
    UNIT ||--o{ COMMON_EXPENSE : "receives"
    ECONOMIC_INDICATOR ||--o{ COMMON_EXPENSE : "applies"

    UNIT ||--o{ PAYMENT : "pays"
    BILLING_PERIOD ||--o{ PAYMENT : "relates"
    USER ||--o{ PAYMENT : "validated_by"
    PAYMENT ||--o{ PAYMENT_RECEIPT : "has"
    USER ||--o{ PAYMENT_RECEIPT : "uploads"

    CONDOMINIUM ||--o{ COMMON_SPACE : "has"
    COMMON_SPACE ||--o{ RESERVATION : "receives"
    USER ||--o{ RESERVATION : "creates"

    BILLING_PERIOD ||--o{ NOTICE_PDF : "generates"
    UNIT ||--o{ NOTICE_PDF : "receives"
    USER ||--o{ NOTICE_PDF : "generated_by"
```

## 3) Priorizacion sugerida de implementacion (BD)

1. **Usuarios y roles** (`Role`, `User`).
2. **Condominio y unidades** (`Condominium`, `Tower`, `Unit`, `ResidentAssignment`).
3. **Ciclo de gastos comunes** (`BillingPeriod`, `EconomicIndicator`, `CommonExpense`).
4. **Pagos y comprobantes** (`Payment`, `PaymentReceipt`).
5. **Reservas de espacios comunes** (`CommonSpace`, `Reservation`).
6. **Reportes y PDF** (`NoticePDF`).

## 4) Decisiones de diseno recomendadas

- Usar `soft delete` (`is_active`) para entidades operativas.
- Mantener historial de asignaciones residente-unidad por fechas.
- Guardar snapshots de indicadores (UF/UTM) por fecha de cierre.
- Separar estado de negocio (pendiente/aprobado/rechazado) por entidad.
- Definir constraints unicos por periodo y unidad donde aplique.
