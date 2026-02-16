// src/router/index.js

import { createRouter, createWebHistory } from "vue-router";

// Definición de las rutas de la aplicación
const routes = [
  // --- RUTA CONTENEDORA PROTEGIDA ---
  // Esta ruta carga el MainLayout y aplica la protección de sesión a todas sus rutas hijas.
  {
    path: "/",
    component: () => import("../pages/layouts/MainLayout.vue"),

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
        meta: { requiresAdmin: true },
        component: () =>
          import("../pages/fingerprint/FingerprintManagementPage.vue"),
      },
      {
        path: "huella/verificar",
        name: "fingerprint-verify",
        meta: { requiresAdmin: true },
        component: () =>
          import("../pages/fingerprint/FingerprintVerifyPage.vue"),
      },
      {
        path: "subdependencias",
        name: "subdependencias",
        meta: { requiresAdmin: true },
        component: () =>
          import("../pages/subdependencias/SubdependenciasPage.vue"),
      },
      {
        path: "usuarios", // Coincide con la ruta '/usuarios'
        name: "users",
        meta: { requiresAdmin: true },
        component: () => import("../pages/users/UsersPage.vue"),
      },
      {
        path: "/vehiculos/marcas", // -> /vehiculos/marcas
        name: "brand-management",
        meta: { requiresAdmin: true },
        component: () => import("../pages/vehicles/BrandPage.vue"), // Placeholder
      },
      {
        path: "/vehiculos/modelos",
        name: "model-management",
        meta: { requiresAdmin: true },
        component: () => import("../pages/vehicles/ModelPage.vue"), // Placeholder
      },
      {
        path: "/vehiculos/lista",
        name: "vehiculo",
        meta: { requiresAdmin: true },
        component: () => import("../pages/vehicles/VehicleListPage.vue"), // Placeholder
      },
      {
        path: "categorias",
        name: "categoria-list",
        meta: { requiresAdmin: true },
        component: () => import("../pages/categoria/CategoriaPage.vue"),
      },
      {
        path: "dependencias",
        name: "dependency-list",
        meta: { requiresAdmin: true },
        component: () => import("../pages/dependencias/DependenciasPage.vue"),
      },
      {
        path: "tanques",
        name: "tank-list",
        meta: { requiresAdmin: true },
        component: () => import("../pages/tanks/TankPage.vue"),
      },
      {
        path: "measurements",
        name: "measurement-list",
        meta: {
          allowedRoles: ["ADMIN", "GERENTE", "JEFE DIVISION", "ALMACENISTA"],
        },
        component: () => import("../pages/measurements/MeasurementPage.vue"),
      },
      {
        path: "loads",
        name: "cistern-loads",
        meta: {
          allowedRoles: ["ADMIN", "GERENTE", "JEFE DIVISION", "ALMACENISTA"],
        },
        component: () => import("../pages/loads/CisternLoadPage.vue"),
      },
      {
        path: "internal-transfers",
        name: "internal-transfers",
        meta: {
          allowedRoles: ["ADMIN", "GERENTE", "JEFE DIVISION", "ALMACENISTA"],
        },
        component: () =>
          import("../pages/internal-transfers/InternalTransferPage.vue"),
      },
      {
        path: "dispensadores",
        name: "dispenser-list",
        component: () => import("../pages/dispensers/DispenserPage.vue"),
      },

      {
        path: "tipos-combustible",
        name: "tipo-combustible-list",
        meta: { requiresAdmin: true },
        component: () =>
          import("../pages/combustibles/TipoCombustiblePage.vue"),
      },
      {
        path: "cupos",
        name: "cupo-list",
        meta: { requiresAdmin: true },
        component: () => import("../pages/cupos/CupoPage.vue"),
      },
      {
        path: "precios",
        name: "precio-management",
        meta: { requiresAdmin: true },
        component: () => import("../pages/precios/PrecioPage.vue"),
      },
      {
        path: "llenaderos",
        name: "llenadero-list",
        meta: { requiresAdmin: true },
        component: () => import("../pages/llenaderos/LlenaderoPage.vue"),
      },
      {
        path: "movimientos-llenadero",
        name: "movimiento-llenadero-list",
        meta: {
          allowedRoles: ["ADMIN", "GERENTE", "JEFE DIVISION", "ALMACENISTA"],
        },
        component: () =>
          import("../pages/llenaderos/MovimientosLlenaderoPage.vue"),
      },
      {
        path: "evaporaciones",
        name: "evaporacion-list",
        meta: {
          allowedRoles: ["ADMIN", "GERENTE", "JEFE DIVISION", "ALMACENISTA"],
        },
        component: () =>
          import("../pages/llenaderos/GestionEvaporacionPage.vue"),
      },
      {
        path: "solicitudes",
        name: "request-list",
        component: () => import("../pages/dispatches/RequestListPage.vue"),
      },
      {
        path: "despacho",
        name: "despacho-print",
        component: () => import("../pages/dispatches/PrintRequestsPage.vue"),
      },
      {
        path: "validacion",
        name: "validation-page",
        component: () => import("../pages/dispatches/ValidationPage.vue"),
      },
      {
        path: "reportes/diario",
        name: "reporte-diario",
        meta: {
          allowedRoles: ["ADMIN", "GERENTE", "JEFE DIVISION", "ALMACENISTA"],
        },
        component: () => import("../pages/reports/ReporteDiarioPage.vue"),
      },
      {
        path: "reportes/despachos",
        name: "reporte-despachos",
        meta: {
          allowedRoles: ["ADMIN", "GERENTE", "JEFE DIVISION", "ALMACENISTA"],
        },
        component: () => import("../pages/reports/ReporteDespachosPage.vue"),
      },
      {
        path: "reportes/consumo-dependencia",
        name: "reporte-consumo-dependencia",
        meta: {
          allowedRoles: ["ADMIN", "GERENTE", "JEFE DIVISION"],
        },
        component: () =>
          import("../pages/reports/DependenciaConsumptionPage.vue"),
      },
      {
        path: "reportes/mis-cupos",
        name: "reporte-mis-cupos",
        // Sin restricciones de rol, accesible para cualquier usuario autenticado
        component: () => import("../pages/reports/MisCuposPage.vue"),
      },

      // Aquí puedes seguir añadiendo más rutas protegidas, como /vehiculos, etc.
    ],
  },

  // --- RUTA DE LOGIN PÚBLICA (CON PROTECCIÓN INVERSA) ---
  {
    path: "/login",
    name: "login",
    component: () => import("../pages/LoginPage.vue"),
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

/**
 * Guardia de Navegación Global
 * Centraliza la protección de rutas por Token y por Rol.
 */
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 1. Permitir acceso libre a login si no hay token
  if (to.path === "/login") {
    if (token) {
      return next({ name: "home" }); // Si ya tiene token, no dejar entrar a login
    }
    return next();
  }

  // 2. Si no hay token y no es login, forzar login
  if (!token) {
    return next("/login");
  }

  // 3. Protección por Roles
  // 3.1 Soporte para múltiples roles permitidos (allowedRoles)
  if (to.meta.allowedRoles) {
    if (!to.meta.allowedRoles.includes(user.tipo_usuario)) {
      return next({ name: "home" });
    }
    return next();
  }

  // 3.2 Retrocompatibilidad con requiresAdmin
  if (to.meta.requiresAdmin && user.tipo_usuario !== "ADMIN") {
    return next({ name: "home" });
  }

  next();
});

// Exportación del router para ser usado en main.js
export default router;
