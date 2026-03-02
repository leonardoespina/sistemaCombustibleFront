import { createWorker } from "tesseract.js";
import { ref } from "vue";

export function useOCR() {
  const isProcessing = ref(false);
  const progress = ref(0);
  const error = ref(null);

  const extractData = (text) => {
    const lines = text.toUpperCase().split("\n");
    const result = {
      ticket: null,
      amount: null,
      plate: null,
      text: text, // For debugging
    };

    // Expresiones Regulares
    // Placa Vzla: 2 letras, 3 números, 2 letras (AA123BB) o versiones viejas/motos
    // Se busca patrón genérico de placa
    //const plateRegex =
    // /[A-Z]{2}[0-9]{3}[A-Z]{2}|[A-Z]{3}[0-9]{2}[A-Z]|[A-Z]{2}[0-9]{4}|[A-Z0-9]{6,7}/;
    const plateRegex = /Placa:?\s*([A-Z0-9]+)/i;

    // Cantidad: buscando números seguidos de L, LTS, Litros
    const amountRegex = /(\d+[.,]?\d*)\s*(?:L|LTS|LITROS)/i;

    // Ticket: buscando la palabra Ticket o Nro seguido de dígitos
    const ticketRegex =
      /(?:TICKET|RECIBO|FACTURA|NRO|NUMERO|NO\.)[\s:.]*(\d+)/i;

    for (const line of lines) {
      // Buscar Placa
      if (!result.plate) {
        const plateMatch = line.match(plateRegex);
        if (plateMatch) {
          result.plate = plateMatch[0];
        }
      }

      // Buscar Cantidad
      if (!result.amount) {
        const amountMatch = line.match(amountRegex);
        if (amountMatch) {
          // Normalizar decimales (coma a punto)
          result.amount = parseFloat(amountMatch[1].replace(",", "."));
        }
      }

      // Buscar Ticket (si no hay label explícito, a veces es el número más largo,
      // pero por seguridad buscamos label primero)
      if (!result.ticket) {
        const ticketMatch = line.match(ticketRegex);
        if (ticketMatch) {
          result.ticket = ticketMatch[1];
        }
      }
    }

    return result;
  };

  const processImage = async (imageBlob) => {
    isProcessing.value = true;
    progress.value = 0;
    error.value = null;

    let worker = null;

    try {
      worker = await createWorker("spa");

      const {
        data: { text },
      } = await worker.recognize(imageBlob);

      const extractedData = extractData(text);

      await worker.terminate();
      return extractedData;
    } catch (err) {
      console.error("OCR Error:", err);
      error.value = "Error al procesar la imagen: " + err.message;
      if (worker) {
        await worker.terminate();
      }
      throw err;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    processImage,
    isProcessing,
    progress,
    error,
  };
}
