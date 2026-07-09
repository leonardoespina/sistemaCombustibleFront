import { ref, computed, watch, onMounted } from 'vue'
import api from '../api'
import { useQuasar, exportFile } from 'quasar'
import { useLlenaderoStore } from '../stores/llenaderoStore'
import * as XLSX from 'xlsx'

export function useKardex() {
  const $q = useQuasar()
  
  // Estado Reactivo
  const tipoReporte = ref('DIARIO')
  const cargando = ref(false)
  const datosKardex = ref([])
  const filtroFechas = ref(null)
  const sedesSeleccionadas = ref([])

  // Stores
  const llenaderoStore = useLlenaderoStore()

  onMounted(() => {
    llenaderoStore.fetchLlenaderos()
  })

  // Reseteo inteligente al cambiar de Pestaña
  watch(tipoReporte, () => {
    filtroFechas.value = null
    datosKardex.value = []
    sedesSeleccionadas.value = []
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

  // Computado: Definición de Columnas de la Tabla
  const columnasKardex = computed(() => [
    { name: 'periodo', label: tipoReporte.value === 'DIARIO' ? 'FECHA' : 'MES', field: 'periodo', align: 'left', sortable: true, format: val => tipoReporte.value === 'DIARIO' ? formatDate(val) : val },
    { name: 'nombre_llenadero', label: 'SEDE', field: 'nombre_llenadero', align: 'left' },
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

    // Quasar q-date con 'range' devuelve un String si se selecciona un solo día, o un Objeto {from, to} si es un rango real
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
      const params = {
        fecha_desde: fromDate,
        fecha_hasta: toDate,
        tipo_reporte: tipoReporte.value
      }

      if (sedesSeleccionadas.value && sedesSeleccionadas.value.length > 0) {
        params.llenaderos_ids = sedesSeleccionadas.value.map(s => s.id_llenadero).join(',')
      }

      const { data } = await api.get('/reportes/kardex-dinamico', { params })
      if (data.success) {
        datosKardex.value = data.data
        $q.notify({ type: 'positive', message: 'Kardex generado correctamente.' })
      }
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al conectar con el servidor.' })
    } finally {
      cargando.value = false
    }
  }

  // Exportación a Excel
  const exportarExcel = () => {
    if (datosKardex.value.length === 0) {
      $q.notify({ type: 'warning', message: 'No hay datos para exportar' })
      return
    }

    const dataExcel = datosKardex.value.map(row => ({
      'FECHA/MES': tipoReporte.value === 'DIARIO' ? formatDate(row.periodo) : row.periodo,
      'SEDE': row.nombre_llenadero,
      'COMBUSTIBLE': row.nombre_combustible,
      'INICIAL (L)': Number(row.stock_inicial),
      'RECEPCIÓN (+)': Number(row.recepcion),
      'TR. ENTRADA (+)': Number(row.tr_entrada),
      'DESPACHO (-)': Number(row.despacho),
      'TR. SALIDA (-)': Number(row.tr_salida),
      'AJUSTES (±)': Number(row.ajustes),
      'FINAL (L)': Number(row.stock_final)
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataExcel)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidado')

    XLSX.writeFile(workbook, `Reporte_Consolidado_${tipoReporte.value}.xlsx`)
  }

  return {
    tipoReporte,
    cargando,
    datosKardex,
    filtroFechas,
    sedesSeleccionadas,
    llenaderos: computed(() => llenaderoStore.rows),
    dashboardData,
    columnasKardex,
    cargarDatosKardex,
    exportarExcel
  }
}
