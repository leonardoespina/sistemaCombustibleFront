# 🧪 GUÍA DE TESTING - RequestFormDialog.vue

## 📋 CHECKLIST DE PRUEBAS FUNCIONALES

### ✅ 1. CARGA INICIAL
- [ ] El diálogo se abre correctamente
- [ ] Se cargan las subdependencias autorizadas
- [ ] Se cargan los tipos de combustible
- [ ] Se muestra el nombre del solicitante
- [ ] Se muestra la fecha y hora actual
- [ ] La hora se actualiza cada segundo

### ✅ 2. SELECCIÓN DE SUBDEPENDENCIA
- [ ] Se puede seleccionar una subdependencia
- [ ] El filtro de búsqueda funciona
- [ ] Si solo hay una subdependencia, se auto-selecciona
- [ ] La modalidad cambia a VENTA si cobra_venta = true
- [ ] La modalidad se mantiene INSTITUCIONAL si cobra_venta = false

### ✅ 3. SELECCIÓN DE COMBUSTIBLE
- [ ] Se puede seleccionar un tipo de combustible
- [ ] Se cargan los llenaderos correspondientes
- [ ] Se cargan los vehículos filtrados
- [ ] Se obtiene el cupo disponible
- [ ] Se cargan los precios (si es VENTA)

### ✅ 4. SELECCIÓN DE VEHÍCULO
- [ ] Se muestra la tabla de vehículos
- [ ] El filtro por placa funciona
- [ ] Se puede seleccionar un vehículo haciendo clic
- [ ] El vehículo seleccionado se resalta
- [ ] Se muestra el badge de tipo de combustible con color correcto

### ✅ 5. CUPO MENSUAL
- [ ] Se muestra el cupo asignado
- [ ] Se muestra el cupo disponible
- [ ] Se muestra el cupo consumido
- [ ] Se muestra el porcentaje de consumo
- [ ] El gráfico circular se actualiza correctamente
- [ ] El color cambia según disponibilidad (verde/rojo)

### ✅ 6. DATOS DE CONTROL
- [ ] Se puede ingresar cantidad de litros
- [ ] La modalidad se muestra correctamente
- [ ] En modo VENTA, se puede seleccionar precio
- [ ] En modo VENTA, se calcula el total correctamente
- [ ] Se puede cambiar el tipo de suministro (REGULAR/BIDON)

### ✅ 7. VALIDACIONES
- [ ] No se puede enviar sin llenadero
- [ ] No se puede enviar sin cantidad de litros
- [ ] No se puede enviar sin vehículo seleccionado
- [ ] No se puede enviar sin combustible seleccionado
- [ ] No se puede enviar si el cupo es insuficiente
- [ ] En modo VENTA, no se puede enviar sin precio

### ✅ 8. ENVÍO DE SOLICITUD
- [ ] El botón "Enviar" se habilita cuando todo es válido
- [ ] Se muestra loading al enviar
- [ ] Se crea la solicitud correctamente
- [ ] Se muestra notificación de éxito
- [ ] Se emite el evento 'save' al padre
- [ ] El formulario se resetea después de enviar

### ✅ 9. BOTÓN LIMPIAR
- [ ] Limpia todos los campos del formulario
- [ ] Resetea las selecciones
- [ ] Limpia los filtros
- [ ] Resetea el cupo

### ✅ 10. BOTÓN NOTA
- [ ] Se abre el diálogo de nota
- [ ] Se puede escribir una nota
- [ ] Se puede guardar la nota
- [ ] Se puede cancelar
- [ ] Se muestra notificación al guardar

### ✅ 11. SOCKET.IO (TIEMPO REAL)
- [ ] El cupo se actualiza al recibir evento 'cupo:consumo'
- [ ] El cupo se actualiza al recibir evento 'cupo:recarga'
- [ ] El cupo se actualiza al recibir evento 'solicitud:creada'
- [ ] Los listeners se limpian al cerrar el diálogo

