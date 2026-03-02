import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useClosingStore = defineStore("closings", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);

  // Estado para guardar los datos del acta que se va a visualizar
  const selectedActaData = ref(null);

  // --- ACTIONS ---

  async function fetchHistory() {
    loading.value = true;
    try {
      const response = await api.get("/cierres");
      rows.value = response.data;
    } finally {
      loading.value = false;
    }
  }

  async function generateClosing(data) {
    loading.value = true;
    try {
      const response = await api.post("/cierres", data);
      $q.notify({ type: "positive", message: response.data.msg });

      // Recargar el historial para ver el nuevo cierre
      await fetchHistory();
      return true;
    } catch (error) {
      // El interceptor global ya muestra el error, pero devolvemos false
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchActaData(uuid) {
    loading.value = true;
    try {
      const response = await api.get(`/cierres/acta/${uuid}`);
      selectedActaData.value = response.data;
      console.log(selectedActaData.value);
      return true;
    } catch (error) {
      $q.notify({
        type: "negative",
        message: "No se pudieron cargar los datos del acta.",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function revertClosing(uuid) {
    loading.value = true;
    try {
      const response = await api.delete(`/cierres/revertir/${uuid}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchHistory(); // Recargamos para que desaparezca de la lista
      return true;
    } catch (error) {
      // El interceptor ya notifica, pero devolvemos false para control en el componente
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    rows,
    loading,
    selectedActaData,
    fetchHistory,
    generateClosing,
    fetchActaData,
    revertClosing,
  };
});
