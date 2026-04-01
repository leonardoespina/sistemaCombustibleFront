# 🛡️ Sistema de Gestión de Combustible (SGC)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Vue](https://img.shields.io/badge/Vue.js-3.5+-4FC08D?logo=vue.js&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)

## 📋 Descripción General
El **Sistema de Gestión de Combustible (SGC)** es una solución integral diseñada para la administración, control y auditoría de inventarios de combustible, despachos y operaciones logísticas. El sistema integra autenticación biométrica y generación de reportes avanzados para garantizar la máxima seguridad y trazabilidad en cada operación.

---

## 🏗️ Arquitectura del Sistema

El sistema utiliza una arquitectura desacoplada de tipo **Cliente-Servidor**:

### 🔹 Backend (Core API)
Construido sobre **Node.js** y **Express**, gestiona la lógica de negocio y la persistencia de datos.
- **Engine:** Node.js v18+
- **ORM:** Sequelize (PostgreSQL)
- **Seguridad:** JWT (JSON Web Tokens), Bcryptjs, Helmet y Rate Limiting.
- **Comunicación:** RESTful API & WebSockets (Socket.io) para actualizaciones en tiempo real.
- **Base de Datos:** PostgreSQL (Relacional) con soporte para migraciones.

### 🔹 Frontend (Interfaz de Usuario)
Una SPA (Single Page Application) moderna desarrollada con **Vue 3** y **Quasar Framework**.
- **UI Framework:** Quasar (Material Design) para una experiencia fluida y responsive.
- **Estado:** Pinia (Store management).
- **Gráficos:** Apache ECharts para Dashboards dinámicos.
- **Reporting:** JsPDF & AutoTable para generación de reportes legales y técnicos.
- **Middleware:** Integración nativa con SDK de DigitalPersona para biometría.

---

## 🚀 Módulos Principales

### ⛽ Control de Inventario
- **Tanques y Medición:** Registro detallado de niveles, capacidad y alertas de bajo stock.
- **Evaporación:** Cálculo automático de mermas y ajustes de inventario.
- **Transferencias:** Gestión de movimientos entre tanques y llenaderos.

### 🚛 Logística y Despacho
- **Carga de Cisternas:** Control de ingresos de combustible a la planta.
- **Despacho Directo:** Validación de vehículos y conductores.
- **Gestión de Cupos:** Asignación de límites de combustible por dependencia o vehículo.

### 🔐 Seguridad y Auditoría
- **Biometría:** Validación de identidad mediante huella dactilar para aprobaciones críticas.
- **Gestión de Usuarios:** Control de acceso basado en roles (RBAC).
- **Validaciones:** Escaneo de códigos QR y procesamiento de imágenes (OCR) para facturas/documentos.

---

## 🛠️ Requisitos e Instalación

### Requisitos Previos
- Node.js (v18 o superior)
- PostgreSQL (v15 o superior)
- Git

### Configuración del Backend
```bash
cd back
npm install
# Configurar variables de entorno (.env)
npm run dev
```

### Configuración del Frontend
```bash
cd front
npm install
# Configurar variables de entorno (.env.development)
npm run dev
```

---

## 📊 Stack Tecnológico (Resumen)

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | Vue 3, Vite, Quasar, Pinia, Axios |
| **Backend** | Express, Node.js, Sequelize, Socket.io |
| **Base de Datos** | PostgreSQL, pg-hstore |
| **Reportes** | JsPDF, ExcelJS (xlsx), ECharts |
| **Hardware** | DigitalPersona SDK (Biometría) |
| **Utilidades** | Tesseract.js (OCR), QR Code Reader |

---

## 📄 Licencia
© 2026 - Sistema de Gestión de Combustible. Todos los derechos reservados.
Developed by **Software Architecture Team**.
