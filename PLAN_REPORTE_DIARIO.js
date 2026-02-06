// Plan de Implementación: Reporte Diario de Combustible (Revisado)

// 1. Backend (Controlador y Ruta)
// Ubicación: C:/scb/controllers/reporteController.js
// Funcionalidad:
// - Recibir id_llenadero y fecha como parámetros obligatorios.
// - Realizar dos consultas paralelas a la base de datos (Solicitud) usando Sequelize:
//   - Consulta 1 (Tipo Venta): Filtrar por tipo_solicitud = 'VENTA', id_llenadero, fecha_despacho (o fecha_solicitud según regla de negocio).
//     - Agrupar por id_usuario, id_vehiculo, id_dependencia, id_subdependencia.
//     - Incluir relaciones: Usuario (Solicitante), Vehiculo, Dependencia, Subdependencia.
//     - Calcular sumas: cantidad_litros (solicitada), cantidad_despachada.
//   - Consulta 2 (Tipo Institucional): Similar a Venta, pero filtrar por tipo_solicitud = 'INSTITUCIONAL'.
//     - Incluir campos adicionales: precio_unitario, monto_total, moneda (desde PrecioCombustible o tabla relacionada).
// - Formatear la respuesta en un objeto JSON con dos arrays: 'venta' e 'institucional', y un resumen de totales.

// 2. Frontend (Vista y Lógica)
// Ubicación: C:/scf/src/pages/reports/ReporteDiarioPage.vue
// Funcionalidad:
// - Componente con selectores para Llenadero y Fecha.
// - Botón "Buscar" que invoca al endpoint del backend.
// - Tablas separadas para mostrar los resultados de 'Venta' e 'Institucional'.
// - Sección de resumen de totales al final.
// - Manejo de estados de carga y errores.

// Estructura de la Consulta Sequelize (Conceptual):
/*
const ventas = await Solicitud.findAll({
  where: {
    id_llenadero: id_llenadero,
    fecha_despacho: { [Op.between]: [startOfDay, endOfDay] },
    tipo_solicitud: 'VENTA',
    estado: 'DESPACHADA' // Asegurar que solo se cuenten las despachadas
  },
  include: [
    { model: Usuario, as: 'Solicitante' },
    { model: Vehiculo },
    { model: Dependencia },
    { model: Subdependencia }
  ],
  // ... lógica de agrupación o selección de campos específicos
});

const institucionales = await Solicitud.findAll({
  // ... filtros similares pero tipo_solicitud: 'INSTITUCIONAL'
  include: [
    // ... mismas relaciones + PrecioCombustible si aplica
  ]
});
*/

// Siguientes Pasos:
// 1. Crear C:/scb/controllers/reporteController.js con la lógica detallada.
// 2. Definir la ruta en C:/scb/routes/reporteRoutes.js y registrarla en app.js.
// 3. Crear el componente Vue en C:/scf/src/pages/reports/ReporteDiarioPage.vue.
// 4. Agregar la ruta en el router del frontend.
