<template>
  <q-list>
    <q-item-label header class="text-grey-8"> Navegación </q-item-label>

    <q-item clickable v-ripple to="/">
      <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
      <q-item-section>Dashboard</q-item-section>
    </q-item>

    <!-- ================================== -->
    <!--          CONFIGURACIÓN             -->
    <!-- ================================== -->
    <q-expansion-item
      v-if="isAdmin"
      expand-separator
      icon="settings"
      label="Configuración"
      class="text-grey-8"
    >
      <q-expansion-item
        expand-separator
        icon="category"
        label="Gerencias y Entes"
        class="text-grey-8"
      >
        <q-list class="q-pl-md">
          <q-item clickable v-ripple to="/categorias">
            <q-item-section avatar>
              <q-icon name="business_center" />
            </q-item-section>
            <q-item-section>Categorías</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/dependencias">
            <q-item-section avatar><q-icon name="domain" /></q-item-section>
            <q-item-section>Dependencias</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/subdependencias">
            <q-item-section avatar><q-icon name="list" /></q-item-section>
            <q-item-section>Subdependencias</q-item-section>
          </q-item>
        </q-list>
      </q-expansion-item>

      <q-expansion-item
        expand-separator
        icon="directions_car"
        label="Vehículos"
        class="text-grey-8"
      >
        <q-list class="q-pl-md">
          <q-item clickable v-ripple to="/vehiculos/lista">
            <q-item-section avatar>
              <q-icon name="list" size="xs" />
            </q-item-section>
            <q-item-section>Gestion Vehicular</q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/vehiculos/marcas">
            <q-item-section avatar>
              <q-icon name="branding_watermark" size="xs" />
            </q-item-section>
            <q-item-section>Marcas</q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/vehiculos/modelos">
            <q-item-section avatar>
              <q-icon name="model_training" size="xs" />
            </q-item-section>
            <q-item-section>Modelos</q-item-section>
          </q-item>
        </q-list>
      </q-expansion-item>

      <q-list class="q-pl-md">
        <q-item clickable v-ripple to="/usuarios">
          <q-item-section avatar><q-icon name="group" /></q-item-section>
          <q-item-section>Usuarios</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/tipos-combustible">
          <q-item-section avatar><q-icon name="category" /></q-item-section>
          <q-item-section>Tipos de Combustible</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/cupos">
          <q-item-section avatar><q-icon name="assignment" /></q-item-section>
          <q-item-section>Gestión de Cupos</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/precios">
          <q-item-section avatar><q-icon name="payments" /></q-item-section>
          <q-item-section>Relación de Precios</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/llenaderos">
          <q-item-section avatar><q-icon name="ev_station" /></q-item-section>
          <q-item-section>Llenaderos</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/huella">
          <q-item-section avatar><q-icon name="fingerprint" /></q-item-section>
          <q-item-section>Huella</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/tanques">
          <q-item-section avatar><q-icon name="oil_barrel" /></q-item-section>
          <q-item-section>Gestión de Tanques</q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>

    <q-item clickable v-ripple to="/solicitudes">
      <q-item-section avatar
        ><q-icon name="local_gas_station"
      /></q-item-section>
      <q-item-section>Solicitudes</q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/despacho">
      <q-item-section avatar><q-icon name="print" /></q-item-section>
      <q-item-section>Despacho</q-item-section>
    </q-item>

    <!-- ================================== -->
    <!--          INVENTARIO                -->
    <!-- ================================== -->
    <q-expansion-item
      v-if="canAccess('INVENTARIO')"
      expand-separator
      icon="inventory"
      label="Inventario"
      class="text-grey-8"
    >
      <q-list class="q-pl-md">
        <q-item clickable v-ripple to="/movimientos-llenadero">
          <q-item-section avatar
            ><q-icon name="compare_arrows" size="xs"
          /></q-item-section>
          <q-item-section>Movimiento de Inventario</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/evaporaciones">
          <q-item-section avatar
            ><q-icon name="opacity" size="xs"
          /></q-item-section>
          <q-item-section>Gestión de Evaporización</q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>

    <q-item clickable v-ripple to="/validacion">
      <q-item-section avatar><q-icon name="fact_check" /></q-item-section>
      <q-item-section>Validación (Cierre)</q-item-section>
    </q-item>

    <!-- ================================== -->
    <!--      OPERACIONES TANQUES           -->
    <!-- ================================== -->
    <q-expansion-item
      v-if="canAccess('OPERATIVO')"
      expand-separator
      icon="oil_barrel"
      label="Operaciones de Tanques"
      class="text-grey-8"
    >
      <q-list class="q-pl-md">
        <q-item clickable v-ripple to="/measurements">
          <q-item-section avatar
            ><q-icon name="straighten" size="xs"
          /></q-item-section>
          <q-item-section>Medición de Tanques</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/loads">
          <q-item-section avatar
            ><q-icon name="local_shipping" size="xs"
          /></q-item-section>
          <q-item-section>Recepción de Cisternas</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/internal-transfers">
          <q-item-section avatar
            ><q-icon name="swap_horiz" size="xs"
          /></q-item-section>
          <q-item-section>Transferencias Internas</q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>

    <!-- ================================== -->
    <!--          REPORTES                  -->
    <!-- ================================== -->
    <q-expansion-item
      expand-separator
      icon="analytics"
      label="Reportes"
      class="text-grey-8"
    >
      <q-list class="q-pl-md">
        <q-item clickable v-ripple to="/reportes/mis-cupos">
          <q-item-section avatar
            ><q-icon name="assignment_ind" size="xs"
          /></q-item-section>
          <q-item-section>Mis Cupos</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/reportes/diario">
          <q-item-section avatar
            ><q-icon name="today" size="xs"
          /></q-item-section>
          <q-item-section>Reporte Diario</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/reportes/despachos">
          <q-item-section avatar
            ><q-icon name="list_alt" size="xs"
          /></q-item-section>
          <q-item-section>Reporte de Despachos</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/reportes/consumo-dependencia">
          <q-item-section avatar
            ><q-icon name="bar_chart" size="xs"
          /></q-item-section>
          <q-item-section>Consumo por Dependencia</q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>
  </q-list>
</template>

<script setup>
defineProps({
  isAdmin: Boolean,
  canAccess: Function,
});
</script>
