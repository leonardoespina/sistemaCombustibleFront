export const PERMISSIONS = {
    VIEW_DASHBOARD_ALMACEN: "view_dashboard_almacen",
    VIEW_DASHBOARD_ESTANDAR: "view_dashboard_estandar",
    VIEW_OPERACIONES_TANQUES: "view_operations_tanques",
    MANAGE_OPERACIONES_TANQUES: "manage_operations_tanques",
    VIEW_INVENTARIO: "view_inventario",
    VIEW_REPORTES_GLOB: "view_reportes_glob",
    VIEW_REPORTE_DIARIO: "view_reporte_diario",
    VIEW_REPORTE_DESPACHOS: "view_reporte_despachos",
    VIEW_VALIDACION_CIERRE: "view_validacion_cierre",
    VIEW_SOLICITUDES: "view_solicitudes",
    CREATE_SOLICITUD: "create_solicitud",
    APPROVE_DISPATCHES: "approve_dispatches",
    CREATE_CISTERNA: "create_cisterna",
    CREATE_TRANSFERENCIA: "create_transferencia",
    MANAGE_USERS: "manage_users",
    VIEW_REPORTE_CONSUMO: "view_reporte_consumo",
    VIEW_MIS_CUPOS: "view_mis_cupos",
    VIEW_MIS_DESPACHOS: "view_mis_despachos",
    REJECT_SOLICITUD: "reject_solicitud",
};

export const ROLE_PERMISSIONS = {
    ADMIN: Object.values(PERMISSIONS),

    ESTANDAR: [
        PERMISSIONS.VIEW_DASHBOARD_ESTANDAR,
        PERMISSIONS.VIEW_SOLICITUDES,
        PERMISSIONS.VIEW_MIS_CUPOS,
        PERMISSIONS.VIEW_MIS_DESPACHOS,
    ],

    SEGURIDAD: [
        PERMISSIONS.VIEW_DASHBOARD_ALMACEN,
        PERMISSIONS.VIEW_SOLICITUDES,
        PERMISSIONS.VIEW_OPERACIONES_TANQUES,
        PERMISSIONS.VIEW_VALIDACION_CIERRE,
        PERMISSIONS.VIEW_REPORTE_DIARIO,
        PERMISSIONS.VIEW_REPORTE_DESPACHOS,
        PERMISSIONS.VIEW_REPORTE_CONSUMO,
        PERMISSIONS.VIEW_MIS_CUPOS,
        PERMISSIONS.VIEW_MIS_DESPACHOS,
    ],

    INSPECTOR: [
        PERMISSIONS.VIEW_DASHBOARD_ESTANDAR,
        PERMISSIONS.VIEW_OPERACIONES_TANQUES,
        PERMISSIONS.VIEW_VALIDACION_CIERRE,
        PERMISSIONS.VIEW_MIS_CUPOS,
    ],

    ALMACEN: [
        PERMISSIONS.VIEW_DASHBOARD_ALMACEN,
        PERMISSIONS.VIEW_SOLICITUDES,
        PERMISSIONS.VIEW_OPERACIONES_TANQUES,
        PERMISSIONS.MANAGE_OPERACIONES_TANQUES,
        PERMISSIONS.CREATE_CISTERNA,
        PERMISSIONS.CREATE_TRANSFERENCIA,
        PERMISSIONS.VIEW_REPORTE_DIARIO,
        PERMISSIONS.VIEW_REPORTE_DESPACHOS,
        PERMISSIONS.VIEW_REPORTE_CONSUMO,
        PERMISSIONS.VIEW_MIS_CUPOS,
        PERMISSIONS.VIEW_MIS_DESPACHOS,
    ],

    PRESIDENCIA: [
        PERMISSIONS.VIEW_DASHBOARD_ALMACEN,
        PERMISSIONS.VIEW_SOLICITUDES,
        PERMISSIONS.VIEW_OPERACIONES_TANQUES,
        PERMISSIONS.MANAGE_OPERACIONES_TANQUES,
        PERMISSIONS.CREATE_CISTERNA,
        PERMISSIONS.CREATE_TRANSFERENCIA,
        PERMISSIONS.VIEW_VALIDACION_CIERRE,
        PERMISSIONS.VIEW_REPORTE_DIARIO,
        PERMISSIONS.VIEW_REPORTE_DESPACHOS,
        PERMISSIONS.VIEW_REPORTE_CONSUMO,
        PERMISSIONS.VIEW_MIS_CUPOS,
        PERMISSIONS.VIEW_MIS_DESPACHOS,
    ],
};

ROLE_PERMISSIONS.ALMACENISTA = ROLE_PERMISSIONS.ALMACEN;

export function hasPermission(user, permission) {
    if (!user) return false;

    // Bypass para Super Admin (Red de seguridad)
    if (user.rol_sistema === "ADMIN" || user.tipo_usuario === "ADMIN") return true;

    const role = user.rol_sistema || "ESTANDAR";
    const userPermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.ESTANDAR;

    // Si el rol tiene el permiso de forma estática, conceder acceso.
    if (userPermissions.includes(permission)) return true;

    // Lógicas dinámicas basadas en capacidad_solicitudes
    if (permission === PERMISSIONS.APPROVE_DISPATCHES) {
        return ["APROBADOR", "AMBOS"].includes(user.capacidad_solicitudes);
    }

    if (permission === PERMISSIONS.REJECT_SOLICITUD) {
        return user.capacidad_solicitudes === "AMBOS";
    }

    if (permission === PERMISSIONS.CREATE_SOLICITUD) {
        return ["SOLICITANTE", "AMBOS"].includes(user.capacidad_solicitudes);
    }

    return false;
}
