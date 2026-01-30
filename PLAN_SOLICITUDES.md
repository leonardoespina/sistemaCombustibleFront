# Plan Maestro de Implementación: Sistema de Control de Solicitudes y Despachos de Combustible

Este documento define la estrategia técnica para implementar el "Controlador de Solicitudes" y los módulos asociados (Aprobación, Despacho), cumpliendo estrictamente con los Requerimientos Funcionales (RF-01 al RF-14) y las Reglas de Negocio especificadas.

## 1. Modelo de Datos (Backend)

### 1.1 Nueva Tabla: `solicitudes` (Modelo `Solicitud`)
Se creará el modelo con los siguientes campos para soportar todo el ciclo de vida y auditoría:

| Campo | Tipo | Descripción / Regla |
|-------|------|---------------------|
| `id_solicitud` | INTEGER (PK) | Auto-incrementable. Base para el correlativo. |
| `codigo_ticket` | STRING(10) | Generado en Impresión (RF-10). Único. |
| `id_usuario` | INTEGER | FK -> Usuario (Solicitante). |
| `id_dependencia` | INTEGER | FK -> Dependencia (RF-01). |
| `id_subdependencia` | INTEGER | FK -> Subdependencia (RF-01). |
| `id_categoria` | INTEGER | FK -> Categoria (RF-01). |
| `id_vehiculo` | INTEGER | FK -> Vehiculo. Para validación de placa (RF-05). |
| `placa` | STRING | Redundancia histórica del vehículo. |
| `marca`, `modelo` | STRING | Datos del vehículo snapshot. |
| `flota` | STRING | Dato requerido para el ticket. |
| `id_llenadero` | INTEGER | FK -> Llenadero. |
| `id_tipo_combustible`| INTEGER | FK -> TipoCombustible. |
| `cantidad_litros` | DECIMAL | Litros solicitados. |
| `tipo_suministro` | ENUM | 'REGULAR', 'BIDON'. Determina prefijo Ticket (RF-10). |
| `tipo_solicitud` | ENUM | 'INSTITUCIONAL', 'VENTA'. |
| `precio_unitario` | DECIMAL | Para Ventas (RF-03). |
| `monto_total` | DECIMAL | Para Ventas (RF-03). |
| `forma_pago` | STRING | Para Ventas (RF-03). |
| `estado` | ENUM | 'NUEVA', 'PENDIENTE', 'APROBADA', 'IMPRESA', 'DESPACHADA', 'VENCIDA', 'ANULADA'. |
| `fecha_solicitud` | DATETIME | Default NOW. |
| `fecha_aprobacion` | DATETIME | Auditoría. |
| `id_aprobador` | INTEGER | FK -> Usuario (Gerente/Jefe). RF-08. |
| `fecha_impresion` | DATETIME | Auditoría. |
| `numero_impresiones` | INTEGER | Default 0. Control RF-11. |
| `id_almacenista` | INTEGER | FK -> Usuario (Huella 1). RF-09. |
| `id_receptor` | INTEGER | FK -> Biometria/Persona (Huella 2). RF-09. |
| `fecha_despacho` | DATETIME | Auditoría. |
| `qr_hash` | STRING | Seguridad para validar ticket. |

### 1.2 Relaciones
- `Solicitud` pertenece a `Usuario`, `Vehiculo`, `Subdependencia`, `Llenadero`.
- `Llenadero` pertenece a `TipoCombustible` (usado para filtrado RF-02).

## 2. API y Controladores (Backend)

Archivo: `../scb/controllers/solicitudController.js`

### 2.1 Módulo de Solicitud (Creación)
**Endpoint**: `POST /api/solicitudes`
- **RF-01 Detección Automática**: Extraer `id_dependencia`, `id_subdependencia`, `id_categoria` del token JWT (`req.user`) del usuario conectado.
- **RF-02 Filtrado**: El frontend debe haber filtrado los llenaderos basándose en el Tipo de Combustible seleccionado antes de enviar el ID.
- **RF-05 Bloqueo de Placa**: 
  - Consultar tabla `solicitudes`: `WHERE placa = ? AND estado IN ('PENDIENTE', 'APROBADA', 'IMPRESA')`.
  - Si existe registro, devolver error: "Vehículo con solicitud activa pendiente de despacho".
- **RF-04/RF-06 Gestión de Cupo**: 
  - Obtener `CupoActual` de la `Subdependencia`.
  - Validar `disponible >= cantidad_litros`.
  - **Transacción**: Descontar litros del `CupoActual`. Crear `Solicitud` con estado 'PENDIENTE'.

