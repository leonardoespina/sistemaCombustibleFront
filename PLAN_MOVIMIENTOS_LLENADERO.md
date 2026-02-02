# Documento de Requerimientos: Gestión Unificada de Inventario (Llenaderos)

## 1. Introducción
Este documento define los requerimientos para unificar la **Gestión de Cargas (Cisternas)** y el **Registro de Evaporación** en una sola pantalla funcional. El objetivo es centralizar los movimientos de inventario de los llenaderos.

## 2. Objetivo
Crear una interfaz única "Gestión de Movimientos de Combustible" que permita al usuario registrar tanto ingresos (compras/recepciones) como egresos por ajuste (evaporación/mermas), adaptando el formulario dinámicamente según el tipo de operación.

## 3. Pantalla Unificada: Componentes

### A. Selector de Operación (Nuevo)
- **Tipo de Movimiento**: Lista desplegable o Radio Button.
  1.  **Recepción de Cisterna** (Suma inventario).
  2.  **Registro de Evaporación** (Resta inventario).

### B. Sección Común (Encabezado)
- **Llenadero**: Selector del llenadero a afectar.
- **Detalles ACTUAL**:
  - Disponibilidad (Lts).
  - % Disponibilidad.

### C. Sección Dinámica de Volumen

#### Caso 1: Si selecciona "Recepción de Cisterna"
- **Volumen Real (Lts)**: Cantidad a sumar. (Validación: No exceder capacidad total).
- **Volumen Factura (Lts)**: Dato administrativo.
- **Datos Administrativos**:
  - Número de Factura.
  - Datos Gandola (Placa).
  - Nombre Conductor.
  - Cédula Conductor.

#### Caso 2: Si selecciona "Registro de Evaporación"
- **Volumen Evaporado (Lts)**: Cantidad a restar. (Validación: No exceder disponibilidad actual).
- *Nota*: Los campos de factura y conductor se ocultan automáticamente.

### D. Sección de Proyección (Cálculos)
El sistema debe calcular el resultado final en tiempo real:

- **Si es Recepción**: `Final = Actual + Volumen`.
- **Si es Evaporación**: `Final = Actual - Volumen`.

- **Visualización**:
  - Disponibilidad Final (Lts).
  - % Disponibilidad Final.
  - Alerta visual si el resultado es negativo o excede capacidad.

### E. Cierre
- **Observación**: Campo obligatorio para justificar evaporaciones o notar incidencias en recepciones.
- **Botones**: Aceptar (Procesar), Limpiar, Salir.

## 4. Requerimientos Técnicos (Backend)

### Modelo de Datos Sugerido
En lugar de crear tablas separadas, se sugiere un modelo unificado `MovimientoLlenadero` (o `InventoryMovement`) o adaptar el histórico existente.

**Campos:**
- `id`: PK.
- `id_llenadero`: FK.
- `tipo_movimiento`: ENUM ('CARGA', 'EVAPORACION', 'AJUSTE').
- `cantidad`: Decimal (Positivo).
- `saldo_anterior`: Snapshot del stock antes del movimiento.
- `saldo_nuevo`: Snapshot del stock después del movimiento.
- `fecha`: Timestamp.
- `usuario_id`: Auditoría.
- `detalles_extra`: JSONB o columnas específicas para (placa, factura, conductor) - Nullable si es evaporación.

### API Endpoints
- `POST /api/llenaderos/movimiento`
  - Body: `{ tipo: 'CARGA'|'EVAPORACION', cantidad: 5000, ...datos_extra }`
  - Lógica:
    - Validar tipo.
    - Si es CARGA: Validar espacio disponible. `Update stock = stock + cantidad`.
    - Si es EVAPORACION: Validar stock suficiente. `Update stock = stock - cantidad`.
    - Crear registro histórico.

## 5. Beneficios de la Unificación
- **Mantenibilidad**: Un solo formulario de Vue para mantener.
- **Usabilidad**: Flujo de trabajo centralizado para el operador.
- **Consistencia**: Lógica de cálculo y validación compartida.
