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
  ticket:
    /(?:Solicitud\s*No|Solicitud|Ticket|Factura|Recibo|Nro|No)\s*[:.]?\s*([A-Z0-9-]+)/i,

  // "LTS: 50" o "50 LTS"
  cantidad: /LTS\s*[:.]?\s*(\d+)|(\d+)\s*LTS/i,

  // "Region: GASOIL" o "Renglon: GASOLINA"
  combustible:
    /(?:Region|Renglon|Rengion|Rengl[oó]n)\s*[:.;,]*\s*(GASOIL|GASOLINA)/i,

  // "Placa: ABC1234"
  placa: /Placa\s*[:.;,]*\s*([A-Z0-9-]+)/i,

  // "C.I: V-12345678" o "CI 12345678"
  cedula: /C\.?I\.?\s*[:.;,]*\s*([VvEe]?[-]?\d+)/i,

  // "Recibido: Juan Perez"
  nombre: /(?:Recibido|Recibo|Solicitante)\s*[:.;,]*\s*([^\n]+)/i,

  // "Almacen: XXXXX XXXX" o "Almacen XXXX XXXX"
  almacen: /Almacen\s*[:.;,]*\s*([^\n]+)/i,
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export function useDispatchOCR(
  formData,
  props,
  {
    resetDestinoFields,
    setVehicleOptions,
    setDriverOptions,
    setWarehousemanOptions,
    notify,
  }
) {
  const isScanning = ref(false);

  // Worker reutilizable
  let worker = null;
  let isWorkerReady = false;

  // ═══════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN DEL WORKER
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
  async function preprocessImage(imageBlob) {
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
          URL.revokeObjectURL(img.src);
          resolve(blob);
        }, "image/png");
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PROCESAR BLOB (Desde Cámara)
  // ═══════════════════════════════════════════════════════════════════════
  async function processTicketBlob(blob) {
    if (!blob) return;

    isScanning.value = true;
    let matchesFound = [];

    try {
      // 1. Preprocesar
      console.log("📷 Preprocesando imagen...");
      const processedImage = await preprocessImage(blob);

      // 2. Inicializar worker
      const w = await initWorker();

      // 3. Reconocer
      console.log("🔍 Reconociendo texto...");
      const {
        data: { text, confidence },
      } = await w.recognize(processedImage);

      console.log("📝 Texto escaneado:", text);
      console.log("📊 Confianza:", confidence.toFixed(1) + "%");

      // 4. Parsear
      const result = parseTicketData(text);
      matchesFound = result.matches;

      if (result.foundAny) {
        notify({
          type: "positive",
          message: `Datos detectados: ${result.matches.join(", ")}`,
        });
      } else {
        notify({
          type: "warning",
          message:
            "No se detectaron datos claros. Intente mejorar la iluminación.",
        });
      }
    } catch (error) {
      console.error("Error OCR:", error);
      notify({
        type: "negative",
        message: "Error al procesar la imagen: " + error.message,
      });
    } finally {
      isScanning.value = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PARSEAR DATOS
  // ═══════════════════════════════════════════════════════════════════════
  function parseTicketData(text) {
    let foundAny = false;
    let matches = [];

    // 1. Número de Ticket
    const ticketMatch = text.match(TICKET_PATTERNS.ticket);
    if (ticketMatch?.[1]) {
      formData.value.numero_ticket = ticketMatch[1];
      matches.push("Ticket: " + ticketMatch[1]);
      foundAny = true;
    }

    // 2. Cantidad
    const cantidadMatch = text.match(TICKET_PATTERNS.cantidad);
    if (cantidadMatch) {
      const cantidad = cantidadMatch[1] || cantidadMatch[2];
      if (cantidad) {
        formData.value.cantidad_despachada = parseInt(cantidad, 10);
        if (!formData.value.cantidad_solicitada) {
          formData.value.cantidad_solicitada = parseInt(cantidad, 10);
        }
        matches.push("Cant: " + cantidad);
        foundAny = true;
      }
    }

    // 3. Combustible -> Dispensador
    const combustibleMatch = text.match(TICKET_PATTERNS.combustible);
    if (combustibleMatch?.[1]) {
      const tipoCombustible = combustibleMatch[1].toUpperCase();
      const dispensador = props.dispensersList?.find(
        (d) => d.tipo_combustible === tipoCombustible
      );

      if (dispensador) {
        formData.value.id_dispensador = dispensador.id_dispensador;
        foundAny = true;
      }
    }

    // 4. Placa -> Vehículo
    const placaMatch = text.match(TICKET_PATTERNS.placa);
    if (placaMatch?.[1]) {
      const vehiculo = findVehicleByPlaca(placaMatch[1]);

      if (vehiculo) {
        formData.value.tipo_destino = "VEHICULO";
        resetDestinoFields?.();
        formData.value.id_vehiculo = vehiculo.id_vehiculo;

        // Actualizar opciones para mostrar todos
        setVehicleOptions?.([...props.vehiclesList]);

        if (vehiculo.id_chofer_default) {
          formData.value.id_chofer = vehiculo.id_chofer_default;
          setDriverOptions?.([...props.driversList]);
        }
        matches.push("Placa: " + vehiculo.placa);
        foundAny = true;
      }
    }

    // 5. Chofer (si no se asignó por defecto)
    if (!formData.value.id_chofer) {
      const chofer = findDriver(text);
      if (chofer) {
        formData.value.id_chofer = chofer.id_chofer;
        setDriverOptions?.([...props.driversList]);
        matches.push("Chofer: " + chofer.nombre);
        foundAny = true;
      }
    }

    // 6. Almacenista
    if (!formData.value.id_almacenista) {
      const almacenista = findWarehouseman(text);
      if (almacenista) {
        formData.value.id_almacenista = almacenista.id_almacenista;
        setWarehousemanOptions?.([...props.warehousemenList]);
        matches.push("Almacen: " + almacenista.nombre);
        foundAny = true;
      }
    }

    return { foundAny, matches };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════
  function findVehicleByPlaca(placaRaw) {
    const placaClean = placaRaw.replace(/[\s-]/g, "").toUpperCase();
    if (placaClean.length < 3) return null;

    return props.vehiclesList?.find((v) => {
      if (!v.placa && !v.label) return false;
      // Usar placa si existe, sino label
      const vText = (v.placa || v.label).replace(/[\s-]/g, "").toUpperCase();
      return (
        vText === placaClean ||
        placaClean.includes(vText) ||
        vText.includes(placaClean)
      );
    });
  }

  function findDriver(text) {
    const ciMatch = text.match(TICKET_PATTERNS.cedula);
    if (ciMatch) {
      const ciClean = ciMatch[1].replace(/\D/g, "");
      const byCI = props.driversList?.find(
        (d) => (d.cedula || "").replace(/\D/g, "") === ciClean
      );
      if (byCI) return byCI;
    }

    const nombreMatch = text.match(TICKET_PATTERNS.nombre);
    if (nombreMatch) {
      const nombreClean = nombreMatch[1].replace(/[^A-Z]/gi, "").toUpperCase();
      if (nombreClean.length < 4) return null;

      return props.driversList?.find((d) => {
        const fullName = `${d.nombre || ""} ${d.apellido || ""}`
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

  function findWarehouseman(text) {
    const almacenMatch = text.match(TICKET_PATTERNS.almacen);
    if (almacenMatch) {
      const nombreClean = almacenMatch[1].replace(/[^A-Z]/gi, "").toUpperCase();
      if (nombreClean.length < 4) return null;

      return props.warehousemenList?.find((w) => {
        const fullName = `${w.nombre || ""} ${w.apellido || ""}`
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

  // Cleanup
  onUnmounted(async () => {
    if (worker) {
      await worker.terminate();
    }
  });

  return {
    isScanning,
    processTicketBlob,
  };
}
