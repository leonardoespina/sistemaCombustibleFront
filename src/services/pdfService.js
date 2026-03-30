import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Servicio centralizado para la generación de reportes en PDF.
 * Optimizado para alta fidelidad visual (Quasar Theme / Estilo Documento Formal).
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
   */
  exportReporteAgrupado({
    orientation = "l",
    title = "Reporte de Sistema",
    subtitle = "",
    groups = [], // [{ title: "GASOIL", columns: [], data: [], total: X }]
    fileName = "reporte_agrupado.pdf",
    logo = null,
    metadata = {},
  }) {
    const doc = new jsPDF({ orientation, unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let currentY = 15;

    // --- TÍTULO ---
    if (logo) {
      try { doc.addImage(logo, "PNG", pageWidth - 45, margin - 5, 30, 20); } catch (e) { }
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(title.toUpperCase(), margin, currentY);
    currentY += 7;

    if (subtitle) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(subtitle, margin, currentY);
      currentY += 7;
    }

    // --- METADATA EN 2 FILAS PARA EVITAR MONTAMIENTO ---
    const metaEntries = Object.entries(metadata);
    if (metaEntries.length) {
      doc.setFontSize(9);
      doc.setTextColor(40);

      // Fila 1: primeros 3 campos (Llenadero, Turno, Fecha Lote)
      const row1 = metaEntries.slice(0, 3);
      const col1Width = (pageWidth - margin * 2) / row1.length;
      row1.forEach(([key, value], idx) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${key}: `, margin + idx * col1Width, currentY);
        const labelW = doc.getTextWidth(`${key}: `);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), margin + idx * col1Width + labelW, currentY);
      });
      currentY += 5;

      // Fila 2: campos restantes (Período, Almacenista)
      const row2 = metaEntries.slice(3);
      if (row2.length) {
        const col2Width = (pageWidth - margin * 2) / row2.length;
        row2.forEach(([key, value], idx) => {
          doc.setFont("helvetica", "bold");
          doc.text(`${key}: `, margin + idx * col2Width, currentY);
          const labelW = doc.getTextWidth(`${key}: `);
          doc.setFont("helvetica", "normal");
          doc.text(String(value), margin + idx * col2Width + labelW, currentY);
        });
        currentY += 5;
      }
      currentY += 4;
    }

    // --- ITERAR POR GRUPOS (una tabla por combustible) ---
    groups.forEach((group) => {
      // Verificar si hay espacio suficiente; si no, nueva página
      if (currentY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        currentY = 15;
      }

      // Banda azul de encabezado del grupo
      doc.setFillColor(30, 116, 200);
      doc.rect(margin, currentY, pageWidth - margin * 2, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(group.title.toUpperCase(), margin + 5, currentY + 5.5);
      currentY += 9;

      // Calcular índice de columnas clave para colorear celdas
      const colLabels = group.columns.map(c => c.label);
      const idxDespachado = colLabels.indexOf("Despachado");
      const idxDiferencia = colLabels.indexOf("Diferencia");
      const idxSolicitado = colLabels.indexOf("Solicitado");
      // Columnas de stock son las que empiezan con "Stock "
      const idxStockStart = colLabels.findIndex(l => l.startsWith("Stock "));
      const idxStockEnd = colLabels.reduce((last, l, i) => l.startsWith("Stock ") ? i : last, -1);
      // Columna Total [combustible]
      const idxTotal = colLabels.findIndex(l => l.startsWith("Total "));

      autoTable(doc, {
        startY: currentY,
        head: [group.columns.map(col => col.label)],
        body: group.data.map((row) =>
          group.columns.map(col => {
            // Usar el campo o dataKey, SIN sobreescribir el número de ítem original
            const val = typeof col.field === "function" ? col.field(row) : row[col.dataKey];
            return val != null ? val : "—";
          })
        ),
        theme: "grid",
        headStyles: {
          fillColor: [240, 240, 240],
          fontSize: 7.5,
          halign: "center",
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          fontStyle: "normal",
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 1.2,
          textColor: [40, 40, 40],
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 7, halign: "center" },   // #
          1: { cellWidth: 20 },                     // Fecha/Hora
        },
        margin: { left: margin, right: margin, bottom: 18 },
        // Coloreo celda a celda igual que la vista web
        didParseCell: (hookData) => {
          if (hookData.section === "body") {
            const col = hookData.column.index;
            // Solicitado → alinear derecha
            if (col === idxSolicitado) {
              hookData.cell.styles.halign = "right";
            }
            // Despachado → azul negrita
            if (col === idxDespachado) {
              hookData.cell.styles.textColor = [25, 118, 210];
              hookData.cell.styles.fontStyle = "bold";
              hookData.cell.styles.halign = "right";
            }
            // Diferencia → verde
            if (col === idxDiferencia) {
              hookData.cell.styles.textColor = [46, 125, 50];
              hookData.cell.styles.fontStyle = "bold";
              hookData.cell.styles.halign = "right";
            }
            // Stock TQ* → naranja negrita
            if (idxStockStart >= 0 && col >= idxStockStart && col <= idxStockEnd) {
              hookData.cell.styles.textColor = [230, 100, 0];
              hookData.cell.styles.fontStyle = "bold";
              hookData.cell.styles.halign = "right";
            }
            // Total [combustible] → azul negrita
            if (col === idxTotal) {
              hookData.cell.styles.textColor = [25, 118, 210];
              hookData.cell.styles.fontStyle = "bold";
              hookData.cell.styles.halign = "right";
            }
          }
        },
      });

      currentY = doc.lastAutoTable.finalY + 4;

      // Total Despachado alineado a la derecha en rojo (igual que la imagen)
      if (group.total != null) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(200, 40, 40);
        const label = `Total Despachado ${group.title}: ${Number(group.total).toLocaleString()} L`;
        const labelW = doc.getTextWidth(label);
        doc.text(label, pageWidth - margin - labelW, currentY);
        currentY += 10;
      } else {
        currentY += 6;
      }
    });

    // --- FOOTER DE PÁGINAS ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, margin, doc.internal.pageSize.height - 8);
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
