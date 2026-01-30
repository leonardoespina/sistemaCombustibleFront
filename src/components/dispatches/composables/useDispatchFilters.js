import { ref } from "vue";

export function useDispatchFilters(props) {
  const vehicleOptions = ref([]);
  const driverOptions = ref([]);
  const warehousemanOptions = ref([]);

  function filterVehicles(val, update) {
    update(() => {
      if (!val) {
        vehicleOptions.value = [...props.vehiclesList];
        return;
      }
      const needle = val.toLowerCase();
      vehicleOptions.value = props.vehiclesList.filter((v) => {
        const placa = (v.placa || "").toLowerCase();
        const marca = (v.nombre_marca || v.Marca?.nombre || "").toLowerCase();
        const modelo = (
          v.nombre_modelo ||
          v.Modelo?.nombre ||
          ""
        ).toLowerCase();
        return (
          placa.includes(needle) ||
          marca.includes(needle) ||
          modelo.includes(needle)
        );
      });
    });
  }

  function filterDrivers(val, update) {
    update(() => {
      if (!val) {
        driverOptions.value = [...props.driversList];
        return;
      }
      const needle = val.toLowerCase();
      driverOptions.value = props.driversList.filter((d) => {
        const cedula = (d.cedula || "").toLowerCase();
        const nombre = (d.nombre || "").toLowerCase();
        const apellido = (d.apellido || "").toLowerCase();
        return (
          cedula.includes(needle) ||
          nombre.includes(needle) ||
          apellido.includes(needle)
        );
      });
    });
  }

  function filterWarehousemen(val, update) {
    update(() => {
      if (!val) {
        warehousemanOptions.value = [...props.warehousemenList];
        return;
      }
      const needle = val.toLowerCase();
      warehousemanOptions.value = props.warehousemenList.filter((w) => {
        const nombre = (w.nombre || "").toLowerCase();
        const apellido = (w.apellido || "").toLowerCase();
        const cedula = (w.cedula || "").toLowerCase();
        return (
          nombre.includes(needle) ||
          apellido.includes(needle) ||
          cedula.includes(needle)
        );
      });
    });
  }

  // Label getters
  function getVehicleLabel(opt) {
    if (!opt || typeof opt !== "object") return "";
    const marca = opt.nombre_marca || opt.Marca?.nombre || "";
    const modelo = opt.nombre_modelo || opt.Modelo?.nombre || "";
    return `${opt.placa || ""} - ${marca} ${modelo}`.trim();
  }

  function getDriverLabel(opt) {
    if (!opt || typeof opt !== "object") return "";
    return `${opt.cedula || ""} - ${opt.nombre || ""} ${
      opt.apellido || ""
    }`.trim();
  }

  function getWarehousemanLabel(opt) {
    if (!opt || typeof opt !== "object") return "";
    return `${opt.nombre || ""} ${opt.apellido || ""}`.trim();
  }

  return {
    vehicleOptions,
    driverOptions,
    warehousemanOptions,
    filterVehicles,
    filterDrivers,
    filterWarehousemen,
    getVehicleLabel,
    getDriverLabel,
    getWarehousemanLabel,
  };
}
