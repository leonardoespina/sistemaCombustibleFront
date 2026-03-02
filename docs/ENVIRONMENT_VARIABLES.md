# 🌍 Configuración de Variables de Entorno

Este proyecto utiliza variables de entorno para configurar las URLs del backend (API y Socket.io) según el entorno de ejecución.

## 📁 Archivos de Entorno

- **`.env.development`** - Desarrollo (se usa con `npm run dev`)
- **`.env.production`** - Producción (se usa con `npm run build`)
- **`.env.example`** - Plantilla de ejemplo (no se usa, solo referencia)
- **`.env.local`** - Configuración local personal (⚠️ NO commitear, crear manualmente)

## 🔑 Variables Disponibles

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base del backend (sin /api) | `http://192.168.1.105:3000` |
| `VITE_SOCKET_URL` | URL del servidor Socket.io | `http://192.168.1.105:3000` |

> **Nota**: En Vite, las variables de entorno DEBEN comenzar con `VITE_` para ser expuestas al cliente.

## 🚀 Uso

### En Desarrollo

```bash
npm run dev
```

Usa automáticamente `.env.development`

**Valores actuales**:
```env
VITE_API_BASE_URL=http://192.168.1.105:3000
VITE_SOCKET_URL=http://192.168.1.105:3000
```

### En Producción

```bash
npm run build
npm run preview
```

Usa automáticamente `.env.production`

**Valores actuales**:
```env
VITE_API_BASE_URL=http://10.60.0.90:3000
VITE_SOCKET_URL=http://10.60.0.90:3000
```

### Configuración Local Personalizada

Si necesitas usar URLs diferentes en tu máquina local:

1. Copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` con tus valores:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   VITE_SOCKET_URL=http://localhost:3000
   ```

3. `.env.local` tiene prioridad sobre `.env.development` y **NO** se sube a git

## 📝 Orden de Prioridad

Vite carga los archivos en este orden (de mayor a menor prioridad):

1. `.env.local` (máxima prioridad, solo local)
2. `.env.[mode]` (ej: `.env.development` o `.env.production`)
3. `.env`

## 💻 Uso en el Código

### API (axios)

```javascript
// src/api/index.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});
```

### Socket.io

```javascript
// src/services/socket.js
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ["websocket", "polling"],
});
```

## ⚠️ Importante

- **NO** commitear `.env.local` al repositorio (ya está en `.gitignore`)
- **SÍ** commitear `.env.development` y `.env.production` (valores compartidos del equipo)
- **SÍ** commitear `.env.example` (plantilla para nuevos desarrolladores)
- Reiniciar el servidor de desarrollo (`npm run dev`) después de modificar archivos `.env`

## 🔧 Agregar Nuevas Variables

1. Define la variable con prefijo `VITE_` en los archivos `.env.*`:
   ```env
   VITE_MI_NUEVA_VARIABLE=valor
   ```

2. Úsala en el código:
   ```javascript
   const miVariable = import.meta.env.VITE_MI_NUEVA_VARIABLE;
   ```

3. Agrega a `.env.example` como documentación

## 🐛 Troubleshooting

**Problema**: Las variables no se cargan

- ✅ Verifica que comiencen con `VITE_`
- ✅ Reinicia el servidor de desarrollo
- ✅ Verifica que el archivo `.env` esté en la raíz del proyecto
- ✅ Comprueba que no haya errores de sintaxis

**Problema**: Diferentes URLs en el equipo

- ✅ Crea un `.env.local` con tus valores personales
- ✅ No modifiques `.env.development` (es compartido)

## 📚 Documentación

- [Vite - Variables de Entorno](https://vitejs.dev/guide/env-and-mode.html)
- [Variables de Entorno en Vite](https://vitejs.dev/config/shared-options.html#envprefix)
