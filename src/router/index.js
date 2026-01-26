// src/router/index.js

import { createRouter, createWebHistory } from "vue-router";

// Definición de las rutas de la aplicación
const routes = [
  // --- RUTA CONTENEDORA PROTEGIDA ---
  // Esta ruta carga el MainLayout y aplica la protección de sesión a todas sus rutas hijas.
  {
    path: "/",
    component: () => import("../pages/layouts/MainLayout.vue"),

    ///layouts/MainLayout.vue
    // Guardia de navegación: se ejecuta antes de entrar a esta ruta o a sus hijas.
    beforeEnter: (to, from, next) => {
      const token = localStorage.getItem("token");
      if (token) {
        // Si hay un token, el usuario está logueado, permite el acceso.
        next();
      } else {
        // Si no hay token, redirige al usuario a la página de login.
        next("/login");
      }
    },
    // Rutas anidadas que se renderizarán dentro del <router-view> de MainLayout.vue
    children: [
      {
        path: "", // Coincide con la ruta raíz '/'
        name: "home",
        component: () => import("../pages/IndexPage.vue"),
      },
      {
        path: "huella",
        name: "fingerprint",
        component: () =>
          import("../pages/fingerprint/FingerprintManagementPage.vue"),
      },
      {
        path: "huella/verificar",
        name: "fingerprint-verify",
        component: () =>
          import("../pages/fingerprint/FingerprintVerifyPage.vue"),
      },
      {
        path: "subdependencias",
        name: "subdependencias",
        component: () => import("../pages/subdependencias/SubdependenciasPage.vue"),
      },
      {
        path: "usuarios", // Coincide con la ruta '/usuarios'
        name: "users",
        component: () => import("../pages/UsersPage.vue"),
      },
      {
        path: "/vehiculos/marcas", // -> /vehiculos/marcas
        name: "brand-management",
        component: () => import("../pages/vehicles/BrandPage.vue"), // Placeholder
      },
      {
        path: "/vehiculos/modelos",
        name: "model-management",
        component: () => import("../pages/vehicles/ModelPage.vue"), // Placeholder
      },
      {
        path: "/vehiculos/lista",
        name: "vehiculo",
        component: () => import("../pages/vehicles/VehicleListPage.vue"), // Placeholder
      },
      {
        path: "categorias",
        name: "categoria-list",
        component: () => import("../pages/categoria/CategoriaPage.vue"), 
      },
      {
        path: "dependencias",
        name: "dependency-list",
        component: () => import("../pages/dependencias/DependenciasPage.vue"),
      },
      {
        path: "tanques",
        name: "tank-list",
        component: () => import("../pages/tanks/TankPage.vue"),
      },
      {
        path: "almacenistas",
        name: "warehouseman-list",
        component: () => import("../pages/warehouse/WarehousemanPage.vue"),
      },
      {
        path: "despachos",
        name: "dispatch-list",
        component: () => import("../pages/dispatches/DispatchPage.vue"),
      },
      {
        path: "choferes",
        name: "driver-list",
        component: () => import("../pages/drivers/DriverPage.vue"),
      },
      {
        path: "cierres",
        name: "inventory-closing-list",
        component: () => import("../pages/closings/ClosingPage.vue"),
      },
      {
        path: "mediciones",
        name: "tank-measurement-list",
        component: () => import("../pages/measurements/MeasurementPage.vue"),
      },
      {
        path: "dispensadores",
        name: "dispenser-list",
        component: () => import("../pages/dispensers/DispenserPage.vue"),
      },
      {
        path: "cargas",
        name: "cistern-load-list",
        component: () => import("../pages/loads/CisternLoadPage.vue"),
      },
      {
        path: "transferencias-internas",
        name: "internal-transfer-list",
        component: () =>
          import("../pages/internal-transfers/InternalTransferPage.vue"),
      },
      {
        path: "reportes/pendientes",
        name: "report-pending-act",
        component: () => import("../pages/reports/PendingActPage.vue"),
      },
      {
        path: "reportes/consumo-categoria",
        name: "report-categoria-consumption",
        component: () =>
          import("../pages/reports/CategoriaConsumptionPage.vue"),
      },
      {
        path: "reportes/consumo-detallado-categoria",
        name: "report-categoria-detailed-consumption",
        component: () =>
          import("../pages/reports/CategoriaDetailedConsumptionPage.vue"),
      },
      {
        path: "reportes/consumo-vehiculo",
        name: "report-vehicle-consumption",
        component: () => import("../pages/reports/VehicleConsumptionPage.vue"),
      },
      {
        path: "reportes/historial-cierres",
        name: "report-closing-history",
        component: () => import("../pages/reports/ReporteCierrePage.vue"),
      },
      {
        path: "tipos-combustible",
        name: "tipo-combustible-list",
        component: () => import("../pages/combustibles/TipoCombustiblePage.vue"),
      },
      {
        path: "cupos",
        name: "cupo-list",
        component: () => import("../pages/cupos/CupoPage.vue"),
      },
      {
        path: "precios",
        name: "precio-management",
        component: () => import("../pages/precios/PrecioPage.vue"),
      },
      {
        path: "llenaderos",
        name: "llenadero-list",
        component: () => import("../pages/llenaderos/LlenaderoPage.vue"),
      },

      // Aquí puedes seguir añadiendo más rutas protegidas, como /vehiculos, etc.
    ],
  },

  // --- RUTA DE LOGIN PÚBLICA (CON PROTECCIÓN INVERSA) ---
  {
    path: "/login",
    name: "login",
    component: () => import("../pages/LoginPage.vue"),
    // Guardia de navegación: evita que un usuario ya logueado vea la página de login.
    beforeEnter: (to, from, next) => {
      const token = localStorage.getItem("token");
      if (token) {
        // Si el usuario ya tiene un token, lo redirigimos a la página principal.
        next({ name: "home" }); // Redirige a la ruta con nombre 'home' (es decir, '/')
      } else {
        // Si no hay token, permite el acceso a la página de login.
        next();
      }
    },
  },

  // --- RUTA DE FALLBACK (ERROR 404) ---
  // Esta ruta "atrapa" cualquier URL que no coincida con las rutas definidas anteriormente.
  {
    path: "/:catchAll(.*)*",
    name: "NotFound",
    component: () => import("../pages/ErrorNotFound.vue"),
  },
];

// Creación de la instancia del router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Exportación del router para ser usado en main.js
export default router;
