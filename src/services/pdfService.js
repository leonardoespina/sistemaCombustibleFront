import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Servicio centralizado para la generación de reportes en PDF.
 * Optimizado para alta fidelidad visual (Quasar Theme / Estilo Documento Formal).  //
 */
export const pdfService = {
  /**
   * Genera un reporte tabular (Landscape).
   */
  exportTable({
    orientation = "l",
    title = "Reporte de Sistema",
    subtitle = "",
    columns = [],
    data = [],
    fileName = "reporte.pdf",
    logo = null,
    metadata = {},
  }) {
    const doc = new jsPDF({ orientation, unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let currentY = 15;

    if (logo) {
      try { doc.addImage(logo, "PNG", pageWidth - 45, margin - 5, 30, 20); } catch (e) { }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(title.toUpperCase(), margin, currentY);
    currentY += 8;

    if (subtitle) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(subtitle, margin, currentY);
      currentY += 10;
    }

    doc.setFontSize(11);
    doc.setTextColor(0);
    Object.entries(metadata).forEach(([key, value], index) => {
      const x = index % 2 === 0 ? margin : pageWidth / 2;
      doc.text(`${key}: ${value}`, x, currentY);
      if (index % 2 !== 0) currentY += 5;
    });

    autoTable(doc, {
      startY: currentY + 5,
      head: [columns.map(col => col.label)],
      body: data.map(row => columns.map(col => {
        const val = typeof col.field === 'function' ? col.field(row) : row[col.dataKey];
        return val != null ? val : "—";
      })),
      theme: "grid",
      headStyles: { fillColor: [60, 60, 60], fontSize: 9, halign: "center", textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9, cellPadding: 1.5, textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 25 }
      },
      didDrawPage: (d) => {
        const str = `Página ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(10);
        doc.text(str, margin, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(fileName);
  },

  /**
   * Genera un reporte tabular (Landscape) con múltiples tablas agrupadas (ej. por combustible).
   * Diseño premium: banda corporativa, metadata estructurada, tablas con estilo, footer con timestamp.
   */
  exportReporteAgrupado({
    orientation = "l",
    title = "Reporte de Sistema",
    subtitle = "",
    groups = [],
    fileName = "reporte_agrupado.pdf",
    logo = null,
    metadata = {},
  }) {
    // ── Paleta corporativa ───────────────────────────────────────────────────
    const BLUE_DARK   = [18,  65, 120];   // Encabezado tabla
    const BLUE_MID    = [30, 116, 200];   // Banner grupo
    const BLUE_LIGHT  = [210, 228, 255];  // Filas alternas
    const ACCENT_RED  = [196,  30,  58];  // Total Despachado
    const GRAY_TEXT   = [60,  60,  60];
    const WHITE       = [255, 255, 255];

    const doc = new jsPDF({ orientation, unit: "mm", format: "letter" });
    const pageWidth  = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    // ── Función helper: dibuja el encabezado del documento ──────────────────
    const drawDocHeader = (startY) => {
      let y = startY;

      // Banda superior decorativa
      doc.setFillColor(...BLUE_DARK);
      doc.rect(0, 0, pageWidth, 7, "F");

      // Logo (si existe)
      if (logo) {
        try { doc.addImage(logo, "PNG", pageWidth - 47, y, 32, 18); } catch (_) {}
      }

      // Título principal
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...BLUE_DARK);
      doc.text(title.toUpperCase(), margin, y + 3);
      y += 9;

      // Subtítulo
      if (subtitle) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...GRAY_TEXT);
        doc.text(subtitle, margin, y);
        y += 6;
      }

      // Línea separadora
      doc.setDrawColor(...BLUE_MID);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      // Metadata en dos columnas
      const entries = Object.entries(metadata);
      doc.setFontSize(10);
      entries.forEach(([key, value], idx) => {
        const col = idx % 2;
        const x   = col === 0 ? margin : pageWidth / 2 + 5;
        const row = Math.floor(idx / 2);
        const fy  = y + row * 6;

        // Etiqueta en negrita
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BLUE_DARK);
        doc.text(`${key}:`, x, fy);
        const labelW = doc.getTextWidth(`${key}: `);

        // Valor normal
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...GRAY_TEXT);
        doc.text(String(value), x + labelW, fy);
      });

      const metaRows = Math.ceil(entries.length / 2);
      y += metaRows * 6 + 6;

      return y;
    };

    // ── Renderizar encabezado en la primera página ───────────────────────────
    let currentY = drawDocHeader(12);

    // ── Iterar grupos ────────────────────────────────────────────────────────
    groups.forEach((group, gIdx) => {
      // Espacio mínimo para el banner + al menos 2 filas de datos
      if (currentY > pageHeight - 50 && gIdx > 0) {
        doc.addPage();
        currentY = drawDocHeader(12);
      }

      // Banner del grupo
      const bannerH = 9;
      doc.setFillColor(...BLUE_MID);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, bannerH, 1.5, 1.5, "F");

      // Indicador lateral más oscuro
      doc.setFillColor(...BLUE_DARK);
      doc.roundedRect(margin, currentY, 4, bannerH, 1, 1, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...WHITE);
      doc.text(group.title.toUpperCase(), margin + 8, currentY + 6);
      currentY += bannerH + 1;

      // ── Tabla del grupo ──────────────────────────────────────────────────
      autoTable(doc, {
        startY: currentY,
        head: [group.columns.map(col => col.label)],
        body: group.data.map((row, rIdx) =>
          group.columns.map(col => {
            let val = typeof col.field === "function" ? col.field(row) : row[col.dataKey];
            if (col.label === "#") val = rIdx + 1;
            return val != null ? val : "—";
          })
        ),
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 }, // ← Reducido para ganar milímetros valiosos
          textColor: [...GRAY_TEXT],
          lineWidth: 0.1,
          lineColor: [200, 210, 225],
          valign: "middle",
          overflow: "linebreak",     // ← NUNCA cortar texto con "...", envolver a la siguiente línea
        },
        headStyles: {
          fillColor: [...BLUE_DARK],
          textColor: [...WHITE],
          fontStyle: "bold",
          fontSize: 7.8,
          halign: "center",
          valign: "middle",
          overflow: "linebreak",
          cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 },
        },
        alternateRowStyles: {
          fillColor: [...BLUE_LIGHT],
        },
        columnStyles: (() => {
          // ── Anchos fijos reajustados. Total fijo: ~146 mm ────────────────
          // Ajustado para que quepan palabras clave completas ("Despachado") sin acaparar
          const cs = {
            0: { cellWidth: 5,  halign: "center", fontStyle: "bold" },
            1: { cellWidth: 20, halign: "left"   },  // Fecha/Hora
            2: { cellWidth: 25, halign: "left"   },  // Solicitante
            3: { cellWidth: 21, halign: "center" },  // Placa
            4: { cellWidth: 26, halign: "left"   },  // Sub-dep.
            5: { cellWidth: 15, halign: "right"  },  // Solicitado
            6: { cellWidth: 18, halign: "right"  },  // Despachado (necesita algo más para que quepa el título)
            7: { cellWidth: 16, halign: "right"  },  // Diferencia
          };
          // ── Anchos dinámicos para Stock / Total / Almacén / PCP ────────────
          group.columns.forEach((col, idx) => {
            if (idx >= 8) {
              cs[idx] = {
                // Dejamos que jsPDF decida el ancho en las dinámicas 
                // para que NUNCA desborde el margen derecho (suma >251mm)
                halign: col.halign || "right"
              };
            }
          });
          return cs;
        })(),
        margin: { left: margin, right: margin, bottom: 22 },
        tableWidth: pageWidth - 2 * margin,  // ← Fuerza la justificación perfecta, autotable encoje las dinámicas para que quepa
        didDrawPage: (hookData) => {
          if (hookData.pageNumber > 1) {
            doc.setFillColor(...BLUE_DARK);
            doc.rect(0, 0, pageWidth, 4, "F");
          }
        },
      });

      currentY = doc.lastAutoTable.finalY;

      // ── Línea separadora bajo la tabla ──────────────────────────────────
      doc.setDrawColor(...BLUE_MID);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY + 1, pageWidth - margin, currentY + 1);
      currentY += 4;

      // ── Total Despachado ─────────────────────────────────────────────────
      if (group.total != null) {
        const totalLabel = `Total Despachado ${group.title.toUpperCase()}:`;
        const totalValue = `  ${Number(group.total).toLocaleString("es-VE", { minimumFractionDigits: 2 })} L`;

        // Caja de total
        const boxW  = 90;
        const boxH  = 8;
        const boxX  = pageWidth - margin - boxW;
        doc.setFillColor(255, 245, 247);
        doc.setDrawColor(...ACCENT_RED);
        doc.setLineWidth(0.4);
        doc.roundedRect(boxX, currentY, boxW, boxH, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...ACCENT_RED);
        const fullText = totalLabel + totalValue;
        const textW = doc.getTextWidth(fullText);
        doc.text(fullText, pageWidth - margin - 3 - textW, currentY + 5.5);

        currentY += boxH + 6;
      } else {
        currentY += 5;
      }
    });

    // ── Footer en cada página ────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    const now = new Date();
    const timestamp = now.toLocaleDateString("es-VE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }) + " " + now.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 8;

      // Línea del footer
      doc.setDrawColor(180, 190, 210);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

      // Timestamp izquierda
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 140);
      doc.text(`Generado: ${timestamp}`, margin, footerY);

      // Página derecha
      const pageStr = `Página ${i} de ${pageCount}`;
      const pageStrW = doc.getTextWidth(pageStr);
      doc.text(pageStr, pageWidth - margin - pageStrW, footerY);

      // Centro: nombre del sistema
      doc.setFont("helvetica", "italic");
      const centerStr = "Sistema de Control de Combustible";
      const centerW   = doc.getTextWidth(centerStr);
      doc.text(centerStr, (pageWidth - centerW) / 2, footerY);
    }

    doc.save(fileName);
  },

  /**
   * Genera el Acta de Cierre con FIDELIDAD TOTAL al diseño del componente Vue.
   * Asegura que el PDF sea idéntico a la vista previa en ActaViewerDialog.vue.
   */
  exportActa({
    title = "ACTA DE CIERRE",
    logo = null,
    bodyText = "", // Soporta **negrita**
    gasolina = [], // [{ label, value }]
    gasoil = [],
    resumenGasolina = [],
    totalGasoil = "",
    signatureData = [],
    observacion = "",
    fileName = "acta.pdf",
    metadata = {}
  }) {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let currentY = 12;

    // --- ENCABEZADO SUPERIOR ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40);
    doc.text("Prevención y Control de Pérdidas", margin, currentY);
    currentY += 3;
    doc.text("FGE-PCP-04 01/04/2024", margin, currentY);

    // Logo más pequeño y ajustado
    if (logo) {
      try { doc.addImage(logo, "PNG", pageWidth - 45, currentY - 8, 30, 15); } catch (e) { }
    }
    currentY += 15;

    // --- TÍTULO ---
    doc.setFontSize(19);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: "center" });
    // Subrayado
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    const titleWidth = doc.getTextWidth(title.toUpperCase());
    doc.line(pageWidth / 2 - titleWidth / 2, currentY + 1, pageWidth / 2 + titleWidth / 2, currentY + 1);
    currentY += 10;

    // --- METADATA (TURNO / INSPECTOR) ---
    const drawLabeledValue = (label, value, y) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(label.toUpperCase() + ":", margin, y);
      const labelW = doc.getTextWidth(label.toUpperCase() + ": ");

      // Escribir el valor (sea texto o línea base)
      doc.setFont("helvetica", "normal");
      doc.text(value || "_________", margin + labelW, y);

      // Subrayar el valor
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      const valueWidth = doc.getTextWidth(value || "_________");
      doc.line(margin + labelW, y + 0.5, margin + labelW + valueWidth, y + 0.5);
    };

    drawLabeledValue("TURNO", metadata.turno, currentY);
    currentY += 6;
    drawLabeledValue("INSPECTOR DE SERVICIO", metadata.inspector, currentY);
    currentY += 10;

    // --- PÁRRAFO NARRATIVO CON NEGRITAS ---
    const renderRichParagraph = (text, x, y, maxWidth) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      const lineHeight = 4.5;
      let curX = x;
      let curY = y;

      parts.forEach(part => {
        const isBold = part.startsWith("**") && part.endsWith("**");
        const cleanPart = isBold ? part.slice(2, -2) : part;
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setFontSize(10);

        const words = cleanPart.split(" ");
        words.forEach((word, i) => {
          const wordToDraw = (i === words.length - 1) ? word : word + " ";
          const wWidth = doc.getTextWidth(wordToDraw);
          if (curX + wWidth > x + maxWidth) {
            curX = x; curY += lineHeight;
          }
          doc.text(wordToDraw, curX, curY);
          curX += wWidth;
        });
      });
      return curY;
    };

    currentY = renderRichParagraph(bodyText, margin, currentY, pageWidth - (margin * 2)) + 15;

    // --- TANQUES (DOS COLUMNAS) ---
    const startYInventory = currentY;

    // Gasolina (Columna Izquierda)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TANQUES GASOLINA:", margin, currentY);
    currentY += 4;

    doc.setFontSize(10);
    gasolina.forEach(t => {
      doc.setFont("helvetica", "bold");
      const text = `${t.label}: ${t.value}`;
      doc.text(text, margin, currentY);
      // Subrayado como en Vue: style="text-decoration: underline"
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY + 0.8, margin + doc.getTextWidth(text), currentY + 0.8);
      currentY += 6;
    });

    currentY += 4;
    resumenGasolina.forEach(r => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(r.label.toUpperCase() + ":", margin, currentY);
      const lw = doc.getTextWidth(r.label.toUpperCase() + ": ");
      doc.setFont("helvetica", "normal");
      doc.text(r.value, margin + lw, currentY);
      doc.line(margin + lw, currentY + 0.8, margin + lw + doc.getTextWidth(r.value), currentY + 0.8);
      currentY += 5;
    });

    // Gasoil (Columna Derecha)
    let rightY = startYInventory;
    const rightX = pageWidth / 2 + 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TANQUES GASOIL:", rightX, rightY);
    rightY += 4;

    doc.setFontSize(10);
    gasoil.forEach(t => {
      doc.setFont("helvetica", "bold");
      const text = `${t.label}: ${t.value}`;
      doc.text(text, rightX, rightY);
      doc.line(rightX, rightY + 0.8, rightX + doc.getTextWidth(text), rightY + 0.8);
      rightY += 6;
    });

    rightY += 4;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", rightX, rightY);
    const tw = doc.getTextWidth("TOTAL: ");
    doc.setFont("helvetica", "normal");
    doc.text(totalGasoil, rightX + tw, rightY);
    doc.line(rightX + tw, rightY + 0.8, rightX + tw + doc.getTextWidth(totalGasoil), rightY + 0.8);

    currentY = Math.max(currentY, rightY) + 15;

    // --- OBSERVACIÓN ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("OBSERVACIÓN:", margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.text(observacion || "", margin, currentY);
    // Líneas
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2); // Línea 1
    currentY += 7;
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2); // Línea 2
    currentY += 10;

    // --- FIRMAS ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("QUIENES FIRMAN:", margin, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["Departamento", "Nombre y Apellido", "Cédula", "Firma"]],
      body: signatureData.map(s => [s.dept, s.name, s.id, ""]),
      theme: "grid",
      styles: {
        fontSize: 10,
        minCellHeight: 12,
        valign: 'middle',
        halign: 'center',
        textColor: 0,
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [245, 245, 245],
        fontStyle: "bold",
        textColor: 0,
        lineWidth: 0.2
      },
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - 2 * margin,
      columnStyles: {
        0: { cellWidth: (pageWidth - 2 * margin) * 0.25, fontStyle: 'bold' }, // Departamento en negrita
        1: { cellWidth: (pageWidth - 2 * margin) * 0.35 },
        2: { cellWidth: (pageWidth - 2 * margin) * 0.25 },
        3: { cellWidth: (pageWidth - 2 * margin) * 0.15 }
      },
      didDrawPage: (data) => {
        // Asegurar bordes visibles
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
      }
    });

    // --- PIE DE PÁGINA ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Gerencia de Prevención y Control de Pérdidas.", pageWidth / 2, pageHeight - 10, { align: "center" });

    // Verificar que todo cabe en una sola hoja
    const finalY = doc.lastAutoTable?.finalY || currentY;
    if (finalY > pageHeight - 30) {
      console.warn("El contenido puede exceder una página carta. Ajustando márgenes.");
      // Podríamos reducir márgenes o ajustar tamaños, pero por ahora continuamos.
    }

    doc.save(fileName);
  }
};
