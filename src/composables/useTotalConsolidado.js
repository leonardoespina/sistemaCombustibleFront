import { ref, computed, watch } from 'vue'
import api from '../api'
import { useQuasar } from 'quasar'

export function useTotalConsolidado() {
  const $q = useQuasar()
  
  // Estado Reactivo
  const tipoReporte = ref('DIARIO')
  const cargando = ref(false)
  const datosKardex = ref([])
  const filtroFechas = ref(null)

  // Reseteo inteligente al cambiar de Pestaña
  watch(tipoReporte, () => {
    filtroFechas.value = null
    datosKardex.value = []
  })

  // Computado: Resumen para el Dashboard Superior
  const dashboardData = computed(() => {
    if (datosKardex.value.length === 0) return null
    
    const ultimoRegistro = datosKardex.value[datosKardex.value.length - 1]
    return {
      stockInicialGlobal: datosKardex.value[0].stock_inicial,
      stockFinalGlobal: ultimoRegistro.stock_final,
      totalRecepciones: datosKardex.value.reduce((sum, row) => sum + Number(row.recepcion), 0),
      totalDespachos: datosKardex.value.reduce((sum, row) => sum + Number(row.despacho), 0),
      enProgreso: ultimoRegistro.estado === 'EN_PROGRESO'
    }
  })

  // Utilidades de formato
  const formatNumber = (num) => Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    if (dateStr.length === 10 && dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-')
      return `${day}/${month}/${year}`
    }
    return dateStr
  }

  // Computado: Definición de Columnas de la Tabla (Sin la columna SEDE)
  const columnasKardex = computed(() => [
    { name: 'periodo', label: tipoReporte.value === 'DIARIO' ? 'FECHA' : 'MES', field: 'periodo', align: 'left', sortable: true, format: val => tipoReporte.value === 'DIARIO' ? formatDate(val) : val },
    { name: 'nombre_combustible', label: 'COMBUSTIBLE', field: 'nombre_combustible', align: 'left' },
    { name: 'stock_inicial', label: 'INICIAL (L)', field: 'stock_inicial', align: 'right' },
    { name: 'recepcion', label: 'RECEPCIÓN (+)', field: 'recepcion', align: 'right' },
    { name: 'tr_entrada', label: 'TR. ENTRADA (+)', field: 'tr_entrada', align: 'right', format: formatNumber },
    { name: 'despacho', label: 'DESPACHO (-)', field: 'despacho', align: 'right' },
    { name: 'tr_salida', label: 'TR. SALIDA (-)', field: 'tr_salida', align: 'right', format: formatNumber },
    { name: 'ajustes', label: 'AJUSTES (±)', field: 'ajustes', align: 'right', format: formatNumber },
    { name: 'stock_final', label: 'FINAL (L)', field: 'stock_final', align: 'right', classes: 'bg-grey-2 text-weight-bold' },
  ])

  // Método de Acción: Consumir el Backend
  const cargarDatosKardex = async () => {
    if (!filtroFechas.value) {
      $q.notify({ type: 'warning', message: 'Selecciona una fecha o rango de fechas.' })
      return
    }

    let fromDate = ''
    let toDate = ''
    
    if (typeof filtroFechas.value === 'string') {
      fromDate = filtroFechas.value
      toDate = filtroFechas.value
    } else {
      fromDate = filtroFechas.value.from
      toDate = filtroFechas.value.to
    }

    cargando.value = true
    try {
      // Llamada al nuevo endpoint global
      const { data } = await api.get('/reportes/total-consolidado', {
        params: {
          fecha_desde: fromDate,
          fecha_hasta: toDate,
          tipo_reporte: tipoReporte.value
        }
      })
      if (data.success) {
        datosKardex.value = data.data
        $q.notify({ type: 'positive', message: 'Consolidado Total generado correctamente.' })
      }
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al conectar con el servidor.' })
    } finally {
      cargando.value = false
    }
  }

  return {
    tipoReporte,
    cargando,
    datosKardex,
    filtroFechas,
    dashboardData,
    columnasKardex,
    cargarDatosKardex
  }
}