### ✅ 12. INTEGRACIÓN CON STORES
- [ ] requestStore.fetchSubdependenciasAutorizadas() funciona
- [ ] requestStore.fetchLlenaderosPorCombustible() funciona
- [ ] requestStore.createRequest() funciona
- [ ] vehicleStore.fetchVehiclesByFilters() funciona
- [ ] cupoStore.fetchCupoEspecifico() funciona
- [ ] tipoCombustibleStore.fetchTiposCombustible() funciona

---

## 🔄 PRUEBAS DE INTEGRACIÓN

### Escenario 1: Solicitud INSTITUCIONAL Completa
1. Abrir diálogo
2. Seleccionar subdependencia (sin cobra_venta)
3. Seleccionar combustible
4. Seleccionar llenadero
5. Seleccionar vehículo
6. Ingresar cantidad de litros
7. Verificar que modalidad = INSTITUCIONAL
8. Verificar que cupo es suficiente
9. Enviar solicitud
10. Verificar que se creó correctamente

### Escenario 2: Solicitud VENTA Completa
1. Abrir diálogo
2. Seleccionar subdependencia (con cobra_venta)
3. Seleccionar combustible
4. Seleccionar llenadero
5. Seleccionar vehículo
6. Ingresar cantidad de litros
7. Verificar que modalidad = VENTA
8. Seleccionar precio/moneda
9. Verificar cálculo del total
10. Verificar que cupo es suficiente
11. Enviar solicitud
12. Verificar que se creó correctamente

### Escenario 3: Cupo Insuficiente
1. Abrir diálogo
2. Seleccionar subdependencia
3. Seleccionar combustible
4. Seleccionar vehículo
5. Ingresar cantidad mayor al cupo disponible
6. Verificar que botón "Enviar" está deshabilitado
7. Verificar mensaje de error

### Escenario 4: Filtros de Vehículos
1. Abrir diálogo
2. Seleccionar subdependencia y combustible
3. Verificar que se cargan vehículos
4. Escribir en filtro de placa
5. Verificar que se filtran correctamente
6. Limpiar filtro
7. Verificar que se muestran todos los vehículos

---

## 🐛 PRUEBAS DE REGRESIÓN

### Verificar que NO se rompió:
- [ ] El componente padre puede abrir/cerrar el diálogo
- [ ] El evento 'save' se emite correctamente
- [ ] El payload enviado tiene la misma estructura
- [ ] Las validaciones del backend siguen funcionando
- [ ] Los permisos de usuario se respetan
- [ ] El cupo se descuenta correctamente
- [ ] El ticket se genera correctamente

---

## 📊 RESULTADOS ESPERADOS

### Performance
- ✅ Carga inicial < 2 segundos
- ✅ Filtrado de vehículos instantáneo
- ✅ Actualización de cupo < 1 segundo
- ✅ Envío de solicitud < 3 segundos

### UX
- ✅ Interfaz responsive (mobile/tablet/desktop)
- ✅ Feedback visual en todas las acciones
- ✅ Mensajes de error claros
- ✅ Loading states visibles

### Código
- ✅ Sin errores en consola
- ✅ Sin warnings de Vue
- ✅ Sin memory leaks (listeners limpiados)
- ✅ Código modular y mantenible

---

## 🚀 COMANDOS DE TESTING

```bash
# Ejecutar en modo desarrollo
npm run dev

# Abrir en navegador
http://localhost:5173

# Verificar consola del navegador
F12 > Console

# Verificar Network
F12 > Network > XHR
```

---

## ✅ CHECKLIST FINAL

- [ ] Todas las pruebas funcionales pasaron
- [ ] Todas las pruebas de integración pasaron
- [ ] Todas las pruebas de regresión pasaron
- [ ] No hay errores en consola
- [ ] No hay warnings de Vue
- [ ] Performance es aceptable
- [ ] UX es fluida
- [ ] Código está documentado

---

## 📝 NOTAS

- El componente usa **composables** para lógica reutilizable
- Las **secciones** son componentes independientes
- Los **stores** centralizan las llamadas API
- **Socket.IO** mantiene datos en tiempo real
- El **backup** está en `RequestFormDialog copy.vue`

---

**Fecha de creación:** 2026-02-02
**Versión:** 1.0.0 (Refactorizado)
**Autor:** Sistema de Refactorización
