# 📦 RequestFormDialog - Componente Refactorizado

## 📖 Descripción

Componente de diálogo para crear solicitudes de combustible. Refactorizado siguiendo los patrones del proyecto con arquitectura modular basada en composables y secciones reutilizables.

## 🏗️ Arquitectura

### Estructura de Archivos

```
dispatches/
├── RequestFormDialog.vue          # Componente principal (250 líneas)
├── composables/                   # Lógica de negocio
│   ├── useRequestForm.js         # Gestión del formulario
│   ├── useRequestQuota.js        # Gestión de cupo + Socket.IO
│   └── useRequestFilters.js      # Filtros de vehículos
├── request-sections/              # Componentes de UI
│   ├── RequestConfigSection.vue  # Configuración
│   ├── RequestVehicleSection.vue # Tabla de vehículos
│   ├── RequestControlSection.vue # Datos de control
│   ├── RequestQuotaSection.vue   # Cupo mensual
│   └── RequestActionsSection.vue # Botones de acción
├── TESTING_GUIDE.md              # Guía de testing
└── README.md                      # Este archivo
```

## 🚀 Uso

### Básico

```vue
<template>
  <RequestFormDialog
    v-model="showDialog"
    @save="handleSave"
  />
</template>

<script setup>
import { ref } from 'vue';
import RequestFormDialog from '@/components/dispatches/RequestFormDialog.vue';

const showDialog = ref(false);

function handleSave(payload) {
  console.log('Solicitud creada:', payload);
  showDialog.value = false;
}
</script>
```

## 📋 Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `modelValue` | Boolean | `false` | Controla la visibilidad del diálogo |

## 🎯 Events

| Event | Payload | Descripción |
|-------|---------|-------------|
| `update:modelValue` | Boolean | Emitido al abrir/cerrar el diálogo |
| `save` | Object | Emitido al crear una solicitud exitosamente |

### Estructura del Payload (save)

```javascript
{
  // Datos del formulario
  id_categoria: Number,
  id_dependencia: Number,
  id_subdependencia: Number,
  id_llenadero: Number,
  id_tipo_combustible: Number,
  cantidad_litros: Number,
  tipo_suministro: String, // 'REGULAR' | 'BIDON'
  tipo_solicitud: String,  // 'INSTITUCIONAL' | 'VENTA'
  
  // Datos del vehículo
  id_vehiculo: Number,
  placa: String,
  marca: String,
  modelo: String,
  flota: String,
  
  // Datos de venta (si aplica)
  id_precio: Number | null,
  monto_total: Number,
  
  // Datos de auditoría
  solicitante: String,
  fecha_solicitud: String,
  hora_solicitud: String
}
```

## 🔧 Composables

### useRequestForm

Gestiona la lógica del formulario y validaciones.

```javascript
const {
  loading,              // Estado de carga
  formData,            // Datos del formulario
  selectedCombustible, // Combustible seleccionado
  selectedVehicle,     // Vehículo seleccionado
  selectedSubdependencia, // Subdependencia seleccionada
  selectedPrecioObj,   // Precio seleccionado (VENTA)
  solicitanteName,     // Nombre del solicitante
  currentDate,         // Fecha actual
  currentTime,         // Hora actual
  availableModalities, // Modalidades disponibles
  calculatedTotal,     // Total calculado (VENTA)
  canSubmit,           // Puede enviar formulario
  initializeForm,      // Inicializar formulario
  resetForm,           // Resetear formulario
  onTipoSolicitudChange, // Handler cambio modalidad
  onSave               // Guardar solicitud
} = useRequestForm(emit, requestStore);
```

### useRequestQuota

Gestiona el cupo mensual y actualizaciones en tiempo real.

```javascript
const {
  quotaInfo,        // Información del cupo
  fetchQuotaInfo,   // Obtener cupo
  formatVolume      // Formatear volumen
} = useRequestQuota(cupoStore, selectedSubdependencia, selectedCombustible);
```

### useRequestFilters

Gestiona los filtros de vehículos y subdependencias.

```javascript
const {
  filterPlaca,                    // Filtro de placa
  filteredSubdependenciaOptions,  // Subdependencias filtradas
  filteredVehicleOptions,         // Vehículos filtrados
  filterSubdependencias,          // Filtrar subdependencias
  triggerFilterVehicles,          // Filtrar vehículos
  fetchVehicles,                  // Obtener vehículos
  getFuelColor,                   // Color del badge
  resetFilters                    // Resetear filtros
} = useRequestFilters(vehicleStore);
```

## 🎨 Secciones de UI

### RequestConfigSection

Configuración de la solicitud (Subdependencia, Combustible, Llenadero).

**Props:**
- `modelValue`: Objeto con selecciones actuales
- `filteredSubdependenciaOptions`: Array de subdependencias
- `combustibleOptions`: Array de combustibles
- `llenaderoOptions`: Array de llenaderos
- `loadingSubdependencias`: Boolean
- `loadingLlenaderos`: Boolean

**Events:**
- `update:selectedSubdependencia`
- `update:selectedCombustible`
- `update:llenadero`
- `filter:subdependencias`