**Endpoint Auxiliar**: `GET /api/cupos/resumen` (RF-04)
- Retorna objeto: `{ cuota_mensual, consumido, disponible, porcentaje_consumo }` calculado desde `CupoActual`.

### 2.2 Módulo de Aprobación
**Endpoint**: `PUT /api/solicitudes/:id/aprobar`
- **RF-08 Rol**: Middleware verifica `req.user.rol` IN ('GERENTE', 'JEFE DIVISION').
- **Acción**: Actualizar estado a 'APROBADA', set `fecha_aprobacion = NOW()`, `id_aprobador = req.user.id`.

### 2.3 Módulo de Impresión (Generación de Ticket)
**Endpoint**: `POST /api/solicitudes/:id/imprimir`
- **Payload**: `{ huella_almacenista, huella_receptor }`
- **RF-09 Validación Biométrica**:
  - Validar `huella_almacenista` contra usuario en sesión (Almacenista).
  - Validar `huella_receptor` contra BD de Biometría (Beneficiario).
  - Ambas deben ser exitosas en la misma transacción.
- **RF-10 Nomenclatura**:
  - Prefijo: Si `tipo_suministro` == 'BIDON' -> 'B', sino -> 'R'.
  - Código Dependencia: `dependencia.codigo` (padding 3 ceros).
  - Correlativo: `solicitud.id` (padding 6 ceros).
  - Guardar `codigo_ticket = B311000900`.
- **Acción**: Estado -> 'IMPRESA', `numero_impresiones = 1`, `id_almacenista`, `id_receptor`.
- **Respuesta**: Datos JSON para renderizar ticket físico.

**Endpoint Reimpresión**: `POST /api/solicitudes/:id/reimprimir` (RF-11)
- Validar estado == 'IMPRESA' o 'DESPACHADA'.
- Incrementar `numero_impresiones`.
- Retornar datos de ticket con flag `es_copia: true` para que el frontend agregue la marca de agua "RE-IMPRESION".

### 2.4 Módulo de Despacho
**Endpoint**: `POST /api/solicitudes/despachar`
- **Payload**: `{ codigo_ticket }` (Desde lectura QR).
- **Validación**: Buscar solicitud por `codigo_ticket`. Verificar estado == 'IMPRESA'.
- **RF-13 Descuento Inventario**:
  - Descontar `cantidad_litros` del `Tanque` del Llenadero asociado.
  - Estado -> 'DESPACHADA'.
  - `fecha_despacho = NOW()`.
  - El cambio de estado libera automáticamente la placa (RF-05 ya no encontrará solicitud activa).

### 2.5 Cierre Diario (Cron Job)
**Tarea Programada**: 23:59 todos los días.
- **RF-07 / RF-14**:
  - Buscar solicitudes con estado IN ('PENDIENTE', 'APROBADA', 'IMPRESA').
  - **Reintegro**: Sumar `cantidad_litros` de vuelta al `CupoActual` de la `Subdependencia`.
  - **Cierre**: Actualizar estado a 'VENCIDA'.
  - Esto libera las placas y devuelve los litros reservados que no fueron despachados.

## 3. Frontend (Componentes Clave)

- **`RequestFormDialog.vue`**:
  - Select dependiente: Tipo Combustible -> Carga Llenaderos (filtro).
  - Campos condicionales para Ventas (Precio, Forma Pago).
  - Panel informativo de Disponibilidad (RF-04) antes de enviar.
- **`TicketPrintDialog.vue`**:
  - Integración con componente `FingerprintCapture.vue`.
  - Pasos: 1. Huella Almacenista -> 2. Huella Receptor -> 3. Enviar a API -> 4. Mostrar Ticket (PDF/HTML) para imprimir.
- **`DispatchPage.vue`**:
  - Uso de cámara (componente `CameraCapture.vue` existente) para leer QR.
  - Llamada a `dispatchWithQR`.

## 4. Plan de Ejecución

1.  **Backend - Base de Datos**: Crear modelo `Solicitud` y relaciones.
2.  **Backend - Creación**: Endpoint POST (Validaciones Placa/Cupo).
3.  **Backend - Aprobación**: Endpoint PUT (Rol).
4.  **Backend - Impresión**: Endpoint POST (Lógica Ticket + Biometría Mock/Real).
5.  **Backend - Despacho**: Endpoint POST (Lógica QR + Inventario).
6.  **Backend - Cron**: Script de cierre diario.
7.  **Frontend**: Integración de vistas con nuevos endpoints.

---
**¿Desea proceder con la ejecución de la Fase 1 (Creación de Modelo y Controlador Básico)?**
