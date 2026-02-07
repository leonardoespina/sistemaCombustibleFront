// src/api/index.js

import axios from "axios";
import { Notify, Loading } from "quasar";

// Creamos una instancia de Axios con configuración base
const api = axios.create({
  baseURL: "http://10.60.0.90:3000/api", //"http://10.60.6.57:3000/api", // O http://localhost:3000/api
});

// Contador para manejar múltiples peticiones simultáneas
let pendingRequests = 0;

const showLoading = () => {
  pendingRequests++;
  Loading.show({
    message: 'Procesando...',
    // spinner: QSpinnerGears // Opcional
  });
};

const hideLoading = () => {
  pendingRequests--;
  if (pendingRequests <= 0) {
    pendingRequests = 0;
    Loading.hide();
  }
};

// --- ¡NUEVO! INTERCEPTOR DE PETICIONES ---
// Esta función se ejecuta ANTES de que cada petición sea enviada.
api.interceptors.request.use(
  (config) => {
    showLoading();
    // 1. Buscamos el token en localStorage
    const token = localStorage.getItem("token");

    // 2. Si el token existe, lo añadimos a las cabeceras de la petición
    if (token) {
      // El formato 'Bearer ' es un estándar. Tu backend lo espera así.
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 3. Devolvemos la configuración modificada para que la petición continúe
    return config;
  },
  (error) => {
    hideLoading();
    // Manejar errores de configuración de la petición
    return Promise.reject(error);
  }
);

// --- INTERCEPTOR DE RESPUESTAS (YA LO TENÍAS) ---
// Esta función se ejecuta DESPUÉS de recibir una respuesta.
api.interceptors.response.use(
  (response) => {
    hideLoading();
    return response;
  },
  (error) => {
    hideLoading();
    const message = error.response?.data?.msg || "Ocurrió un error inesperado.";

    Notify.create({
      type: "negative",
      message: message,
      position: "top",
      timeout: 3000,
    });

    // Si el error es 401 (Token no válido/expirado), podríamos redirigir al login
    // EXCEPCIÓN: Si el error viene de /biometria/verificar o /despacho/validar-firma con status 401, NO redirigir 
    // ya que el backend usa 401 para "huella no coincide" en modo 1:1.
    if (error.response && error.response.status === 401) {
      const isBiometricVerify = error.config.url.includes('/biometria/verificar') ||
        error.config.url.includes('/despacho/validar-firma') ||
        error.config.url.includes('/despacho/imprimir');

      if (!isBiometricVerify) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        Notify.create({
          type: "warning",
          message: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
          position: "top",
        });
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Exportamos la instancia configurada para usarla en los componentes
export default api;