### RequestVehicleSection

Tabla de vehículos con filtro por placa.

**Props:**
- `vehicleOptions`: Array de vehículos
- `selectedVehicle`: Vehículo seleccionado
- `filterPlaca`: String de filtro
- `getFuelColor`: Function para color del badge

**Events:**
- `select:vehicle`
- `update:filterPlaca`

### RequestControlSection

Datos de control (Cantidad, Modalidad, Precio, etc).

**Props:**
- `formData`: Objeto con datos del formulario
- `availableModalities`: Array de modalidades
- `precioOptions`: Array de precios
- `selectedPrecioObj`: Precio seleccionado
- `calculatedTotal`: String con total calculado
- `solicitanteName`: String
- `currentDate`: String
- `currentTime`: String

**Events:**
- `update:cantidadLitros`
- `update:tipoSolicitud`
- `update:precioObj`
- `update:tipoSuministro`

### RequestQuotaSection

Visualización del cupo mensual.

**Props:**
- `quotaInfo`: Objeto con información del cupo
- `formatVolume`: Function para formatear volúmenes

### RequestActionsSection

Botones de acción del formulario.

**Props:**
- `canSubmit`: Boolean
- `loading`: Boolean

**Events:**
- `submit`
- `reset`
- `note`
- `close`

## 🔌 Integración con Stores

El componente utiliza los siguientes stores de Pinia:

- **requestStore**: Gestión de solicitudes
- **vehicleStore**: Gestión de vehículos
- **tipoCombustibleStore**: Gestión de tipos de combustible
- **cupoStore**: Gestión de cupos
- **precioStore**: Gestión de precios (indirectamente)

## 🔄 Socket.IO

El componente escucha los siguientes eventos en tiempo real:

- `cupo:consumo` - Actualiza el cupo cuando se consume
- `cupo:recarga` - Actualiza el cupo cuando se recarga
- `solicitud:creada` - Actualiza el cupo cuando se crea una solicitud

Los listeners se limpian automáticamente al desmontar el componente.

## ✅ Validaciones

### Validaciones de Frontend

- Llenadero requerido
- Cantidad de litros requerida y > 0
- Vehículo requerido
- Combustible requerido
- Cupo suficiente
- Precio requerido (solo en modo VENTA)

### Validaciones de Backend

- Bloqueo de placa (no puede haber solicitud activa)
- Validación de cupo disponible
- Validación de permisos de usuario
- Validación de subdependencia con cobra_venta

## 🎯 Flujo de Trabajo

1. **Abrir diálogo** → Se cargan subdependencias y combustibles
2. **Seleccionar subdependencia** → Se determina modalidad (INSTITUCIONAL/VENTA)
3. **Seleccionar combustible** → Se cargan llenaderos, vehículos y cupo
4. **Seleccionar vehículo** → Se habilita para continuar
5. **Ingresar cantidad** → Se valida contra cupo disponible
6. **Seleccionar precio** (si VENTA) → Se calcula total
7. **Enviar solicitud** → Se crea en backend y se emite evento

## 🐛 Troubleshooting

### El diálogo no se abre
- Verificar que `v-model` esté correctamente vinculado
- Verificar que no haya errores en consola

### No se cargan las subdependencias
- Verificar permisos del usuario
- Verificar que el backend esté respondiendo
- Revisar `requestStore.fetchSubdependenciasAutorizadas()`

### No se cargan los vehículos
- Verificar que se haya seleccionado subdependencia y combustible
- Revisar `vehicleStore.fetchVehiclesByFilters()`
- Verificar filtros en backend

### El cupo no se actualiza
- Verificar conexión de Socket.IO
- Revisar eventos en consola del navegador
- Verificar que `cupoStore.fetchCupoEspecifico()` funcione

### El botón "Enviar" está deshabilitado
- Verificar que todos los campos requeridos estén llenos
- Verificar que el cupo sea suficiente
- Revisar `canSubmit` computed en consola

## 📚 Referencias

- [Guía de Testing](./TESTING_GUIDE.md)
- [Documentación de Pinia](https://pinia.vuejs.org/)
- [Documentación de Quasar](https://quasar.dev/)
- [Documentación de Socket.IO](https://socket.io/docs/)

## 📝 Changelog

### v1.0.0 (2026-02-02) - Refactorización Completa
- ✅ Separación en composables y secciones
- ✅ Integración con stores centralizados
- ✅ Implementación de Socket.IO para tiempo real
- ✅ Funcionalidad de "Nota" agregada
- ✅ Reducción de ~600 a ~250 líneas
- ✅ Mejora en mantenibilidad y escalabilidad

## 👥 Contribuir

Para contribuir a este componente:

1. Seguir los patrones establecidos
2. Mantener la separación de responsabilidades
3. Documentar cambios en este README
4. Actualizar TESTING_GUIDE.md si es necesario
5. Probar todas las funcionalidades antes de commit

## 📄 Licencia

Este componente es parte del Sistema de Combustible y sigue la misma licencia del proyecto principal.

---

**Última actualización:** 2026-02-02
**Versión:** 1.0.0
**Mantenedor:** Equipo de Desarrollo
