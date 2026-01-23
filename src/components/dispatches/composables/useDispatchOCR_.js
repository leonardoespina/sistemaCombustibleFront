// src/composables/dispatch/useDispatchOCR.js
import { ref, onUnmounted } from "vue";
import { createWorker } from "tesseract.js";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN Y PATRONES
// ═══════════════════════════════════════════════════════════════════════════
const OCR_CONFIG = {
  lang: "spa",
  // Caracteres permitidos (mejora precisión)
  whitelist:
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-.:/ ",
  // Modo de segmentación: bloque de texto uniforme
  pageSegMode: "6",
};

const TICKET_PATTERNS = {
  // "Solicitud No: 12345" o "No. 12345"
  ticket: /Solicitud\s*No[:.]?\s*([A-Z0-9]+)/i,

  // "LTS: 50" o "50 LTS"
  cantidad: /LTS\s*[:.]?\s*(\d+)|(\d+)\s*LTS/i,

  // "Region: GASOIL" o "Renglon: GASOLINA" (OCR puede confundir letras)
  combustible:
    /(?:Region|Renglon|Rengion|Rengl[oó]n)\s*[:.;,]*\s*(GASOIL|GASOLINA)/i,

  // "Placa: ABC123"
  placa: /Placa\s*[:.;,]*\s*([A-Z0-9-]+)/i,

  // "C.I: V-12345678" o "CI 12345678"
  cedula: /C\.?I\.?\s*[:.;,]*\s*([VvEe]?[-]?\d+)/i,

  // "Recibido: Juan Perez" o "Solicitante: Maria"
  nombre: /(?:Recibido|Recibo|Solicitante)\s*[:.;,]*\s*([^\n]+)/i,
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export function useDispatchOCR(
  formData,
  props,
  { resetDestinoFields, updateVehicleOptions, updateDriverOptions, notify }
) {
  const isScanning = ref(false);
  const fileInputRef = ref(null);

  // Worker reutilizable (no se destruye entre escaneos)
  let worker = null;
  let isWorkerReady = false;

  // ═══════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN DEL WORKER (una sola vez)
  // ═══════════════════════════════════════════════════════════════════════
  async function initWorker() {
    if (isWorkerReady && worker) return worker;

    console.log("🔧 Inicializando Tesseract worker...");

    worker = await createWorker(OCR_CONFIG.lang, 1, {
      logger: (m) => {
        if (m.status === "loading tesseract core") {
          console.log("📦 Cargando núcleo...");
        } else if (m.status === "loading language traineddata") {
          console.log("📚 Cargando idioma español...");
        }
      },
    });

    // Configurar parámetros optimizados
    await worker.setParameters({
      tessedit_char_whitelist: OCR_CONFIG.whitelist,
      tessedit_pageseg_mode: OCR_CONFIG.pageSegMode,
      preserve_interword_spaces: "1",
    });

    isWorkerReady = true;
    console.log("✅ Worker listo");

    return worker;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PREPROCESAMIENTO DE IMAGEN
  // ═══════════════════════════════════════════════════════════════════════
  async function preprocessImage(file) {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // 1. Redimensionar si es muy grande
        let { width, height } = img;
        const maxSize = 1500;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // 2. Obtener datos de píxeles
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 3. Convertir a escala de grises + aumentar contraste
        for (let i = 0; i < data.length; i += 4) {
          // Escala de grises ponderada
          let gray =
            data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

          // Aumentar contraste (factor 1.4)
          gray = (gray - 128) * 1.4 + 128;
          gray = Math.max(0, Math.min(255, gray));

          data[i] = data[i + 1] = data[i + 2] = gray;
        }

        // 4. Binarización simple (umbral 128)
        for (let i = 0; i < data.length; i += 4) {
          const value = data[i] > 128 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = value;
        }

        ctx.putImageData(imageData, 0, 0);

        // 5. Retornar como Blob
        canvas.toBlob((blob) => {
          // Liberar memoria
          URL.revokeObjectURL(img.src);
          resolve(blob);
        }, "image/png");
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRIGGER SCAN
  // ═══════════════════════════════════════════════════════════════════════
  function triggerScan() {
    if (fileInputRef.value) {
      fileInputRef.value.click();
    } else {
      console.error("No se encontró el elemento input file");
      notify({
        type: "negative",
        message: "Error técnico: Input de cámara no encontrado",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PROCESAR ARCHIVO
  // ═══════════════════════════════════════════════════════════════════════
  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    isScanning.value = true;

    try {
      // 1. Preprocesar imagen
      console.log("📷 Preprocesando imagen...");
      const processedImage = await preprocessImage(file);

      // 2. Inicializar worker (reutilizable)
      const w = await initWorker();

      // 3. Reconocer texto
      console.log("🔍 Reconociendo texto...");
      const {
        data: { text, confidence },
      } = await w.recognize(processedImage);

      console.log("📝 Texto escaneado:", text);
      console.log("📊 Confianza:", confidence.toFixed(1) + "%");

      // 4. Parsear y aplicar datos
      const result = parseTicketData(text);

      if (result.foundAny) {
        notify({
          type: "positive",
          message: `Datos detectados (${confidence.toFixed(0)}% confianza)`,
        });
      } else {
        notify({
          type: "warning",
          message: "No se detectaron datos claros. Intente de nuevo.",
        });
      }
    } catch (error) {
      console.error("Error OCR:", error);
      notify({
        type: "negative",
        message: "Error al procesar la imagen",
      });
    } finally {
      isScanning.value = false;
      event.target.value = "";
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PARSEAR DATOS DEL TICKET
  // ═══════════════════════════════════════════════════════════════════════
  function parseTicketData(text) {
    let foundAny = false;

    // 1. Número de Ticket
    const ticketMatch = text.match(TICKET_PATTERNS.ticket);
    if (ticketMatch?.[1]) {
      formData.value.numero_ticket = ticketMatch[1];
      foundAny = true;
    }

    // 2. Cantidad Solicitada
    const cantidadMatch = text.match(TICKET_PATTERNS.cantidad);
    if (cantidadMatch) {
      const cantidad = cantidadMatch[1] || cantidadMatch[2];
      if (cantidad) {
        formData.value.cantidad_solicitada = parseInt(cantidad, 10);
        foundAny = true;
      }
    }

    // 3. Tipo de Combustible → Dispensador
    const combustibleMatch = text.match(TICKET_PATTERNS.combustible);
    if (combustibleMatch?.[1]) {
      const tipoCombustible = combustibleMatch[1].toUpperCase();
      console.log("⛽ Combustible detectado:", tipoCombustible);

      const dispensador = props.dispensersList?.find(
        (d) => d.tipo_combustible === tipoCombustible
      );

      if (dispensador) {
        formData.value.id_dispensador = dispensador.id_dispensador;
        foundAny = true;
      }
    }

    // 4. Placa → Vehículo
    const placaMatch = text.match(TICKET_PATTERNS.placa);
    if (placaMatch?.[1]) {
      const vehiculo = findVehicleByPlaca(placaMatch[1]);

      if (vehiculo) {
        formData.value.tipo_destino = "VEHICULO";
        resetDestinoFields?.();
        formData.value.id_vehiculo = vehiculo.id_vehiculo;
        updateVehicleOptions?.([...props.vehiclesList]);

        // Asignar chofer por defecto si existe
        if (vehiculo.id_chofer_default) {
          formData.value.id_chofer = vehiculo.id_chofer_default;
          updateDriverOptions?.([...props.driversList]);
        }
        foundAny = true;
      }
    }

    // 5. Chofer (por cédula o nombre)
    if (!formData.value.id_chofer) {
      const chofer = findDriver(text);

      if (chofer) {
        formData.value.id_chofer = chofer.id_chofer;
        updateDriverOptions?.([...props.driversList]);
        foundAny = true;
      }
    }

    return { foundAny };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS DE BÚSQUEDA
  // ═══════════════════════════════════════════════════════════════════════
  function findVehicleByPlaca(placaRaw) {
    const placaClean = placaRaw.replace(/[\s-]/g, "").toUpperCase();

    if (placaClean.length < 3) return null;

    return props.vehiclesList?.find((v) => {
      if (!v.placa) return false;

      const vPlacaClean = v.placa.replace(/[\s-]/g, "").toUpperCase();

      return (
        vPlacaClean === placaClean ||
        placaClean.includes(vPlacaClean) ||
        vPlacaClean.includes(placaClean)
      );
    });
  }

  function findDriver(text) {
    // Intentar por cédula primero
    const ciMatch = text.match(TICKET_PATTERNS.cedula);
    if (ciMatch) {
      const ciClean = ciMatch[1].replace(/\D/g, "");

      const byCI = props.driversList?.find(
        (d) => d.cedula?.replace(/\D/g, "") === ciClean
      );

      if (byCI) return byCI;
    }

    // Intentar por nombre
    const nombreMatch = text.match(TICKET_PATTERNS.nombre);
    if (nombreMatch) {
      const nombreClean = nombreMatch[1].replace(/[^A-Z]/gi, "").toUpperCase();

      if (nombreClean.length < 4) return null;

      return props.driversList?.find((d) => {
        const fullName = `${d.nombre || ""}${d.apellido || ""}`
          .replace(/[^A-Z]/gi, "")
          .toUpperCase();

        return (
          fullName === nombreClean ||
          (fullName.length > 5 && nombreClean.includes(fullName)) ||
          (nombreClean.length > 5 && fullName.includes(nombreClean))
        );
      });
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════
  async function terminate() {
    if (worker) {
      await worker.terminate();
      worker = null;
      isWorkerReady = false;
    }
  }

  // Pre-inicializar worker cuando se monta el componente (opcional)
  // initWorker().catch(console.error);

  return {
    isScanning,
    fileInputRef,
    triggerScan,
    handleFileUpload,
    terminate, // Exponer para cleanup manual si es necesario
  };
}
