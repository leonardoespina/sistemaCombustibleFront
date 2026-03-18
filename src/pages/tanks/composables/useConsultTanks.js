import { onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useTankStore } from '../../../stores/tankStore';
import { useLlenaderoStore } from '../../../stores/llenaderoStore';

export function useConsultTanks() {
  const tankStore = useTankStore();
  const llenaderoStore = useLlenaderoStore();

  // Extract reactive references from stores
  const { 
    tanquesLista: tanques, 
    loadingLista: loadingTanques,
    filter: tankFilter
  } = storeToRefs(tankStore);

  const { 
    rows: llenaderosStats, 
    loading: loadingLlenaderos 
  } = storeToRefs(llenaderoStore);

  // Lifecycle
  onMounted(async () => {
    // 1. Initial Fetch
    // We adjust llenaderos payload size (e.g., limit: 100) or just rely on the store's default
    // We update the limit directly through the store's pagination if needed
    llenaderoStore.pagination.rowsPerPage = 100;
    
    await Promise.all([
      llenaderoStore.fetchLlenaderos(),
      tankStore.fetchTanksList()
    ]);

    // 2. Initialize Sockets to listen to real-time events
    tankStore.initSocket();
    llenaderoStore.initSocket();
  });

  onUnmounted(() => {
    // Clean up connections to avoid memory leaks or duplicated listeners
    tankStore.cleanupSocket();
    llenaderoStore.cleanupSocket();
    
    // Reset filters
    tankFilter.value = "";
  });

  // Utilities
  function getProgressColor(ratio) {
    if (ratio >= 0.9) return "negative";
    if (ratio >= 0.7) return "warning";
    if (ratio <= 0.2 && ratio > 0) return "orange";
    return "positive";
  }

  return {
    // State
    llenaderosStats,
    tanques,
    loadingLlenaderos,
    loadingTanques,
    filter: tankFilter,
    
    // Methods
    getProgressColor
  };
}
